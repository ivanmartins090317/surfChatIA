import { NextResponse } from "next/server";
import {
  resolveAuthCallbackRedirect,
  shouldSignOutAfterEmailConfirmation,
} from "@/lib/auth/signup-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = resolveAuthCallbackRedirect(
    requestUrl.searchParams.get("next"),
    type,
  );
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  if (shouldSignOutAfterEmailConfirmation(next, type)) {
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}${next}`);
}
