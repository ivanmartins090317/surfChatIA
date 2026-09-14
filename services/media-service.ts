import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import type {
  Analysis,
  AnalysisFocus,
  MediaItem,
  MediaType,
  WaveType,
} from "@/lib/domain/types";
import { validateExternalVideoUrl } from "@/lib/security/url-validator";
import { reportServerError } from "@/lib/observability/report-server-error";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  imageOversizeMessage,
  videoOversizeMessage,
} from "@/lib/media/upload-limits";
import {
  buildMediaFrameStoragePath,
  buildMediaStoragePath,
  buildCoachingImageStoragePath,
  inferMediaExtension,
  isMediaStoragePathOwned,
} from "@/lib/media/storage-path";
import {
  MIN_VIDEO_FRAMES,
  VIDEO_FRAME_COUNT,
} from "@/lib/media/video-frame-sampling";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VIDEO_MIMES_SET = ALLOWED_VIDEO_MIMES;
const ALLOWED_IMAGE_MIMES_SET = ALLOWED_IMAGE_MIMES;

/** Teto binário por frame JPEG (~2 MB de base64 na action ≈ 1,5 MB). */
const MAX_FRAME_BYTES = 2 * 1024 * 1024;

const createMediaSchema = z.object({
  type: z.enum(["video", "image", "link"]),
  wave_type: z
    .enum(["beach_break", "point", "reef", "river_mouth", "other"])
    .optional()
    .nullable(),
  focus: z.enum(["speed", "maneuvers", "consistency"]).optional().nullable(),
  external_url: z.string().url().optional().nullable(),
});

export async function createMediaItem(
  userId: string,
  input: z.infer<typeof createMediaSchema>,
): Promise<MediaItem> {
  const parsed = createMediaSchema.parse(input);

  if (parsed.type === "link") {
    const validation = validateExternalVideoUrl(parsed.external_url ?? "");
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_items")
    .insert({
      user_id: userId,
      type: parsed.type,
      external_url:
        parsed.type === "link" ? parsed.external_url ?? null : null,
      wave_type: parsed.wave_type ?? null,
      focus: parsed.focus ?? null,
      status: parsed.type === "link" ? "ready" : "uploading",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Não foi possível registrar a mídia.");
  }

  return normalizeMediaItem(data);
}

const prepareMediaUploadSchema = z.object({
  type: z.enum(["video", "image"]),
  file_size: z.number().int().positive(),
  mime_type: z.string().min(1),
  file_name: z.string().min(1),
  wave_type: createMediaSchema.shape.wave_type,
  focus: createMediaSchema.shape.focus,
});

export interface PreparedMediaUpload {
  mediaId: string;
  /** Path do arquivo original no Storage — só para foto; vídeo novo usa frames. */
  storagePath: string | null;
}

function assertAllowedImageUpload(fileSize: number, mimeType: string): void {
  if (fileSize > MAX_IMAGE_BYTES) {
    throw new Error(imageOversizeMessage());
  }
  if (!ALLOWED_IMAGE_MIMES_SET.has(mimeType.toLowerCase())) {
    throw new Error("Formato de arquivo não suportado.");
  }
}

function assertAllowedVideoMime(mimeType: string): void {
  if (!ALLOWED_VIDEO_MIMES_SET.has(mimeType.toLowerCase())) {
    throw new Error("Formato de arquivo não suportado.");
  }
}

/** Sanity check no aparelho: o MP4 não sobe, mas tamanho absurdo ainda é recusado. */
function assertVideoDeviceSize(fileSize: number): void {
  if (fileSize > MAX_VIDEO_BYTES) {
    throw new Error(videoOversizeMessage());
  }
}

export async function prepareMediaFileUpload(
  userId: string,
  input: z.infer<typeof prepareMediaUploadSchema>,
): Promise<PreparedMediaUpload> {
  const parsed = prepareMediaUploadSchema.parse(input);

  if (parsed.type === "image") {
    assertAllowedImageUpload(parsed.file_size, parsed.mime_type);
  } else {
    assertAllowedVideoMime(parsed.mime_type);
    assertVideoDeviceSize(parsed.file_size);
  }

  const media = await createMediaItem(userId, {
    type: parsed.type,
    wave_type: parsed.wave_type ?? null,
    focus: parsed.focus ?? null,
  });

  if (parsed.type === "video") {
    return { mediaId: media.id, storagePath: null };
  }

  const extension = inferMediaExtension(parsed.mime_type, parsed.file_name);
  const storagePath = buildMediaStoragePath(userId, media.id, extension);

  return { mediaId: media.id, storagePath };
}

export async function finalizeMediaFileUpload(
  userId: string,
  mediaId: string,
  storagePath: string,
): Promise<string> {
  if (!isMediaStoragePathOwned(userId, mediaId, storagePath)) {
    throw new Error("Caminho de upload inválido.");
  }

  const supabase = await createClient();
  const folderPath = `${userId}/${mediaId}`;
  const fileName = storagePath.slice(folderPath.length + 1);
  const { data: objects, error: listError } = await supabase.storage
    .from("media")
    .list(folderPath, { search: fileName, limit: 1 });

  if (listError || !objects?.length) {
    throw new Error("Arquivo não encontrado no storage. Tente enviar novamente.");
  }

  const uploaded = objects[0];
  const media = await getMediaItem(userId, mediaId);
  if (!media || media.type !== "image" || media.status !== "uploading") {
    throw new Error("Upload inválido ou já finalizado.");
  }

  const detectedMime = uploaded.metadata?.mimetype ?? "image/jpeg";

  if (uploaded.metadata?.size) {
    assertAllowedImageUpload(uploaded.metadata.size, detectedMime);
  } else if (!ALLOWED_IMAGE_MIMES_SET.has(detectedMime.toLowerCase())) {
    throw new Error("Formato de arquivo não suportado.");
  }

  const { error: updateError } = await supabase
    .from("media_items")
    .update({ storage_path: storagePath, status: "ready" })
    .eq("id", mediaId)
    .eq("user_id", userId);

  if (updateError) {
    reportServerError(updateError, {
      area: "upload",
      operation: "finalize_media_upload",
      userId,
    });
    throw new Error("Não foi possível finalizar o upload.");
  }

  return storagePath;
}

export interface PersistableVideoFrame {
  base64: string;
  mimeType: "image/jpeg";
  timestampLabel: string;
}

export async function persistMediaVideoFrames(
  userId: string,
  mediaId: string,
  frames: PersistableVideoFrame[],
): Promise<string[]> {
  if (
    frames.length < MIN_VIDEO_FRAMES ||
    frames.length > VIDEO_FRAME_COUNT
  ) {
    throw new Error(
      "Quantidade de fotos da session inválida. Extraia o vídeo novamente.",
    );
  }

  const media = await getMediaItem(userId, mediaId);
  if (!media || media.type !== "video" || media.status !== "uploading") {
    throw new Error("Upload inválido ou já finalizado.");
  }

  const supabase = await createClient();
  const framePaths: string[] = [];

  for (const frame of frames) {
    if (frame.mimeType !== "image/jpeg") {
      throw new Error("As fotos da session devem ser JPEG.");
    }

    const buffer = Buffer.from(frame.base64, "base64");
    if (buffer.length === 0 || buffer.length > MAX_FRAME_BYTES) {
      throw new Error(
        "Foto da session inválida ou grande demais. Tente extrair o vídeo novamente.",
      );
    }

    const path = buildMediaFrameStoragePath(userId, mediaId);
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      reportServerError(uploadError, {
        area: "upload",
        operation: "persist_media_video_frames",
        userId,
      });
      throw new Error(
        "Não foi possível gravar as fotos da session. Tente novamente.",
      );
    }

    framePaths.push(path);
  }

  const { error: updateError } = await supabase
    .from("media_items")
    .update({
      frame_paths: framePaths,
      storage_path: null,
      status: "ready",
    })
    .eq("id", mediaId)
    .eq("user_id", userId);

  if (updateError) {
    reportServerError(updateError, {
      area: "upload",
      operation: "finalize_media_frames",
      userId,
    });
    throw new Error(
      "Não foi possível gravar as fotos da session. Tente novamente.",
    );
  }

  return framePaths;
}

export async function persistCoachingImage(
  userId: string,
  mediaId: string,
  analysisId: string,
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType !== "image/png") {
    throw new Error("Foto anotada com tipo não suportado.");
  }

  const path = buildCoachingImageStoragePath(userId, mediaId, analysisId);
  if (!isMediaStoragePathOwned(userId, mediaId, path)) {
    throw new Error("Caminho de coaching inválido.");
  }

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: mimeType, upsert: false });

  if (error) {
    reportServerError(error, {
      area: "upload",
      operation: "persist_coaching_image",
      userId,
    });
    throw new Error("Não foi possível gravar a foto anotada.");
  }

  return path;
}

