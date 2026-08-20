"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/domain/types";
import { BILLING_OFFER_KEYS, type BillingOfferKey } from "@/lib/domain/billing";
import { requireAuthUser } from "@/lib/supabase/server";
import {
  cancelUserSubscription,
  createCheckoutSession,
  getBillingSummary,
} from "@/services/billing-service";
import type { BillingSummary, CheckoutSessionResult } from "@/lib/domain/billing";

const offerKeySchema = z.enum([
  BILLING_OFFER_KEYS.surfista,
  BILLING_OFFER_KEYS.pro,
  BILLING_OFFER_KEYS.pack_s,
  BILLING_OFFER_KEYS.pack_m,
]);

export async function fetchBillingSummaryAction(): Promise<
  ActionResult<BillingSummary>
> {
  try {
    const user = await requireAuthUser();
    const summary = await getBillingSummary(user.id);
    return { success: true, data: summary };
  } catch {
    return {
      success: false,
      error: "Não foi possível carregar sua cobrança. Tente novamente.",
    };
  }
}

export async function startCheckoutAction(
  offerKey: BillingOfferKey,
): Promise<ActionResult<CheckoutSessionResult>> {
  try {
    const parsed = offerKeySchema.safeParse(offerKey);
    if (!parsed.success) {
      return { success: false, error: "Oferta inválida." };
    }

    const user = await requireAuthUser();
    const session = await createCheckoutSession(user.id, parsed.data);

    return { success: true, data: session };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar o pagamento. Tente novamente.";
    return { success: false, error: message };
  }
}

export async function cancelSubscriptionAction(): Promise<ActionResult<void>> {
  try {
    const user = await requireAuthUser();
    await cancelUserSubscription(user.id);
    revalidatePath("/billing");
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível cancelar a assinatura. Tente novamente.";
    return { success: false, error: message };
  }
}
