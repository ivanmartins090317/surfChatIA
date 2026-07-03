"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult, Analysis } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import {
  createBoardMatchAnalysis,
  uploadCandidatePhotos,
} from "@/services/board-match-service";

export async function createBoardMatchAction(
  formData: FormData,
): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const user = await requireAuthUser();
    const files = formData.getAll("photos").filter((f) => f instanceof File) as File[];
    const referenceBoardId =
      String(formData.get("reference_board_id") ?? "") || null;

    const photoPaths = await uploadCandidatePhotos(user.id, files);

    const advertisedMeasurements = {
      length_in: formData.get("length_in")
        ? Number(formData.get("length_in"))
        : null,
      width_in: formData.get("width_in")
        ? Number(formData.get("width_in"))
        : null,
      volume_l: formData.get("volume_l")
        ? Number(formData.get("volume_l"))
        : null,
    };

    const analysis = await createBoardMatchAnalysis({
      userId: user.id,
      photoPaths,
      referenceBoardId,
      advertisedMeasurements,
    });

    revalidatePath("/compatibility");
    redirect(`/compatibility/${analysis.id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro na compatibilidade.";
    return { success: false, error: message };
  }
}

export async function getBoardMatchResultAction(
  analysisId: string,
): Promise<ActionResult<Analysis>> {
  try {
    const user = await requireAuthUser();
    const { getBoardMatchAnalysis } = await import(
      "@/services/board-match-service"
    );
    const analysis = await getBoardMatchAnalysis(user.id, analysisId);
    if (!analysis) {
      return { success: false, error: "Análise não encontrada." };
    }
    return { success: true, data: analysis };
  } catch {
    return { success: false, error: "Erro ao carregar análise." };
  }
}
