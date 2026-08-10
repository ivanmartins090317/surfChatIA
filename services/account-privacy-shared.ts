/**
 * Helpers e constantes de privacidade sem dependência de next/headers.
 * Seguro para import em Client Components.
 */

export const DELETE_ACCOUNT_CONFIRMATION = "EXCLUIR";

export interface AccountExportPayload {
  exportedAt: string;
  userId: string;
  email: string | null;
  profile: Record<string, unknown> | null;
  mediaItems: Record<string, unknown>[];
  analyses: Record<string, unknown>[];
  boards: Record<string, unknown>[];
  productFeedback: Record<string, unknown>[];
  usageLedger: Record<string, unknown>[];
}

export function hasAcceptedLegalTerms(
  value: FormDataEntryValue | null,
): boolean {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "on" || normalized === "true";
}

export function isValidDeleteConfirmation(confirmation: string): boolean {
  return confirmation.trim().toUpperCase() === DELETE_ACCOUNT_CONFIRMATION;
}

export function buildAccountExportPayload(input: {
  userId: string;
  email: string | null;
  profile: Record<string, unknown> | null;
  mediaItems: Record<string, unknown>[] | null;
  analyses: Record<string, unknown>[] | null;
  boards: Record<string, unknown>[] | null;
  productFeedback: Record<string, unknown>[] | null;
  usageLedger: Record<string, unknown>[] | null;
  exportedAt?: string;
}): AccountExportPayload {
  return {
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    userId: input.userId,
    email: input.email,
    profile: input.profile,
    mediaItems: input.mediaItems ?? [],
    analyses: input.analyses ?? [],
    boards: input.boards ?? [],
    productFeedback: input.productFeedback ?? [],
    usageLedger: input.usageLedger ?? [],
  };
}
