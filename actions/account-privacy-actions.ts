"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/domain/types";
import { toActionErrorMessage } from "@/lib/errors/action-error";
import { createClient, requireAuthUser } from "@/lib/supabase/server";
import {
  deleteUserAccount,
  exportAccountData,
  type AccountExportPayload,
} from "@/services/account-privacy-service";

export async function exportMyDataAction(): Promise<
  ActionResult<AccountExportPayload>
> {
  try {
    const user = await requireAuthUser();
    const payload = await exportAccountData(user.id, user.email ?? null);
    return { success: true, data: payload };
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível exportar seus dados. Tente novamente.",
      ),
    };
  }
}

export async function deleteMyAccountAction(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthUser();
    const confirmation = String(formData.get("confirmation") ?? "");
    await deleteUserAccount(user.id, confirmation);

    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  } catch (error) {
    return {
      success: false,
      error: toActionErrorMessage(
        error,
        "Não foi possível excluir a conta. Tente novamente.",
      ),
    };
  }

  redirect("/login");
}
