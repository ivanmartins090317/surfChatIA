import { after } from "next/server";
import { editCoachingFrame } from "@/lib/ai/edit-coaching-image";
import {
  WAVE_COACHING_VISUAL_ENABLED,
  needsCoachingVisual,
  selectCoachingPhases,
} from "@/lib/ai/wave-coaching";
import type {
  Analysis,
  CoachingVisualStatus,
  PerformanceResult,
  WavePhase,
} from "@/lib/domain/types";
import { reportServerError } from "@/lib/observability/report-server-error";
import { createClient } from "@/lib/supabase/server";
import {
  downloadMediaFileBuffer,
  getMediaItem,
  persistCoachingImage,
} from "@/services/media-service";

export function scheduleWaveCoachingVisuals(input: {
  userId: string;
  analysisId: string;
  mediaId: string;
  result: PerformanceResult;
}): void {
  if (!needsCoachingVisual(input.result)) return;

  try {
    after(() => {
      void applyWaveCoachingVisuals(input.userId, input.analysisId).catch(
        (error) => {
          reportServerError(error, {
            area: "ai",
            operation: "wave_coaching_after",
            userId: input.userId,
          });
        },
      );
    });
  } catch {
    // Sem contexto de request: o poller da tela dispara o passo 2.
  }
}

export async function applyWaveCoachingVisuals(
  userId: string,
  analysisId: string,
): Promise<void> {
  if (!WAVE_COACHING_VISUAL_ENABLED) return;

  const analysis = await loadOwnedAnalysis(userId, analysisId);
  if (!analysis) return;

  const result = asPerformanceResult(analysis.result_json);
  if (!result || result.coaching_visual_status !== "pending") return;
  if (!analysis.media_item_id) {
    await persistCoachingStatus(userId, analysisId, result, "skipped");
    return;
  }

  const claimed = await claimCoachingProcessing(userId, analysisId, result);
  if (!claimed) return;

  try {
    const updated = await generateCoachingImages(
      userId,
      analysisId,
      analysis.media_item_id,
      claimed,
    );
    await persistAnalysisResult(userId, analysisId, updated);
  } catch (error) {
    reportServerError(error, {
      area: "ai",
      operation: "wave_coaching_visuals",
      userId,
    });
    await persistCoachingStatus(userId, analysisId, claimed, "skipped");
  }
}

async function generateCoachingImages(
  userId: string,
  analysisId: string,
  mediaId: string,
  result: PerformanceResult,
): Promise<PerformanceResult> {
  const fases = result.fases ?? [];
  const candidates = selectCoachingPhases(fases);
  if (candidates.length === 0) {
    return { ...result, coaching_visual_status: "skipped" };
  }

  const media = await getMediaItem(userId, mediaId);
  const framePaths = media?.frame_paths ?? [];
  if (!media || media.type !== "video" || framePaths.length === 0) {
    return { ...result, coaching_visual_status: "skipped" };
  }

  const edits = await Promise.allSettled(
    candidates.map((phase) =>
      editAndStorePhase({
        userId,
        mediaId,
        analysisId,
        phase,
        framePath: framePaths[phase.frame_index],
      }),
    ),
  );

  const pathByKey = new Map<string, string>();
  for (const [index, outcome] of edits.entries()) {
    if (outcome.status !== "fulfilled") {
      reportServerError(outcome.reason, {
        area: "ai",
        operation: "wave_coaching_phase",
        userId,
      });
      continue;
    }
    const phase = candidates[index];
    pathByKey.set(phaseKey(phase), outcome.value);
  }

  const nextFases = fases.map((fase) => {
    const path = pathByKey.get(phaseKey(fase));
    return path ? { ...fase, coaching_image_path: path } : fase;
  });

  return {
    ...result,
    fases: nextFases,
    coaching_visual_status: pathByKey.size > 0 ? "ready" : "skipped",
  };
}

async function editAndStorePhase(input: {
  userId: string;
  mediaId: string;
  analysisId: string;
  phase: WavePhase;
  framePath: string | undefined;
}): Promise<string> {
  if (!input.framePath) {
    throw new Error("Foto da evidência ausente para coaching.");
  }

  const { buffer, mimeType } = await downloadMediaFileBuffer(input.framePath);
  if (!mimeType.startsWith("image/")) {
    throw new Error("Foto da evidência inválida para coaching.");
  }

  const edited = await editCoachingFrame({
    phase: input.phase,
    sourceBytes: buffer,
    sourceMimeType: mimeType,
  });

  return persistCoachingImage(
    input.userId,
    input.mediaId,
    input.analysisId,
    edited.bytes,
    edited.mimeType,
  );
}

function phaseKey(phase: WavePhase): string {
  return `${phase.frame_index}:${phase.nome}`;
}

async function loadOwnedAnalysis(
  userId: string,
  analysisId: string,
): Promise<Analysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .eq("type", "performance")
    .maybeSingle();

  if (error || !data) return null;
  return data as Analysis;
}

function asPerformanceResult(
  value: Analysis["result_json"],
): PerformanceResult | null {
  if (!value || typeof value !== "object") return null;
  if ("veredito" in value) return null;
  return value as PerformanceResult;
}

async function claimCoachingProcessing(
  userId: string,
  analysisId: string,
  result: PerformanceResult,
): Promise<PerformanceResult | null> {
  const claimed: PerformanceResult = {
    ...result,
    coaching_visual_status: "processing",
  };
  const saved = await persistAnalysisResult(userId, analysisId, claimed);
  return saved ? claimed : null;
}

async function persistCoachingStatus(
  userId: string,
  analysisId: string,
  result: PerformanceResult,
  status: CoachingVisualStatus,
): Promise<void> {
  await persistAnalysisResult(userId, analysisId, {
    ...result,
    coaching_visual_status: status,
  });
}

async function persistAnalysisResult(
  userId: string,
  analysisId: string,
  result: PerformanceResult,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("analyses")
    .update({ result_json: result })
    .eq("id", analysisId)
    .eq("user_id", userId);

  return !error;
}
