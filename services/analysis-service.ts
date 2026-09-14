import { runPerformanceAnalysis } from "@/lib/ai/analyze-performance";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";
import { toPersistedPerformanceResult } from "@/lib/ai/wave-coaching";
import type { Analysis, MediaItem } from "@/lib/domain/types";
import type { PerformanceAnalysisListItem } from "@/lib/domain/analysis-display";
import type { ExtractedVideoFrame } from "@/lib/media/extract-video-frames";
import { LEGACY_VIDEO_REANALYSIS_MESSAGE } from "@/lib/media/upload-limits";
import { MIN_VIDEO_FRAMES } from "@/lib/media/video-frame-sampling";
import { reportServerError } from "@/lib/observability/report-server-error";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  createSignedMediaUrl,
  downloadMediaFileBuffer,
  getMediaItem,
} from "@/services/media-service";
import { getProfile } from "@/services/profile-service";
import {
  runWithAnalysisCreditGate,
  withSystemAutoRetries,
} from "@/services/usage-service";
import { scheduleWaveCoachingVisuals } from "@/services/wave-coaching-service";

interface AnalysisRowWithMedia extends Analysis {
  media_items: MediaItem | null;
}

function mapAnalysisRow(row: AnalysisRowWithMedia): PerformanceAnalysisListItem {
  const media = row.media_items
    ? {
        ...row.media_items,
        frame_paths: Array.isArray(row.media_items.frame_paths)
          ? row.media_items.frame_paths
          : [],
      }
    : null;

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
    media,
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

async function loadFramesFromStorage(
  framePaths: string[],
): Promise<ExtractedVideoFrame[]> {
  const frames: ExtractedVideoFrame[] = [];

  for (const [index, path] of framePaths.entries()) {
    const { buffer, mimeType } = await downloadMediaFileBuffer(path);
    if (!mimeType.startsWith("image/")) {
      throw new Error("Foto da session inválida no armazenamento.");
    }
    frames.push({
      base64: buffer.toString("base64"),
      mimeType: "image/jpeg",
      timestampLabel: `f${index + 1}`,
    });
  }

  return frames;
}

async function resolveVideoFramesForAnalysis(
  media: MediaItem,
  options?: CreatePerformanceAnalysisOptions,
): Promise<{
  images: { base64: string; mimeType: string }[];
  videoFrameTimestamps: string[];
}> {
  if (options?.videoFrames && options.videoFrames.length >= MIN_VIDEO_FRAMES) {
    return {
      images: options.videoFrames.map((frame) => ({
        base64: frame.base64,
        mimeType: frame.mimeType,
      })),
      videoFrameTimestamps: options.videoFrames.map(
        (frame) => frame.timestampLabel,
      ),
    };
  }

  const framePaths = media.frame_paths ?? [];
  if (framePaths.length >= MIN_VIDEO_FRAMES) {
    const frames = await loadFramesFromStorage(framePaths);
    return {
      images: frames.map((frame) => ({
        base64: frame.base64,
        mimeType: frame.mimeType,
      })),
      videoFrameTimestamps: frames.map((frame) => frame.timestampLabel),
    };
  }

  throw new Error(LEGACY_VIDEO_REANALYSIS_MESSAGE);
}

export interface CreatePerformanceAnalysisOptions {
  videoFrames?: ExtractedVideoFrame[];
}

export async function createPerformanceAnalysis(
  userId: string,
  mediaItemId: string,
  options?: CreatePerformanceAnalysisOptions,
): Promise<Analysis> {
  return runWithAnalysisCreditGate({
    userId,
    analysisType: "performance",
    getAnalysisId: (analysis) => analysis.id,
    operation: async () => {
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
            throw new Error(
              "Arquivo não é uma imagem válida para análise visual.",
            );
          }
          images = [{ base64: buffer.toString("base64"), mimeType }];
        }

        if (media.type === "video") {
          const resolved = await resolveVideoFramesForAnalysis(media, options);
          images = resolved.images;
          videoFrameTimestamps = resolved.videoFrameTimestamps;
        }

        const parsed = await withSystemAutoRetries(async () => {
          const raw = await runPerformanceAnalysis({
            media,
            profile,
            images,
            videoFrameTimestamps,
          });
          return parsePerformanceResult(raw);
        });

        const result = toPersistedPerformanceResult(
          media.type,
          parsed,
          videoFrameTimestamps,
        );

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

        scheduleWaveCoachingVisuals({
          userId,
          analysisId: updated.id,
          mediaId: mediaItemId,
          result,
        });

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
    },
  });
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
