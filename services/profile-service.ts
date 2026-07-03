import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Profile, SurfLevel, WaveType } from "@/lib/domain/types";

const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(80).optional(),
  surf_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  weight_kg: z.coerce.number().min(30).max(200).optional().nullable(),
  height_cm: z.coerce.number().min(120).max(230).optional().nullable(),
  wave_type: z
    .enum(["beach_break", "point", "reef", "river_mouth", "other"])
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar o perfil.");
  }

  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const parsed = updateProfileSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(parsed)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error("Não foi possível salvar o perfil. Tente novamente.");
  }

  return data as Profile;
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.surf_level &&
      profile.weight_kg &&
      profile.height_cm &&
      profile.wave_type,
  );
}

export type { SurfLevel, WaveType };
