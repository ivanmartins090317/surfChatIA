"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rateLimitAuthAction } from "@/lib/security/rate-limit";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/domain/types";

function getIdentifier(formData: FormData): string {
  return String(formData.get("email") ?? "unknown").toLowerCase();
}

export async function signUpAction(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  const rate = await rateLimitAuthAction(getIdentifier(formData));
  if (!rate.allowed) {
    return {
      success: false,
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  if (!email || password.length < 8) {
    return {
      success: false,
      error: "E-mail válido e senha com pelo menos 8 caracteres são obrigatórios.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
    },
  });

  if (error) {
    return {
      success: false,
      error: "Não foi possível criar a conta. Verifique o e-mail ou tente outro.",
    };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { email } };
}

export async function signInAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const rate = await rateLimitAuthAction(getIdentifier(formData));
  if (!rate.allowed) {
    return {
      success: false,
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      success: false,
      error: "E-mail ou senha incorretos. Verifique e tente novamente.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  const email = String(formData.get("email") ?? "").trim();

  const rate = await rateLimitAuthAction(getIdentifier(formData));
  if (!rate.allowed) {
    return {
      success: false,
      error: "Muitas tentativas. Aguarde alguns minutos.",
    };
  }

  if (!email) {
    return { success: false, error: "Informe seu e-mail." };
  }

  const supabase = await createClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return {
      success: false,
      error: "Não foi possível enviar o e-mail. Tente novamente.",
    };
  }

  return { success: true };
}

export async function updatePasswordAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return {
      success: false,
      error: "A senha deve ter pelo menos 8 caracteres.",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Sessão expirada. Solicite um novo link de recuperação.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      error: "Não foi possível atualizar a senha. Solicite um novo link.",
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { success: true };
}