export async function uploadMediaFile(
  userId: string,
  mediaId: string,
  file: File,
  type: MediaType,
): Promise<string> {
  if (type === "video") {
    throw new Error(
      "Vídeo deve ser analisado pelas fotos da session no aparelho. Use o fluxo de análise por arquivo.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime ?? file.type;

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(imageOversizeMessage());
  }

  if (!ALLOWED_IMAGE_MIMES_SET.has(mime)) {
    throw new Error("Formato de arquivo não suportado.");
  }

  const ext = detected?.ext ?? "jpg";
  const path = `${userId}/${mediaId}/${randomUUID()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    reportServerError(uploadError, {
      area: "upload",
      operation: "upload_media_file",
      userId,
    });
    throw new Error("Falha no upload. Tente novamente.");
  }

  const { error: updateError } = await supabase
    .from("media_items")
    .update({ storage_path: path, status: "ready" })
    .eq("id", mediaId)
    .eq("user_id", userId);

  if (updateError) {
    reportServerError(updateError, {
      area: "upload",
      operation: "finalize_media_upload",
      userId,
    });
    throw new Error("Não foi possível finalizar o upload.");
  }

  return path;
}

export async function listMediaItems(userId: string): Promise<MediaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar mídias.");
  }

  return (data ?? []).map(normalizeMediaItem);
}

export async function getMediaItem(
  userId: string,
  mediaId: string,
): Promise<MediaItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("id", mediaId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Mídia não encontrada.");
  }

  return data ? normalizeMediaItem(data) : null;
}

function normalizeMediaItem(row: unknown): MediaItem {
  const item = row as MediaItem & { frame_paths?: string[] | null };
  return {
    ...item,
    frame_paths: Array.isArray(item.frame_paths) ? item.frame_paths : [],
  };
}

export async function downloadMediaFileBuffer(
  storagePath: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("media")
    .download(storagePath);

  if (error || !data) {
    throw new Error("Não foi possível baixar a mídia para análise.");
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const ext = storagePath.split(".").pop()?.toLowerCase();
  const mimeByExt: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  const mimeType = mimeByExt[ext ?? ""] ?? data.type ?? "application/octet-stream";

  return { buffer, mimeType };
}

export async function createSignedMediaUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(storagePath, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

export type { AnalysisFocus, WaveType };

export async function listAnalyses(userId: string): Promise<Analysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar análises.");
  }

  return (data ?? []) as Analysis[];
}

export async function getAnalysis(
  userId: string,
  analysisId: string,
): Promise<Analysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Análise não encontrada.");
  }

  return data as Analysis | null;
}
