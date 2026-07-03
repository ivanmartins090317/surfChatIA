"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rateLimitAuthAction } from "@/lib/security/rate-limit";
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

  const rate = rateLimitAuthAction(getIdentifier(formData));
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

  const rate = rateLimitAuthAction(getIdentifier(formData));
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

  const rate = rateLimitAuthAction(getIdentifier(formData));
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
  });

  if (error) {
    return {
      success: false,
      error: "Não foi possível enviar o e-mail. Tente novamente.",
    };
  }

  return { success: true };
}
