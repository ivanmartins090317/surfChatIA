"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, Profile } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import {
  getProfile,
  updateProfile,
  type UpdateProfileInput,
} from "@/services/profile-service";

const profileFormSchema = z.object({
  display_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  surf_level: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Selecione seu nível de surf.",
  }),
  weight_kg: z.coerce
    .number({ invalid_type_error: "Informe um peso válido." })
    .min(30, "Peso mínimo: 30 kg.")
    .max(200, "Peso máximo: 200 kg."),
  height_cm: z.coerce
    .number({ invalid_type_error: "Informe uma altura válida." })
    .min(120, "Altura mínima: 120 cm.")
    .max(230, "Altura máxima: 230 cm."),
  wave_type: z.enum(["beach_break", "point", "reef", "river_mouth", "other"], {
    required_error: "Selecione o tipo de onda.",
  }),
});

export async function fetchProfileAction(): Promise<ActionResult<Profile>> {
  try {
    const user = await requireAuthUser();
    const profile = await getProfile(user.id);
    if (!profile) {
      return { success: false, error: "Perfil não encontrado." };
    }
    return { success: true, data: profile };
  } catch {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function saveProfileAction(
  formData: FormData,
): Promise<ActionResult<Profile>> {
  try {
    const user = await requireAuthUser();
    const parsed = profileFormSchema.safeParse({
      display_name: formData.get("display_name"),
      surf_level: formData.get("surf_level"),
      weight_kg: formData.get("weight_kg"),
      height_cm: formData.get("height_cm"),
      wave_type: formData.get("wave_type"),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return { success: false, error: firstError };
    }

    const profile = await updateProfile(
      user.id,
      parsed.data satisfies UpdateProfileInput,
    );
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true, data: profile };
  } catch {
    return {
      success: false,
      error: "Não foi possível salvar. Verifique os dados e tente de novo.",
    };
  }
}
