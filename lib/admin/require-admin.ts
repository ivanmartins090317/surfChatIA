import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";

export async function isAdminUser(userId: string): Promise<boolean> {
  const profile = await getProfile(userId).catch(() => null);
  return profile?.role === "admin";
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Não autenticado");
  }

  const isAdmin = await isAdminUser(user.id);
  if (!isAdmin) {
    throw new Error("Acesso negado");
  }

  return user;
}
