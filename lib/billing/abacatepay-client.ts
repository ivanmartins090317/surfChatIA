import type { BillingOfferKey } from "@/lib/domain/billing";
import {
  getBillingOffer,
  getProductIdForOffer,
} from "@/lib/billing/billing-catalog";

const ABACATEPAY_API_BASE = "https://api.abacatepay.com/v2";

export interface AbacatePayCheckoutResponse {
  id: string;
  url: string;
}

interface AbacatePayApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

function getApiKey(): string {
  const apiKey = process.env.ABACATEPAY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Pagamentos indisponíveis no momento. Configure ABACATEPAY_API_KEY ou tente mais tarde.",
    );
  }
  return apiKey;
}

function getSiteUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return siteUrl.replace(/\/$/, "");
}

async function postAbacatePay<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${ABACATEPAY_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let payload: AbacatePayApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as AbacatePayApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || !payload.data) {
    const message =
      payload?.error?.trim() ||
      "Não foi possível iniciar o pagamento. Tente novamente em instantes.";
    throw new Error(message);
  }

  return payload.data;
}

export function isAbacatePayConfigured(): boolean {
  return Boolean(process.env.ABACATEPAY_API_KEY?.trim());
}

export async function createAbacatePayCheckout(input: {
  offerKey: BillingOfferKey;
  userId: string;
  externalRef: string;
}): Promise<AbacatePayCheckoutResponse> {
  const productId = getProductIdForOffer(input.offerKey);
  if (!productId) {
    throw new Error(
      "Esta oferta ainda não está disponível. Aguarde a configuração comercial.",
    );
  }

  const offer = getBillingOffer(input.offerKey);
  const siteUrl = getSiteUrl();
  const payload = {
    items: [{ id: productId, quantity: 1 }],
    externalId: input.externalRef,
    returnUrl: `${siteUrl}/planos?checkout=cancelled`,
    completionUrl: `${siteUrl}/planos?checkout=success`,
    methods: offer.kind === "subscription" ? ["CARD", "PIX"] : ["PIX", "CARD"],
    metadata: {
      userId: input.userId,
      offerKey: input.offerKey,
      app: "surf-ai-coach",
    },
  };

  const path =
    offer.kind === "subscription"
      ? "/subscriptions/create"
      : "/checkouts/create";

  const data = await postAbacatePay<{ id: string; url: string }>(path, payload);
  if (!data.url?.trim()) {
    throw new Error("Gateway não retornou URL de pagamento.");
  }

  return { id: data.id, url: data.url };
}

export async function cancelAbacatePaySubscription(
  subscriptionExternalId: string,
): Promise<void> {
  await postAbacatePay<{ id: string; status: string }>(
    "/subscriptions/cancel",
    { id: subscriptionExternalId },
  );
}
