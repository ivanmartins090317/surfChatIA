import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { chatJsonCompletion } from "@/lib/ai/client";
import {
  buildBoardSpecSystemPrompt,
  buildBoardSpecUserPrompt,
} from "@/lib/ai/board-spec-prompt";
import { parseBoardSpecResult } from "@/lib/ai/board-spec-parser";
import type { Board, BoardSensation } from "@/lib/domain/types";
import { reportServerError } from "@/lib/observability/report-server-error";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";

export const MAX_BOARD_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const createBoardSchema = z.object({
  name: z.string().max(80).optional().nullable(),
  length_in: z.coerce.number().positive().optional().nullable(),
  width_in: z.coerce.number().positive().optional().nullable(),
  thickness_in: z.coerce.number().positive().optional().nullable(),
  volume_l: z.coerce.number().positive().optional().nullable(),
  sensation_json: z
    .object({
      mar_pequeno: z.string().optional(),
      mar_grande: z.string().optional(),
      pontos_fortes: z.array(z.string()).optional(),
      pontos_fracos: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
});

export async function createMagicBoard(
  userId: string,
  input: z.infer<typeof createBoardSchema>,
): Promise<Board> {
  const parsed = createBoardSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("boards")
    .insert({
      user_id: userId,
      is_magic: true,
      ...parsed,
      status: "draft",
      photo_paths: [],
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("Não foi possível criar a prancha.");
  }

  return data as Board;
}

export async function uploadBoardPhoto(
  userId: string,
  boardId: string,
  file: File,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime ?? file.type;

  if (file.size > MAX_BOARD_PHOTO_BYTES) {
    throw new Error("Foto acima de 10 MB. Reduza o tamanho.");
  }

  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new Error("Formato não suportado. Use JPEG, PNG ou WebP.");
  }

  const ext = detected?.ext ?? "jpg";
  const path = `${userId}/${boardId}/${randomUUID()}.${ext}`;

  const supabase = await createClient();
  const board = await getBoard(userId, boardId);
  if (!board) {
    throw new Error("Prancha não encontrada.");
  }

  const { error: uploadError } = await supabase.storage
    .from("boards")
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (uploadError) {
    reportServerError(uploadError, {
      area: "upload",
      operation: "upload_board_photo",
      userId,
    });
    throw new Error("Falha no upload da foto.");
  }

  const photoPaths = [...board.photo_paths, path];
  const { error: updateError } = await supabase
    .from("boards")
    .update({ photo_paths: photoPaths })
    .eq("id", boardId)
    .eq("user_id", userId);

  if (updateError) {
    reportServerError(updateError, {
      area: "upload",
      operation: "register_board_photo",
      userId,
    });
    throw new Error("Não foi possível registrar a foto.");
  }

  return path;
}

export async function updateMagicBoard(
  userId: string,
  boardId: string,
  input: z.infer<typeof createBoardSchema>,
): Promise<Board> {
  const parsed = createBoardSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("boards")
    .update({
      name: parsed.name,
      length_in: parsed.length_in,
      width_in: parsed.width_in,
      thickness_in: parsed.thickness_in,
      volume_l: parsed.volume_l,
      sensation_json: parsed.sensation_json,
    })
    .eq("id", boardId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível atualizar a prancha.");
  }

  return data as Board;
}

export async function processMagicBoardSpec(
  userId: string,
  boardId: string,
): Promise<Board> {
  const rate = await rateLimitAiAction(userId);
  if (!rate.allowed) {
    throw new Error("Limite diário de análises atingido.");
  }

  const board = await getBoard(userId, boardId);
  if (!board) {
    throw new Error("Prancha não encontrada.");
  }

  if (board.photo_paths.length < 3) {
    throw new Error("Envie pelo menos 3 fotos antes de gerar a ficha.");
  }

  const supabase = await createClient();
  await supabase
    .from("boards")
    .update({ status: "processing" })
    .eq("id", boardId)
    .eq("user_id", userId);

  try {
    const profile = await getProfile(userId);
    const raw = await chatJsonCompletion(
      buildBoardSpecSystemPrompt(),
      buildBoardSpecUserPrompt({
        profile,
        measurements: {
          length_in: board.length_in,
          width_in: board.width_in,
          thickness_in: board.thickness_in,
          volume_l: board.volume_l,
        },
        sensation: board.sensation_json as BoardSensation | null,
        photoCount: board.photo_paths.length,
        name: board.name,
      }),
    );

    const parsed = parseBoardSpecResult(raw);

    const { data, error } = await supabase
      .from("boards")
      .update({
        status: "ready",
        spec_json: parsed.spec,
        ai_summary: parsed.ai_summary,
      })
      .eq("id", boardId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("Falha ao salvar ficha técnica.");
    }

    return data as Board;
  } catch (error) {
    await supabase
      .from("boards")
      .update({ status: "error" })
      .eq("id", boardId)
      .eq("user_id", userId);

    reportServerError(error, {
      area: "ai",
      operation: "process_magic_board_spec",
      userId,
    });

    const message =
      error instanceof Error ? error.message : "Erro ao gerar ficha.";
    throw new Error(message);
  }
}

export async function listMagicBoards(userId: string): Promise<Board[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("user_id", userId)
    .eq("is_magic", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar pranchas.");
  }

  return (data ?? []) as Board[];
}

export async function getBoard(
  userId: string,
  boardId: string,
): Promise<Board | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Prancha não encontrada.");
  }

  return data as Board | null;
}

export async function createSignedBoardPhotoUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("boards")
    .createSignedUrl(storagePath, 3600);

  if (error) return null;
  return data.signedUrl;
}

export interface BoardPhotoView {
  path: string;
  url: string;
}

/** Quantas fotos carregam na página; o restante abre sob demanda. */
export const BOARD_GALLERY_VISIBLE_COUNT = 2;

export async function getBoardPhotoViews(
  photoPaths: string[],
): Promise<BoardPhotoView[]> {
  const views = await Promise.all(
    photoPaths.map(async (path) => {
      const url = await createSignedBoardPhotoUrl(path);
      return url ? { path, url } : null;
    }),
  );

  return views.filter((view): view is BoardPhotoView => view !== null);
}

export async function getInitialBoardPhotoViews(photoPaths: string[]): Promise<{
  visible: BoardPhotoView[];
  extraPaths: string[];
}> {
  const visiblePaths = photoPaths.slice(0, BOARD_GALLERY_VISIBLE_COUNT);
  const extraPaths = photoPaths.slice(BOARD_GALLERY_VISIBLE_COUNT);

  return {
    visible: await getBoardPhotoViews(visiblePaths),
    extraPaths,
  };
}
