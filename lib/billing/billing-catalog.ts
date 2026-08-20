import {
  type BillingOffer,
  type BillingOfferKey,
  BILLING_OFFER_KINDS,
} from "@/lib/domain/billing";

const OFFER_DEFINITIONS: Record<
  BillingOfferKey,
  Omit<BillingOffer, "key"> & { productEnvKey: string }
> = {
  surfista: {
    kind: BILLING_OFFER_KINDS.subscription,
    label: "Surfista",
    priceLabel: "R$ 39/mês",
    priceCents: 3900,
    credits: 8,
    plan: "surfista",
    productEnvKey: "ABACATEPAY_PRODUCT_SURFISTA",
  },
  pro: {
    kind: BILLING_OFFER_KINDS.subscription,
    label: "Pro",
    priceLabel: "R$ 89/mês",
    priceCents: 8900,
    credits: 30,
    plan: "pro",
    productEnvKey: "ABACATEPAY_PRODUCT_PRO",
  },
  pack_s: {
    kind: BILLING_OFFER_KINDS.pack,
    label: "Pack S",
    priceLabel: "R$ 19",
    priceCents: 1900,
    credits: 5,
    plan: null,
    productEnvKey: "ABACATEPAY_PRODUCT_PACK_S",
  },
  pack_m: {
    kind: BILLING_OFFER_KINDS.pack,
    label: "Pack M",
    priceLabel: "R$ 49",
    priceCents: 4900,
    credits: 15,
    plan: null,
    productEnvKey: "ABACATEPAY_PRODUCT_PACK_M",
  },
};

export function getBillingOffer(offerKey: BillingOfferKey): BillingOffer {
  const definition = OFFER_DEFINITIONS[offerKey];
  return {
    key: offerKey,
    kind: definition.kind,
    label: definition.label,
    priceLabel: definition.priceLabel,
    priceCents: definition.priceCents,
    credits: definition.credits,
    plan: definition.plan,
  };
}

export function listBillingOffers(): BillingOffer[] {
  return (Object.keys(OFFER_DEFINITIONS) as BillingOfferKey[]).map(
    getBillingOffer,
  );
}

export function getProductIdForOffer(offerKey: BillingOfferKey): string | null {
  const envKey = OFFER_DEFINITIONS[offerKey].productEnvKey;
  return process.env[envKey]?.trim() || null;
}

export function isOfferCheckoutReady(offerKey: BillingOfferKey): boolean {
  return Boolean(getProductIdForOffer(offerKey));
}

export function getOfferCheckoutDisabledHint(
  offerKey: BillingOfferKey,
): string | null {
  if (!process.env.ABACATEPAY_API_KEY?.trim()) {
    return "Pagamentos em preparação — configure ABACATEPAY_API_KEY no servidor.";
  }

  if (!isOfferCheckoutReady(offerKey)) {
    const envKey = OFFER_DEFINITIONS[offerKey].productEnvKey;
    return `Produto não configurado — defina ${envKey} no servidor.`;
  }

  return null;
}

export function resolveOfferByProductId(
  productId: string,
): { offerKey: BillingOfferKey; offer: BillingOffer } | null {
  const normalized = productId.trim();
  for (const offerKey of Object.keys(OFFER_DEFINITIONS) as BillingOfferKey[]) {
    const configured = getProductIdForOffer(offerKey);
    if (configured && configured === normalized) {
      return { offerKey, offer: getBillingOffer(offerKey) };
    }
  }
  return null;
}

export function validatePaidAmount(
  offer: BillingOffer,
  amountCents: number | null | undefined,
): boolean {
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    return false;
  }
  return amountCents === offer.priceCents;
}
