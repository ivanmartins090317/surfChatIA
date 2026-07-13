"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { submitProductFeedback } from "@/services/feedback-service";

const feedbackFormSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  page_path: z.string().max(500).optional(),
});

export async function submitFeedbackAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuthUser();
    const parsed = feedbackFormSchema.safeParse({
      rating: formData.get("rating"),
      comment: formData.get("comment"),
      page_path: formData.get("page_path"),
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Dados inválidos. Verifique e tente de novo.";
      return { success: false, error: message };
    }

    const result = await submitProductFeedback(user.id, {
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
      page_path: parsed.data.page_path ?? null,
    });

    revalidatePath("/admin/feedback");
    return { success: true, data: result };
  } catch {
    return {
      success: false,
      error: "Não foi possível enviar sua avaliação. Tente novamente.",
    };
  }
}
