"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult, Analysis } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { createPerformanceAnalysis } from "@/services/analysis-service";
import {
  createMediaItem,
  uploadMediaFile,
} from "@/services/media-service";

const contextSchema = z.object({
  wave_type: z
    .enum(["beach_break", "point", "reef", "river_mouth", "other"])
    .optional(),
  focus: z.enum(["speed", "maneuvers", "consistency"]).optional(),
});

export async function createAnalysisFromLinkAction(
  formData: FormData,
): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const user = await requireAuthUser();
    const externalUrl = String(formData.get("external_url") ?? "").trim();
    const context = contextSchema.parse({
      wave_type: formData.get("wave_type") || undefined,
      focus: formData.get("focus") || undefined,
    });

    const media = await createMediaItem(user.id, {
      type: "link",
      external_url: externalUrl,
      ...context,
    });

    const analysis = await createPerformanceAnalysis(user.id, media.id);
    revalidatePath("/analyses");
    redirect(`/analyses/${analysis.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao analisar link.";
    return { success: false, error: message };
  }
}

export async function createAnalysisFromFileAction(
  formData: FormData,
): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const user = await requireAuthUser();
    const file = formData.get("file");
    const mediaType = String(formData.get("media_type") ?? "video") as
      | "video"
      | "image";

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Selecione um arquivo válido." };
    }

    const context = contextSchema.parse({
      wave_type: formData.get("wave_type") || undefined,
      focus: formData.get("focus") || undefined,
    });

    const media = await createMediaItem(user.id, {
      type: mediaType,
      ...context,
    });

    await uploadMediaFile(user.id, media.id, file, mediaType);
    const analysis = await createPerformanceAnalysis(user.id, media.id);
    revalidatePath("/analyses");
    redirect(`/analyses/${analysis.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao processar upload.";
    return { success: false, error: message };
  }
}

export async function retryAnalysisAction(
  analysisId: string,
): Promise<ActionResult<Analysis>> {
  try {
    const user = await requireAuthUser();
    const { getPerformanceAnalysis } = await import(
      "@/services/analysis-service"
    );
    const existing = await getPerformanceAnalysis(user.id, analysisId);
    if (!existing?.media_item_id) {
      return { success: false, error: "Análise não encontrada." };
    }

    const analysis = await createPerformanceAnalysis(
      user.id,
      existing.media_item_id,
    );
    revalidatePath(`/analyses/${analysisId}`);
    return { success: true, data: analysis };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao reprocessar.";
    return { success: false, error: message };
  }
}
