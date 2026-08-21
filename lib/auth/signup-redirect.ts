export const SIGNUP_LOGIN_PARAM = "signup";

export const SignupLoginState = {
  CHECK_EMAIL: "check-email",
  CONFIRMED: "confirmed",
} as const;

export type SignupLoginBannerState =
  (typeof SignupLoginState)[keyof typeof SignupLoginState];

export const SIGNUP_DUPLICATE_EMAIL_MESSAGE = "Este e-mail já tem conta.";

const SIGNUP_CONFIRM_CALLBACK_TYPE = "signup_confirm";
const SIGNUP_EMAIL_OTP_TYPE = "signup";

function isSignupEmailConfirmationType(type: string | null): boolean {
  return type === SIGNUP_CONFIRM_CALLBACK_TYPE || type === SIGNUP_EMAIL_OTP_TYPE;
}

export function buildLoginAfterSignupUrl(email: string): string {
  const params = new URLSearchParams({
    [SIGNUP_LOGIN_PARAM]: SignupLoginState.CHECK_EMAIL,
    email,
  });
  return `/login?${params.toString()}`;
}

export function buildEmailConfirmationCallbackUrl(siteUrl: string): string {
  const loginPath = `/login?${SIGNUP_LOGIN_PARAM}=${SignupLoginState.CONFIRMED}`;
  const next = encodeURIComponent(loginPath);
  return `${siteUrl}/auth/callback?next=${next}`;
}

export function sanitizeInternalRedirectPath(
  path: string | null,
  fallback: string,
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}

export function resolveAuthCallbackRedirect(
  next: string | null,
  type: string | null,
): string {
  if (isSignupEmailConfirmationType(type)) {
    return `/login?${SIGNUP_LOGIN_PARAM}=${SignupLoginState.CONFIRMED}`;
  }
  return sanitizeInternalRedirectPath(next, "/reset-password");
}

export function shouldSignOutAfterEmailConfirmation(
  next: string | null,
  type: string | null,
): boolean {
  if (isSignupEmailConfirmationType(type)) {
    return true;
  }

  if (!next) {
    return false;
  }

  return parseSignupLoginStateFromPath(next) === SignupLoginState.CONFIRMED;
}

export function parseSignupLoginState(
  signupParam: string | null,
): SignupLoginBannerState | null {
  if (signupParam === SignupLoginState.CHECK_EMAIL) {
    return SignupLoginState.CHECK_EMAIL;
  }
  if (signupParam === SignupLoginState.CONFIRMED) {
    return SignupLoginState.CONFIRMED;
  }
  return null;
}

function parseSignupLoginStateFromPath(path: string): SignupLoginBannerState | null {
  try {
    const url = new URL(path, "http://localhost");
    return parseSignupLoginState(url.searchParams.get(SIGNUP_LOGIN_PARAM));
  } catch {
    return null;
  }
}

export function isDuplicateEmailSignupError(error: string): boolean {
  return error === SIGNUP_DUPLICATE_EMAIL_MESSAGE;
}

export function isSupabaseDuplicateEmailError(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (code === "user_already_exists" || code === "email_exists") {
    return true;
  }

  return (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("user already exists")
  );
}
