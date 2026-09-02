import type { BillingOfferKey } from "@/lib/domain/billing";

export const BILLING_GATEWAY_EVENT_KINDS = {
  packPaid: "pack_paid",
  subscriptionActivated: "subscription_activated",
  subscriptionRenewed: "subscription_renewed",
  subscriptionCancelled: "subscription_cancelled",
} as const;

export type BillingGatewayEventKind =
  (typeof BILLING_GATEWAY_EVENT_KINDS)[keyof typeof BILLING_GATEWAY_EVENT_KINDS];

export interface BillingGatewayEvent {
  eventId: string;
  kind: BillingGatewayEventKind;
  userId: string | null;
  offerKey: BillingOfferKey | null;
  amountCents: number | null;
  subscriptionExternalId: string | null;
  checkoutExternalId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelledAt: string | null;
}

export function addOneBillingMonth(isoDate: string): string {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function reaisToCents(amount: number): number {
  return Math.round(amount * 100);
}
