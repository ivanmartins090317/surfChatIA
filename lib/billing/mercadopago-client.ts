import { PreApproval, Preference } from "mercadopago";

import { BRAND_NAME } from "@/lib/brand";
import { getBillingOffer } from "@/lib/billing/billing-catalog";
import {
  getMercadoPagoConfig,
  isMercadoPagoConfigured,
} from "@/lib/billing/mercadopago-config";
import type { BillingOfferKey } from "@/lib/domain/billing";
import { getSiteUrl } from "@/lib/site-url";

export interface MercadoPagoCheckoutResponse {
  id: string;
  url: string;
}

export { isMercadoPagoConfigured };

function centsToReais(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function translateMercadoPagoError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Falha no Mercado Pago.";
  const lower = message.toLowerCase();

  if (lower.includes("invalid email") || lower.includes("payer_email")) {
    return "E-mail inválido para o checkout. Confirme o e-mail da conta e tente de novo.";
  }
  if (lower.includes("unauthorized") || lower.includes("invalid access token")) {
    return "Credenciais do Mercado Pago inválidas. Confira MP_ACCESS_TOKEN no servidor.";
  }

  return "Não foi possível iniciar o pagamento no Mercado Pago. Tente novamente em instantes.";
}

export async function createMercadoPagoCheckout(input: {
  offerKey: BillingOfferKey;
  userId: string;
  payerEmail: string;
  externalRef: string;
}): Promise<MercadoPagoCheckoutResponse> {
  const offer = getBillingOffer(input.offerKey);
  const siteUrl = getSiteUrl();
  const notificationUrl = `${siteUrl}/api/webhooks/mercadopago`;
  const config = getMercadoPagoConfig();

  try {
    if (offer.kind === "subscription") {
      const preapproval = await new PreApproval(config).create({
        body: {
          reason: `${BRAND_NAME} ${offer.label}`,
          external_reference: input.externalRef,
          payer_email: input.payerEmail,
          back_url: `${siteUrl}/planos?checkout=success`,
          status: "pending",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            start_date: new Date(Date.now() + 60_000).toISOString(),
            transaction_amount: centsToReais(offer.priceCents),
            currency_id: "BRL",
          },
        },
      });

      if (!preapproval.id || !preapproval.init_point) {
        throw new Error("Gateway não retornou URL de assinatura.");
      }

      return { id: preapproval.id, url: preapproval.init_point };
    }

    const preference = await new Preference(config).create({
      body: {
        items: [
          {
            id: input.offerKey,
            title: `${BRAND_NAME} ${offer.label}`,
            quantity: 1,
            unit_price: centsToReais(offer.priceCents),
            currency_id: "BRL",
          },
        ],
        payer: { email: input.payerEmail },
        external_reference: input.externalRef,
        notification_url: notificationUrl,
        back_urls: {
          success: `${siteUrl}/planos?checkout=success`,
          pending: `${siteUrl}/planos?checkout=success`,
          failure: `${siteUrl}/planos?checkout=cancelled`,
        },
        auto_return: "approved",
        metadata: {
          userId: input.userId,
          offerKey: input.offerKey,
          app: "surf-ai-coach",
        },
      },
    });

    if (!preference.id || !preference.init_point) {
      throw new Error("Gateway não retornou URL de pagamento.");
    }

    return { id: String(preference.id), url: preference.init_point };
  } catch (error) {
    throw new Error(translateMercadoPagoError(error));
  }
}

export async function cancelMercadoPagoSubscription(
  subscriptionExternalId: string,
): Promise<void> {
  try {
    await new PreApproval(getMercadoPagoConfig()).update({
      id: subscriptionExternalId,
      body: { status: "cancelled" },
    });
  } catch (error) {
    throw new Error(translateMercadoPagoError(error));
  }
}
