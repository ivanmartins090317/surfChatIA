import {
  type BillingOffer,
  type BillingOfferKey,
  BILLING_OFFER_KINDS,
} from "@/lib/domain/billing";

const OFFER_DEFINITIONS: Record<BillingOfferKey, Omit<BillingOffer, "key">> = {
  surfista: {
    kind: BILLING_OFFER_KINDS.subscription,
    label: "Surfista",
    priceLabel: "R$ 39/mês",
    priceCents: 3900,
    credits: 8,
    plan: "surfista",
  },
  pro: {
    kind: BILLING_OFFER_KINDS.subscription,
    label: "Pro",
    priceLabel: "R$ 89/mês",
    priceCents: 8900,
    credits: 30,
    plan: "pro",
  },
  pack_s: {
    kind: BILLING_OFFER_KINDS.pack,
    label: "Pack S",
    priceLabel: "R$ 19",
    priceCents: 1900,
    credits: 5,
    plan: null,
  },
  pack_m: {
    kind: BILLING_OFFER_KINDS.pack,
    label: "Pack M",
    priceLabel: "R$ 49",
    priceCents: 4900,
    credits: 15,
    plan: null,
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

export function isPaymentsConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

export function isOfferCheckoutReady(): boolean {
  return isPaymentsConfigured();
}

export function getOfferCheckoutDisabledHint(): string | null {
  if (isPaymentsConfigured()) return null;
  return "Pagamentos em preparação — configure MP_ACCESS_TOKEN no servidor.";
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
