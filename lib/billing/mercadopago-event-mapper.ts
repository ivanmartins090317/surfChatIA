import { Invoice, Payment, PreApproval } from "mercadopago";

import {
  addOneBillingMonth,
  reaisToCents,
  type BillingGatewayEvent,
  BILLING_GATEWAY_EVENT_KINDS,
} from "@/lib/billing/billing-gateway-event";
import { getMercadoPagoConfig } from "@/lib/billing/mercadopago-config";
import {
  isBillingOfferKey,
  parseBillingExternalRef,
  type BillingOfferKey,
} from "@/lib/domain/billing";

function readMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).flatMap(
    ([key, raw]) =>
      typeof raw === "string" && raw.trim() ? [[key, raw.trim()] as const] : [],
  );
  return Object.fromEntries(entries);
}

function resolveUserAndOffer(input: {
  externalReference: string | null;
  metadata: Record<string, string>;
}): { userId: string | null; offerKey: BillingOfferKey | null } {
  const metadataUserId = input.metadata.userId ?? null;
  const metadataOfferKey = input.metadata.offerKey;
  const validMetadataOffer =
    metadataOfferKey && isBillingOfferKey(metadataOfferKey)
      ? metadataOfferKey
      : null;

  if (metadataUserId && validMetadataOffer) {
    return { userId: metadataUserId, offerKey: validMetadataOffer };
  }

  if (input.externalReference) {
    const parsed = parseBillingExternalRef(input.externalReference);
    if (parsed) return parsed;
  }

  return { userId: metadataUserId, offerKey: validMetadataOffer };
}

function periodFrom(startIso: string | undefined): {
  periodStart: string;
  periodEnd: string;
} {
  const periodStart = startIso?.trim() || new Date().toISOString();
  return { periodStart, periodEnd: addOneBillingMonth(periodStart) };
}

function isCancelledStatus(status: string | undefined): boolean {
  return status === "cancelled" || status === "canceled" || status === "paused";
}

export async function resolveMercadoPagoGatewayEvent(input: {
  type: string;
  dataId: string;
}): Promise<BillingGatewayEvent | null> {
  const eventId = `${input.type}:${input.dataId}`;
  const config = getMercadoPagoConfig();

  if (input.type === "payment") {
    const payment = await new Payment(config).get({ id: input.dataId });
    if (payment.status !== "approved") return null;

    const externalRef =
      typeof payment.external_reference === "string"
        ? payment.external_reference
        : null;
    const { userId, offerKey } = resolveUserAndOffer({
      externalReference: externalRef,
      metadata: readMetadata(payment.metadata),
    });
    const amountCents =
      typeof payment.transaction_amount === "number"
        ? reaisToCents(payment.transaction_amount)
        : null;

    return {
      eventId,
      kind: BILLING_GATEWAY_EVENT_KINDS.packPaid,
      userId,
      offerKey,
      amountCents,
      subscriptionExternalId: null,
      checkoutExternalId: externalRef,
      periodStart: null,
      periodEnd: null,
      cancelledAt: null,
    };
  }

  if (input.type === "subscription_preapproval") {
    const preapproval = await new PreApproval(config).get({ id: input.dataId });
    const externalRef =
      typeof preapproval.external_reference === "string"
        ? preapproval.external_reference
        : null;
    const { userId, offerKey } = resolveUserAndOffer({
      externalReference: externalRef,
      metadata: {},
    });
    const amountCents =
      typeof preapproval.auto_recurring?.transaction_amount === "number"
        ? reaisToCents(preapproval.auto_recurring.transaction_amount)
        : null;
    const { periodStart, periodEnd } = periodFrom(preapproval.date_created);
    const status = preapproval.status?.toLowerCase();

    if (isCancelledStatus(status)) {
      return {
        eventId,
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionCancelled,
        userId,
        offerKey,
        amountCents,
        subscriptionExternalId: preapproval.id ?? input.dataId,
        checkoutExternalId: externalRef,
        periodStart,
        periodEnd,
        cancelledAt: preapproval.last_modified ?? new Date().toISOString(),
      };
    }

    if (status !== "authorized") return null;

    return {
      eventId,
      kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionActivated,
      userId,
      offerKey,
      amountCents,
      subscriptionExternalId: preapproval.id ?? input.dataId,
      checkoutExternalId: externalRef,
      periodStart,
      periodEnd,
      cancelledAt: null,
    };
  }

  if (input.type === "subscription_authorized_payment") {
    const invoice = await new Invoice(config).get({ id: input.dataId });
    const paymentStatus = invoice.payment?.status?.toLowerCase();
    const invoiceStatus = invoice.status?.toLowerCase();
    const isPaid =
      paymentStatus === "approved" ||
      invoiceStatus === "processed" ||
      invoiceStatus === "approved";

    if (!isPaid) return null;

    let userId: string | null = null;
    let offerKey: BillingOfferKey | null = null;
    let amountCents =
      typeof invoice.transaction_amount === "number"
        ? reaisToCents(invoice.transaction_amount)
        : null;

    if (invoice.external_reference) {
      const parsed = parseBillingExternalRef(invoice.external_reference);
      if (parsed) {
        userId = parsed.userId;
        offerKey = parsed.offerKey;
      }
    }

    if ((!userId || !offerKey) && invoice.preapproval_id) {
      const preapproval = await new PreApproval(config).get({
        id: invoice.preapproval_id,
      });
      const resolved = resolveUserAndOffer({
        externalReference: preapproval.external_reference ?? null,
        metadata: {},
      });
      userId = userId ?? resolved.userId;
      offerKey = offerKey ?? resolved.offerKey;
      if (
        amountCents === null &&
        preapproval.auto_recurring?.transaction_amount
      ) {
        amountCents = reaisToCents(preapproval.auto_recurring.transaction_amount);
      }
    }

    const { periodStart, periodEnd } = periodFrom(
      invoice.debit_date ?? invoice.date_created,
    );

    return {
      eventId,
      kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionRenewed,
      userId,
      offerKey,
      amountCents,
      subscriptionExternalId: invoice.preapproval_id ?? null,
      checkoutExternalId: invoice.external_reference ?? null,
      periodStart,
      periodEnd,
      cancelledAt: null,
    };
  }

  console.info("[mercadopago.webhook] evento ignorado", {
    type: input.type,
    dataId: input.dataId,
  });
  return null;
}
