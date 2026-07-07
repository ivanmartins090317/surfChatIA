import { z } from "zod";

const INTERNAL_ERROR_PATTERNS = [
  /^NEXT_REDIRECT/i,
  /^NEXT_NOT_FOUND/i,
  /^Dynamic server usage/i,
];

export function isNextNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const digest =
    "digest" in error ? String((error as { digest: unknown }).digest) : "";

  if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) {
    return true;
  }

  if (error instanceof Error) {
    return INTERNAL_ERROR_PATTERNS.some((pattern) =>
      pattern.test(error.message),
    );
  }

  return false;
}

export function rethrowIfNavigationError(error: unknown): void {
  if (isNextNavigationError(error)) {
    throw error;
  }
}

export function toActionErrorMessage(error: unknown, fallback: string): string {
  rethrowIfNavigationError(error);

  if (error instanceof z.ZodError) {
    return "Dados inválidos. Revise os campos e tente novamente.";
  }

  if (error instanceof Error) {
    const message = error.message.trim();
    if (!message || INTERNAL_ERROR_PATTERNS.some((p) => p.test(message))) {
      return fallback;
    }
    return message;
  }

  return fallback;
}
