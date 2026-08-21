import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  resolveAuthCallbackRedirect,
  shouldSignOutAfterEmailConfirmation,
} from "@/lib/auth/signup-redirect";
import { createClient } from "@/lib/supabase/server";

function redirectToAuthCallbackError(origin: string): NextResponse {
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const next = resolveAuthCallbackRedirect(rawNext, type);
  const origin = requestUrl.origin;
  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (error) {
      return redirectToAuthCallbackError(origin);
    }

    if (shouldSignOutAfterEmailConfirmation(rawNext, type)) {
      await supabase.auth.signOut();
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  if (!code) {
    return redirectToAuthCallbackError(origin);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToAuthCallbackError(origin);
  }

  if (shouldSignOutAfterEmailConfirmation(rawNext, type)) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
