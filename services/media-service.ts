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
} from "@/lib/media/upload-limits";
import {
  buildMediaStoragePath,
  inferMediaExtension,
  isMediaStoragePathOwned,
} from "@/lib/media/storage-path";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_VIDEO_MIMES_SET = ALLOWED_VIDEO_MIMES;
const ALLOWED_IMAGE_MIMES_SET = ALLOWED_IMAGE_MIMES;

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

  return data as MediaItem;
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
  storagePath: string;
}

function assertAllowedMediaUpload(
  type: MediaType,
  fileSize: number,
  mimeType: string,
): void {
  const maxSize = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (fileSize > maxSize) {
    throw new Error(
      type === "video"
        ? "Vídeo acima de 100 MB. Comprima ou envie um link."
        : "Imagem acima de 10 MB. Reduza o tamanho.",
    );
  }

  const allowed =
    type === "video" ? ALLOWED_VIDEO_MIMES_SET : ALLOWED_IMAGE_MIMES_SET;
  const mime = mimeType.toLowerCase();
  if (!allowed.has(mime)) {
    throw new Error("Formato de arquivo não suportado.");
  }
}

export async function prepareMediaFileUpload(
  userId: string,
  input: z.infer<typeof prepareMediaUploadSchema>,
): Promise<PreparedMediaUpload> {
  const parsed = prepareMediaUploadSchema.parse(input);
  assertAllowedMediaUpload(parsed.type, parsed.file_size, parsed.mime_type);

  const media = await createMediaItem(userId, {
    type: parsed.type,
    wave_type: parsed.wave_type ?? null,
    focus: parsed.focus ?? null,
  });

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
  if (!media || media.status !== "uploading") {
    throw new Error("Upload inválido ou já finalizado.");
  }

  const detectedMime =
    uploaded.metadata?.mimetype ??
    (media.type === "video" ? "video/mp4" : "image/jpeg");

  if (uploaded.metadata?.size) {
    assertAllowedMediaUpload(
      media.type as MediaType,
      uploaded.metadata.size,
      detectedMime,
    );
  } else {
    const allowed =
      media.type === "video" ? ALLOWED_VIDEO_MIMES_SET : ALLOWED_IMAGE_MIMES_SET;
    if (!allowed.has(detectedMime.toLowerCase())) {
      throw new Error("Formato de arquivo não suportado.");
    }
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

export async function uploadMediaFile(
  userId: string,
  mediaId: string,
  file: File,
  type: MediaType,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime ?? file.type;

  const maxSize = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxSize) {
    throw new Error(
      type === "video"
        ? "Vídeo acima de 100 MB. Comprima ou envie um link."
        : "Imagem acima de 10 MB. Reduza o tamanho.",
    );
  }

  const allowed =
    type === "video" ? ALLOWED_VIDEO_MIMES_SET : ALLOWED_IMAGE_MIMES_SET;
  if (!allowed.has(mime)) {
    throw new Error("Formato de arquivo não suportado.");
  }

  const ext = detected?.ext ?? (type === "video" ? "mp4" : "jpg");
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

  return (data ?? []) as MediaItem[];
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

  return data as MediaItem | null;
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
