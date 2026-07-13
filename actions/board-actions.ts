"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, Board } from "@/lib/domain/types";
import { toActionErrorMessage } from "@/lib/errors/action-error";
import { requireAuthUser } from "@/lib/supabase/server";
import {
  createMagicBoard,
  createSignedBoardPhotoUrl,
  processMagicBoardSpec,
  updateMagicBoard,
  uploadBoardPhoto,
} from "@/services/board-service";

const boardMetaSchema = z.object({
  name: z.string().max(80).optional(),
  length_in: z.coerce.number().positive().optional(),
  width_in: z.coerce.number().positive().optional(),
  thickness_in: z.coerce.number().positive().optional(),
  volume_l: z.coerce.number().positive().optional(),
  mar_pequeno: z.string().optional(),
  mar_grande: z.string().optional(),
  pontos_fortes: z.string().optional(),
  pontos_fracos: z.string().optional(),
});

export async function createBoardDraftAction(
  formData: FormData,
): Promise<ActionResult<{ boardId: string }>> {
  try {
    const user = await requireAuthUser();
    const boardInput = parseBoardFormData(formData);

    const board = await createMagicBoard(user.id, boardInput);
    await uploadPhotosFromFormData(user.id, board.id, formData);

    revalidatePath("/boards");
    return { success: true, data: { boardId: board.id } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro ao criar prancha."),
    };
  }
}

function parseBoardFormData(formData: FormData) {
  const parsed = boardMetaSchema.parse({
    name: formData.get("name") || undefined,
    length_in: formData.get("length_in") || undefined,
    width_in: formData.get("width_in") || undefined,
    thickness_in: formData.get("thickness_in") || undefined,
    volume_l: formData.get("volume_l") || undefined,
    mar_pequeno: formData.get("mar_pequeno") || undefined,
    mar_grande: formData.get("mar_grande") || undefined,
    pontos_fortes: formData.get("pontos_fortes") || undefined,
    pontos_fracos: formData.get("pontos_fracos") || undefined,
  });

  const sensation = {
    mar_pequeno: parsed.mar_pequeno,
    mar_grande: parsed.mar_grande,
    pontos_fortes: parsed.pontos_fortes
      ? parsed.pontos_fortes.split("\n").filter(Boolean)
      : undefined,
    pontos_fracos: parsed.pontos_fracos
      ? parsed.pontos_fracos.split("\n").filter(Boolean)
      : undefined,
  };

  return {
    name: parsed.name ?? null,
    length_in: parsed.length_in ?? null,
    width_in: parsed.width_in ?? null,
    thickness_in: parsed.thickness_in ?? null,
    volume_l: parsed.volume_l ?? null,
    sensation_json: sensation,
  };
}

async function uploadPhotosFromFormData(
  userId: string,
  boardId: string,
  formData: FormData,
) {
  const files = formData.getAll("photos").filter((f) => f instanceof File);
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      await uploadBoardPhoto(userId, boardId, file);
    }
  }
}

export async function updateBoardAction(
  boardId: string,
  formData: FormData,
): Promise<ActionResult<{ boardId: string }>> {
  try {
    const user = await requireAuthUser();
    const boardInput = parseBoardFormData(formData);

    await updateMagicBoard(user.id, boardId, boardInput);
    await uploadPhotosFromFormData(user.id, boardId, formData);

    revalidatePath(`/boards/${boardId}`);
    revalidatePath(`/boards/${boardId}/edit`);
    revalidatePath("/boards");
    return { success: true, data: { boardId } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro ao atualizar prancha."),
    };
  }
}

export async function generateBoardSpecAction(
  boardId: string,
): Promise<ActionResult<Board>> {
  try {
    const user = await requireAuthUser();
    const board = await processMagicBoardSpec(user.id, boardId);
    revalidatePath(`/boards/${boardId}`);
    revalidatePath("/boards");
    return { success: true, data: board };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro ao gerar ficha técnica."),
    };
  }
}

export async function uploadBoardPhotosAction(
  boardId: string,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthUser();
    const files = formData.getAll("photos").filter((f) => f instanceof File);

    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        await uploadBoardPhoto(user.id, boardId, file);
      }
    }

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro no upload das fotos."),
    };
  }
}

export async function fetchBoardPhotoUrlAction(
  storagePath: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireAuthUser();

    if (!storagePath.startsWith(`${user.id}/`)) {
      return { success: false, error: "Foto não encontrada." };
    }

    const url = await createSignedBoardPhotoUrl(storagePath);
    if (!url) {
      return { success: false, error: "Não foi possível carregar a foto." };
    }

    return { success: true, data: { url } };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(error, "Erro ao carregar foto."),
    };
  }
}
