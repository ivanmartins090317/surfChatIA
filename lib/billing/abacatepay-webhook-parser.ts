import type { AbacatePayWebhookPayload } from "@/lib/billing/abacatepay-webhook";
import {
  type BillingOfferKey,
  parseBillingExternalRef,
} from "@/lib/domain/billing";

export interface ParsedCheckoutItem {
  productId: string;
  quantity: number;
}

export interface ParsedWebhookContext {
  userId: string | null;
  offerKey: BillingOfferKey | null;
  productId: string | null;
  amountCents: number | null;
  subscriptionExternalId: string | null;
  checkoutExternalId: string | null;
  checkoutGatewayId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cancelledAt: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCheckoutItems(data: Record<string, unknown>): ParsedCheckoutItem[] {
  const checkout = asRecord(data.checkout);
  if (!checkout) return [];

  const items = checkout.items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const productId = readString(record, "id");
      const quantity = readNumber(record, "quantity") ?? 1;
      if (!productId) return null;
      return { productId, quantity };
    })
    .filter((item): item is ParsedCheckoutItem => item !== null);
}

function resolveUserAndOffer(input: {
  metadata: Record<string, unknown> | null;
  externalId: string | null;
}): { userId: string | null; offerKey: BillingOfferKey | null } {
  const metadataUserId = input.metadata
    ? readString(input.metadata, "userId")
    : null;
  const metadataOfferKey = input.metadata
    ? readString(input.metadata, "offerKey")
    : null;

  if (metadataUserId && metadataOfferKey) {
    return {
      userId: metadataUserId,
      offerKey: metadataOfferKey as BillingOfferKey,
    };
  }

  if (input.externalId) {
    const parsed = parseBillingExternalRef(input.externalId);
    if (parsed) return parsed;
  }

  return { userId: metadataUserId, offerKey: metadataOfferKey as BillingOfferKey };
}

function addOneMonth(isoDate: string): string {
  const date = new Date(isoDate);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export function parseWebhookContext(
  payload: AbacatePayWebhookPayload,
): ParsedWebhookContext {
  const data = asRecord(payload.data) ?? {};
  const checkout = asRecord(data.checkout);
  const subscription = asRecord(data.subscription);
  const payment = asRecord(data.payment);

  const metadata =
    asRecord(checkout?.metadata) ??
    asRecord(subscription?.metadata) ??
    asRecord(data.metadata);

  const checkoutExternalId =
    readString(checkout ?? {}, "externalId") ??
    readString(payment ?? {}, "externalId") ??
    readString(data, "externalId");

  const { userId, offerKey } = resolveUserAndOffer({
    metadata,
    externalId: checkoutExternalId,
  });

  const items = readCheckoutItems(data);
  const productId = items[0]?.productId ?? null;

  const amountCents =
    readNumber(checkout ?? {}, "paidAmount") ??
    readNumber(checkout ?? {}, "amount") ??
    readNumber(subscription ?? {}, "amount") ??
    readNumber(payment ?? {}, "paidAmount") ??
    readNumber(payment ?? {}, "amount");

  const subscriptionExternalId = readString(subscription ?? {}, "id");

  const periodStart =
    readString(payment ?? {}, "createdAt") ??
    readString(subscription ?? {}, "updatedAt") ??
    readString(subscription ?? {}, "createdAt") ??
    new Date().toISOString();

  const periodEnd = periodStart ? addOneMonth(periodStart) : null;
  const cancelledAt = readString(subscription ?? {}, "canceledAt");

  const checkoutGatewayId = readString(checkout ?? {}, "id");

  return {
    userId,
    offerKey,
    productId,
    amountCents,
    subscriptionExternalId,
    checkoutExternalId,
    checkoutGatewayId,
    periodStart,
    periodEnd,
    cancelledAt,
  };
}

export function isSupportedBillingEvent(event: string): boolean {
  return (
    event === "checkout.completed" ||
    event === "checkout.refunded" ||
    event === "subscription.completed" ||
    event === "subscription.renewed" ||
    event === "subscription.cancelled"
  );
}
