import type { UserPlan } from "@/lib/domain/types";

export const BILLING_OFFER_KEYS = {
  surfista: "surfista",
  pro: "pro",
  pack_s: "pack_s",
  pack_m: "pack_m",
} as const;

export type BillingOfferKey = keyof typeof BILLING_OFFER_KEYS;

export const BILLING_OFFER_KINDS = {
  subscription: "subscription",
  pack: "pack",
} as const;

export type BillingOfferKind =
  (typeof BILLING_OFFER_KINDS)[keyof typeof BILLING_OFFER_KINDS];

export const BILLING_PROVIDERS = {
  abacatepay: "abacatepay",
  mercadopago: "mercadopago",
} as const;

export type BillingProvider =
  (typeof BILLING_PROVIDERS)[keyof typeof BILLING_PROVIDERS];

export const SUBSCRIPTION_STATUSES = {
  pending: "pending",
  active: "active",
  cancelled: "cancelled",
  past_due: "past_due",
} as const;

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUSES;

export interface BillingOffer {
  key: BillingOfferKey;
  kind: BillingOfferKind;
  label: string;
  priceLabel: string;
  priceCents: number;
  credits: number;
  plan: UserPlan | null;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  provider: BillingProvider;
  external_id: string;
  status: SubscriptionStatus;
  plan: "surfista" | "pro";
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingSummary {
  plan: UserPlan;
  subscription: SubscriptionRecord | null;
  hasActivePaidAccess: boolean;
  nextRenewalAt: string | null;
  canCancelSubscription: boolean;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

export function isBillingOfferKey(value: string): value is BillingOfferKey {
  return Object.prototype.hasOwnProperty.call(BILLING_OFFER_KEYS, value);
}

export function billingProviderLabel(provider: BillingProvider): string {
  if (provider === BILLING_PROVIDERS.mercadopago) return "Mercado Pago";
  return "AbacatePay";
}

export function buildBillingExternalRef(
  userId: string,
  offerKey: BillingOfferKey,
): string {
  return `surf:${userId}:${offerKey}`;
}

export function parseBillingExternalRef(
  externalRef: string,
): { userId: string; offerKey: BillingOfferKey } | null {
  const match = /^surf:([0-9a-f-]{36}):(surfista|pro|pack_s|pack_m)$/.exec(
    externalRef.trim(),
  );
  if (!match) return null;
  return {
    userId: match[1],
    offerKey: match[2] as BillingOfferKey,
  };
}
