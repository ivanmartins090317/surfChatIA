import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { chatJsonCompletion } from "@/lib/ai/client";
import {
  buildBoardMatchSystemPrompt,
  buildBoardMatchUserPrompt,
} from "@/lib/ai/board-spec-prompt";
import { parseBoardMatchResult } from "@/lib/ai/board-spec-parser";
import type { Analysis, BoardMatchResult } from "@/lib/domain/types";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getBoard } from "@/services/board-service";
import { getProfile } from "@/services/profile-service";

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

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
  const rate = rateLimitAiAction(input.userId);
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
    const raw = await chatJsonCompletion(
      buildBoardMatchSystemPrompt(),
      buildBoardMatchUserPrompt({
        profile,
        magicBoard,
        photoCount: input.photoPaths.length,
        advertisedMeasurements: input.advertisedMeasurements,
      }),
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
