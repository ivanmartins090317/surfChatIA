"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, Analysis } from "@/lib/domain/types";
import { toActionErrorMessage } from "@/lib/errors/action-error";
import { requireAuthUser } from "@/lib/supabase/server";
import { createPerformanceAnalysis } from "@/services/analysis-service";
import {
  createMediaItem,
  finalizeMediaFileUpload,
  prepareMediaFileUpload,
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
    return { success: true, data: { analysisId: analysis.id } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível analisar o link. Verifique a URL e tente novamente.",
      ),
    };
  }
}

export async function initAnalysisFileUploadAction(input: {
  media_type: "video" | "image";
  file_size: number;
  mime_type: string;
  file_name: string;
  wave_type?: string;
  focus?: string;
}): Promise<ActionResult<{ mediaId: string; storagePath: string }>> {
  try {
    const user = await requireAuthUser();
    const context = contextSchema.parse({
      wave_type: input.wave_type || undefined,
      focus: input.focus || undefined,
    });

    const prepared = await prepareMediaFileUpload(user.id, {
      type: input.media_type,
      file_size: input.file_size,
      mime_type: input.mime_type,
      file_name: input.file_name,
      wave_type: context.wave_type ?? null,
      focus: context.focus ?? null,
    });

    return { success: true, data: prepared };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível iniciar o upload. Tente novamente.",
      ),
    };
  }
}

export async function completeAnalysisFileUploadAction(input: {
  media_id: string;
  storage_path: string;
}): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const user = await requireAuthUser();
    await finalizeMediaFileUpload(user.id, input.media_id, input.storage_path);
    const analysis = await createPerformanceAnalysis(user.id, input.media_id);
    revalidatePath("/analyses");
    return { success: true, data: { analysisId: analysis.id } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível processar o arquivo. Tente novamente ou envie um link.",
      ),
    };
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
    return { success: true, data: { analysisId: analysis.id } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível processar o arquivo. Tente novamente ou envie um link.",
      ),
    };
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
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro ao reprocessar a análise."),
    };
  }
}
