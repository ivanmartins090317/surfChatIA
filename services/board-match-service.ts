import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import {
  chatJsonCompletionWithVision,
  type AiImageInput,
} from "@/lib/ai/client";
import {
  buildBoardMatchSystemPrompt,
  buildBoardMatchUserPrompt,
} from "@/lib/ai/board-spec-prompt";
import { parseBoardMatchResult } from "@/lib/ai/board-spec-parser";
import type { Analysis, BoardMatchResult } from "@/lib/domain/types";
import { reportServerError } from "@/lib/observability/report-server-error";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getBoard } from "@/services/board-service";
import { getProfile } from "@/services/profile-service";

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VISION_PHOTOS = 4;

const BOARD_PHOTO_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function downloadBoardPhotoBuffers(
  storagePaths: string[],
): Promise<AiImageInput[]> {
  const supabase = await createClient();
  const images: AiImageInput[] = [];

  for (const storagePath of storagePaths.slice(0, MAX_VISION_PHOTOS)) {
    const { data, error } = await supabase.storage
      .from("boards")
      .download(storagePath);

    if (error || !data) {
      throw new Error("Não foi possível carregar fotos para análise visual.");
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const ext = storagePath.split(".").pop()?.toLowerCase();
    const mimeType =
      BOARD_PHOTO_MIME_BY_EXT[ext ?? ""] ?? data.type ?? "image/jpeg";

    if (!mimeType.startsWith("image/")) {
      throw new Error("Arquivo não é uma imagem válida para análise visual.");
    }

    images.push({ base64: buffer.toString("base64"), mimeType });
  }

  if (images.length === 0) {
    throw new Error("Nenhuma foto disponível para análise visual.");
  }

  return images;
}

export async function uploadCandidatePhotos(
  userId: string,
  files: File[],
): Promise<string[]> {
  if (files.length < 1) {
    throw new Error("Envie pelo menos uma foto da prancha candidata.");
  }

  const paths: string[] = [];
  const supabase = await createClient();
  const batchId = randomUUID();

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    const mime = detected?.mime ?? file.type;

    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error("Foto acima de 10 MB.");
    }
    if (!ALLOWED_IMAGE_MIMES.has(mime)) {
      throw new Error("Formato não suportado.");
    }

    const ext = detected?.ext ?? "jpg";
    const path = `${userId}/candidates/${batchId}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("boards")
      .upload(path, buffer, { contentType: mime, upsert: false });

    if (error) {
      throw new Error("Falha no upload.");
    }
    paths.push(path);
  }

  return paths;
}

export async function createBoardMatchAnalysis(input: {
  userId: string;
  photoPaths: string[];
  referenceBoardId?: string | null;
  advertisedMeasurements?: Record<string, number | null> | null;
}): Promise<Analysis> {
  const rate = await rateLimitAiAction(input.userId);
  if (!rate.allowed) {
    throw new Error("Limite diário de análises atingido.");
  }

  const profile = await getProfile(input.userId);
  const magicBoard = input.referenceBoardId
    ? await getBoard(input.userId, input.referenceBoardId)
    : null;

  const supabase = await createClient();
  const { data: row, error: insertError } = await supabase
    .from("analyses")
    .insert({
      user_id: input.userId,
      type: "board_match",
      status: "processing",
      board_candidate_photos: input.photoPaths,
      reference_board_id: input.referenceBoardId ?? null,
      advertised_measurements: input.advertisedMeasurements ?? null,
    })
    .select("*")
    .single();

  if (insertError || !row) {
    throw new Error("Não foi possível iniciar a análise.");
  }

  try {
    const images = await downloadBoardPhotoBuffers(input.photoPaths);
    const raw = await chatJsonCompletionWithVision(
      buildBoardMatchSystemPrompt(),
      buildBoardMatchUserPrompt({
        profile,
        magicBoard,
        photoCount: input.photoPaths.length,
        advertisedMeasurements: input.advertisedMeasurements,
      }),
      images,
    );

    const result: BoardMatchResult = parseBoardMatchResult(raw);

    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({ status: "done", result_json: result })
      .eq("id", row.id)
      .eq("user_id", input.userId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throw new Error("Falha ao salvar resultado.");
    }

    return updated as Analysis;
  } catch (error) {
    await supabase
      .from("analyses")
      .update({ status: "error" })
      .eq("id", row.id)
      .eq("user_id", input.userId);

    reportServerError(error, {
      area: "ai",
      operation: "create_board_match_analysis",
      userId: input.userId,
    });

    const message =
      error instanceof Error ? error.message : "Erro na análise.";
    throw new Error(message);
  }
}

export async function getBoardMatchAnalysis(
  userId: string,
  analysisId: string,
): Promise<Analysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .eq("type", "board_match")
    .maybeSingle();

  if (error) {
    throw new Error("Análise não encontrada.");
  }

  return data as Analysis | null;
}

export interface BoardMatchListItem {
  analysis: Analysis;
  referenceBoardName: string | null;
}

export async function listBoardMatchAnalyses(
  userId: string,
): Promise<BoardMatchListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "board_match")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar análises de compatibilidade.");
  }

  const analyses = (data ?? []) as Analysis[];
  const referenceIds = [
    ...new Set(
      analyses
        .map((analysis) => analysis.reference_board_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const boardNames = new Map<string, string>();
  if (referenceIds.length > 0) {
    const { data: boards } = await supabase
      .from("boards")
      .select("id, name")
      .eq("user_id", userId)
      .in("id", referenceIds);

    for (const board of boards ?? []) {
      boardNames.set(board.id, board.name ?? "Prancha mágica");
    }
  }

  return analyses.map((analysis) => ({
    analysis,
    referenceBoardName: analysis.reference_board_id
      ? (boardNames.get(analysis.reference_board_id) ?? "Prancha mágica")
      : null,
  }));
}
