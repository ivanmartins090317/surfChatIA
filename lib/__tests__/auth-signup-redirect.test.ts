import { describe, expect, it } from "vitest";
import {
  SIGNUP_DUPLICATE_EMAIL_MESSAGE,
  SignupLoginState,
  buildEmailConfirmationCallbackUrl,
  buildLoginAfterSignupUrl,
  isDuplicateEmailSignupError,
  isSupabaseDuplicateEmailError,
  parseSignupLoginState,
  resolveAuthCallbackRedirect,
  sanitizeInternalRedirectPath,
  shouldSignOutAfterEmailConfirmation,
} from "@/lib/auth/signup-redirect";

describe("buildLoginAfterSignupUrl", () => {
  it("monta URL de login com estado check-email e e-mail", () => {
    expect(buildLoginAfterSignupUrl("surfista@exemplo.com")).toBe(
      "/login?signup=check-email&email=surfista%40exemplo.com",
    );
  });
});

describe("buildEmailConfirmationCallbackUrl", () => {
  it("aponta callback com next codificado para login confirmado", () => {
    const url = buildEmailConfirmationCallbackUrl("https://app.exemplo.com");
    expect(url).toBe(
      "https://app.exemplo.com/auth/callback?next=%2Flogin%3Fsignup%3Dconfirmed",
    );
  });
});

describe("sanitizeInternalRedirectPath", () => {
  it("aceita paths internos com query string", () => {
    expect(
      sanitizeInternalRedirectPath("/login?signup=confirmed", "/reset-password"),
    ).toBe("/login?signup=confirmed");
  });

  it("rejeita paths externos ou malformados", () => {
    expect(sanitizeInternalRedirectPath("//evil.com", "/reset-password")).toBe(
      "/reset-password",
    );
    expect(sanitizeInternalRedirectPath(null, "/reset-password")).toBe(
      "/reset-password",
    );
    expect(sanitizeInternalRedirectPath("https://evil.com", "/reset-password")).toBe(
      "/reset-password",
    );
  });
});

describe("resolveAuthCallbackRedirect", () => {
  it("prioriza tipo signup_confirm", () => {
    expect(resolveAuthCallbackRedirect("/dashboard", "signup_confirm")).toBe(
      "/login?signup=confirmed",
    );
  });

  it("prioriza tipo signup do Supabase Auth", () => {
    expect(resolveAuthCallbackRedirect("/dashboard", "signup")).toBe(
      "/login?signup=confirmed",
    );
  });

  it("usa next sanitizado para demais fluxos", () => {
    expect(resolveAuthCallbackRedirect("/reset-password", null)).toBe(
      "/reset-password",
    );
    expect(resolveAuthCallbackRedirect(null, null)).toBe("/reset-password");
  });
});

describe("shouldSignOutAfterEmailConfirmation", () => {
  it("exige sign-out quando confirmação de cadastro", () => {
    expect(
      shouldSignOutAfterEmailConfirmation("/login?signup=confirmed", null),
    ).toBe(true);
    expect(shouldSignOutAfterEmailConfirmation(null, "signup_confirm")).toBe(true);
    expect(shouldSignOutAfterEmailConfirmation(null, "signup")).toBe(true);
  });

  it("não exige sign-out em reset de senha", () => {
    expect(shouldSignOutAfterEmailConfirmation("/reset-password", null)).toBe(false);
  });
});

describe("parseSignupLoginState", () => {
  it("interpreta parâmetros de banner do login", () => {
    expect(parseSignupLoginState(SignupLoginState.CHECK_EMAIL)).toBe("check-email");
    expect(parseSignupLoginState(SignupLoginState.CONFIRMED)).toBe("confirmed");
    expect(parseSignupLoginState("invalid")).toBeNull();
    expect(parseSignupLoginState(null)).toBeNull();
  });
});

describe("erros de e-mail duplicado", () => {
  it("identifica mensagem de erro do app", () => {
    expect(isDuplicateEmailSignupError(SIGNUP_DUPLICATE_EMAIL_MESSAGE)).toBe(true);
    expect(isDuplicateEmailSignupError("Outro erro")).toBe(false);
  });

  it("identifica erros identificáveis do provedor", () => {
    expect(
      isSupabaseDuplicateEmailError({
        message: "User already registered",
        code: "user_already_exists",
      }),
    ).toBe(true);
    expect(
      isSupabaseDuplicateEmailError({ message: "Invalid login credentials" }),
    ).toBe(false);
  });
});
