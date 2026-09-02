import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildAccountExportPayload,
  DELETE_ACCOUNT_CONFIRMATION,
  isValidDeleteConfirmation,
  type AccountExportPayload,
} from "@/services/account-privacy-shared";

export {
  buildAccountExportPayload,
  DELETE_ACCOUNT_CONFIRMATION,
  hasAcceptedLegalTerms,
  isValidDeleteConfirmation,
  type AccountExportPayload,
} from "@/services/account-privacy-shared";

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
    .select("storage_path, frame_paths")
    .eq("user_id", userId);
  const { data: boards } = await supabase
    .from("boards")
    .select("photo_paths")
    .eq("user_id", userId);

  const admin = createAdminClient();
  const mediaPaths = (mediaItems ?? []).flatMap((item) => {
    const paths: string[] = [];
    if (typeof item.storage_path === "string" && item.storage_path) {
      paths.push(item.storage_path);
    }
    if (Array.isArray(item.frame_paths)) {
      for (const path of item.frame_paths) {
        if (typeof path === "string" && path) {
          paths.push(path);
        }
      }
    }
    return paths;
  });
  await removeStoragePaths(admin, "media", mediaPaths);
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
