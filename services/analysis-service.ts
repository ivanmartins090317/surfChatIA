import { runPerformanceAnalysis } from "@/lib/ai/analyze-performance";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";
import type {
  Analysis,
  MediaItem,
  PerformanceResult,
} from "@/lib/domain/types";
import type { PerformanceAnalysisListItem } from "@/lib/domain/analysis-display";
import type { ExtractedVideoFrame } from "@/lib/media/extract-video-frames";
import { extractVideoFrames } from "@/lib/media/extract-video-frames";
import { reportServerError } from "@/lib/observability/report-server-error";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  createSignedMediaUrl,
  downloadMediaFileBuffer,
  getMediaItem,
} from "@/services/media-service";
import { getProfile } from "@/services/profile-service";

interface AnalysisRowWithMedia extends Analysis {
  media_items: MediaItem | null;
}

function mapAnalysisRow(row: AnalysisRowWithMedia): PerformanceAnalysisListItem {
  return {
    analysis: {
      id: row.id,
      user_id: row.user_id,
      media_item_id: row.media_item_id,
      board_id: row.board_id,
      type: row.type,
      result_json: row.result_json,
      status: row.status,
      reference_board_id: row.reference_board_id,
      board_candidate_photos: row.board_candidate_photos,
      advertised_measurements: row.advertised_measurements,
      created_at: row.created_at,
    },
    media: row.media_items,
    previewUrl: null,
  };
}

async function attachPreviewUrls(
  items: PerformanceAnalysisListItem[],
): Promise<PerformanceAnalysisListItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.media?.type === "image" && item.media.storage_path) {
        const previewUrl = await createSignedMediaUrl(item.media.storage_path);
        return { ...item, previewUrl };
      }
      return item;
    }),
  );
}

export interface CreatePerformanceAnalysisOptions {
  videoFrames?: ExtractedVideoFrame[];
}

export async function createPerformanceAnalysis(
  userId: string,
  mediaItemId: string,
  options?: CreatePerformanceAnalysisOptions,
): Promise<Analysis> {
  const rate = await rateLimitAiAction(userId);
  if (!rate.allowed) {
    throw new Error("Limite diário de análises atingido. Tente amanhã.");
  }

  const media = await getMediaItem(userId, mediaItemId);
  if (!media) {
    throw new Error("Mídia não encontrada.");
  }

  const supabase = await createClient();
  const { data: analysisRow, error: insertError } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      media_item_id: mediaItemId,
      type: "performance",
      status: "processing",
    })
    .select("*")
    .single();

  if (insertError || !analysisRow) {
    throw new Error("Não foi possível iniciar a análise.");
  }

  await supabase
    .from("media_items")
    .update({ status: "processing" })
    .eq("id", mediaItemId)
    .eq("user_id", userId);

  try {
    const profile = await getProfile(userId);

    let images: { base64: string; mimeType: string }[] | undefined;
    let videoFrameTimestamps: string[] | undefined;

    if (media.type === "image" && media.storage_path) {
      const { buffer, mimeType } = await downloadMediaFileBuffer(
        media.storage_path,
      );
      if (!mimeType.startsWith("image/")) {
        throw new Error("Arquivo não é uma imagem válida para análise visual.");
      }
      images = [{ base64: buffer.toString("base64"), mimeType }];
    }

    if (media.type === "video" && media.storage_path) {
      if (options?.videoFrames?.length) {
        images = options.videoFrames.map((frame) => ({
          base64: frame.base64,
          mimeType: frame.mimeType,
        }));
        videoFrameTimestamps = options.videoFrames.map(
          (frame) => frame.timestampLabel,
        );
      } else if (process.env.NODE_ENV === "development") {
        const { buffer, mimeType } = await downloadMediaFileBuffer(
          media.storage_path,
        );
        if (!mimeType.startsWith("video/")) {
          throw new Error("Arquivo não é um vídeo válido para análise.");
        }
        const frames = await extractVideoFrames(buffer, mimeType);
        images = frames.map((frame) => ({
          base64: frame.base64,
          mimeType: frame.mimeType,
        }));
        videoFrameTimestamps = frames.map((frame) => frame.timestampLabel);
      } else {
        throw new Error(
          "Frames do vídeo não foram enviados. Atualize a página e tente novamente.",
        );
      }
    }

    const raw = await runPerformanceAnalysis({
      media,
      profile,
      images,
      videoFrameTimestamps,
    });

    const result: PerformanceResult = parsePerformanceResult(raw);

    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({ status: "done", result_json: result })
      .eq("id", analysisRow.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    await supabase
      .from("media_items")
      .update({ status: "ready" })
      .eq("id", mediaItemId)
      .eq("user_id", userId);

    if (updateError || !updated) {
      throw new Error("Falha ao salvar resultado.");
    }

    return updated as Analysis;
  } catch (error) {
    await supabase
      .from("analyses")
      .update({ status: "error" })
      .eq("id", analysisRow.id)
      .eq("user_id", userId);

    await supabase
      .from("media_items")
      .update({ status: "error" })
      .eq("id", mediaItemId)
      .eq("user_id", userId);

    reportServerError(error, {
      area: "ai",
      operation: "create_performance_analysis",
      userId,
    });

    const message =
      error instanceof Error ? error.message : "Erro ao processar análise.";
    throw new Error(message);
  }
}

export async function listPerformanceAnalysesWithMedia(
  userId: string,
): Promise<PerformanceAnalysisListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*, media_items(*)")
    .eq("user_id", userId)
    .eq("type", "performance")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar análises.");
  }

  const items = ((data ?? []) as AnalysisRowWithMedia[]).map(mapAnalysisRow);
  return attachPreviewUrls(items);
}

export async function getPerformanceAnalysisDetail(
  userId: string,
  analysisId: string,
): Promise<PerformanceAnalysisListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*, media_items(*)")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .eq("type", "performance")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const item = mapAnalysisRow(data as AnalysisRowWithMedia);
  if (item.media?.type === "image" && item.media.storage_path) {
    item.previewUrl = await createSignedMediaUrl(item.media.storage_path);
  }
  return item;
}

/** @deprecated Use listPerformanceAnalysesWithMedia */
export async function listPerformanceAnalyses(
  userId: string,
): Promise<Analysis[]> {
  const items = await listPerformanceAnalysesWithMedia(userId);
  return items.map((item) => item.analysis);
}

/** @deprecated Use getPerformanceAnalysisDetail */
export async function getPerformanceAnalysis(
  userId: string,
  analysisId: string,
): Promise<Analysis | null> {
  const detail = await getPerformanceAnalysisDetail(userId, analysisId);
  return detail?.analysis ?? null;
}
