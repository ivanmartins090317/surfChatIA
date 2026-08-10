import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function exportAccountData(
  userId: string,
  email: string | null,
): Promise<AccountExportPayload> {
  const supabase = await createClient();

  const [
    profileResult,
    mediaResult,
    analysesResult,
    boardsResult,
    feedbackResult,
    ledgerResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("media_items").select("*").eq("user_id", userId),
    supabase.from("analyses").select("*").eq("user_id", userId),
    supabase.from("boards").select("*").eq("user_id", userId),
    supabase.from("product_feedback").select("*").eq("user_id", userId),
    supabase.from("usage_ledger").select("*").eq("user_id", userId),
  ]);

  const firstError =
    profileResult.error ??
    mediaResult.error ??
    analysesResult.error ??
    boardsResult.error ??
    feedbackResult.error ??
    ledgerResult.error;

  if (firstError) {
    throw new Error(
      "Não foi possível exportar seus dados. Tente novamente em instantes.",
    );
  }

  return buildAccountExportPayload({
    userId,
    email,
    profile: (profileResult.data as Record<string, unknown> | null) ?? null,
    mediaItems: (mediaResult.data as Record<string, unknown>[]) ?? [],
    analyses: (analysesResult.data as Record<string, unknown>[]) ?? [],
    boards: (boardsResult.data as Record<string, unknown>[]) ?? [],
    productFeedback: (feedbackResult.data as Record<string, unknown>[]) ?? [],
    usageLedger: (ledgerResult.data as Record<string, unknown>[]) ?? [],
  });
}

export async function deleteUserAccount(
  userId: string,
  confirmation: string,
): Promise<void> {
  if (!isValidDeleteConfirmation(confirmation)) {
    throw new Error(
      `Para confirmar, digite ${DELETE_ACCOUNT_CONFIRMATION} no campo indicado.`,
    );
  }

  if (!hasAdminClient()) {
    throw new Error(
      "Exclusão indisponível no momento. Contate o suporte pelo e-mail de privacidade.",
    );
  }

  const supabase = await createClient();
  const { data: mediaItems } = await supabase
    .from("media_items")
    .select("storage_path")
    .eq("user_id", userId);
  const { data: boards } = await supabase
    .from("boards")
    .select("photo_paths")
    .eq("user_id", userId);

  const admin = createAdminClient();
  await removeStoragePaths(
    admin,
    "media",
    (mediaItems ?? [])
      .map((item) => item.storage_path as string | null)
      .filter((path): path is string => Boolean(path)),
  );
  await removeStoragePaths(
    admin,
    "boards",
    (boards ?? []).flatMap((board) => {
      const paths = board.photo_paths;
      return Array.isArray(paths)
        ? paths.filter((path): path is string => typeof path === "string")
        : [];
    }),
  );

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(
      "Não foi possível excluir a conta. Tente novamente ou contate o suporte.",
    );
  }
}

async function removeStoragePaths(
  admin: ReturnType<typeof createAdminClient>,
  bucket: "media" | "boards",
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const uniquePaths = [...new Set(paths)];
  const chunkSize = 50;
  for (let index = 0; index < uniquePaths.length; index += chunkSize) {
    const chunk = uniquePaths.slice(index, index + chunkSize);
    const { error } = await admin.storage.from(bucket).remove(chunk);
    if (error) {
      // Best-effort: segue para apagar a conta mesmo se um arquivo órfão restar
      console.error(`Falha ao limpar storage ${bucket}:`, error.message);
    }
  }
}
