import { beforeEach, describe, expect, it } from "vitest";

import { BILLING_GATEWAY_EVENT_KINDS } from "@/lib/billing/billing-gateway-event";
import type { BillingGatewayEvent } from "@/lib/billing/billing-gateway-event";
import { BILLING_PROVIDERS, buildBillingExternalRef } from "@/lib/domain/billing";
import {
  cancelUserSubscription,
  getBillingMemoryLedger,
  getBillingSummary,
  processBillingGatewayEvent,
  resetBillingMemoryStore,
  seedBillingMemoryProfile,
} from "@/services/billing-service";

const USER_ID = "33333333-3333-4333-8333-333333333333";

function gatewayEvent(
  overrides: Partial<BillingGatewayEvent> &
    Pick<BillingGatewayEvent, "eventId" | "kind">,
): BillingGatewayEvent {
  return {
    userId: USER_ID,
    offerKey: "pack_s",
    amountCents: 1900,
    subscriptionExternalId: null,
    checkoutExternalId: buildBillingExternalRef(USER_ID, "pack_s"),
    periodStart: null,
    periodEnd: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe("billing-service webhook processing", () => {
  beforeEach(() => {
    resetBillingMemoryStore();
    seedBillingMemoryProfile(USER_ID, {
      plan: "free",
      creditsBalance: 0,
      creditsPeriodUsed: 2,
    });
  });

  it("credita pack avulso em pagamento aprovado", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "payment:pack_1",
        kind: BILLING_GATEWAY_EVENT_KINDS.packPaid,
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("free");
    expect(getBillingMemoryLedger(USER_ID)).toEqual([
      { userId: USER_ID, reason: "pack_purchase", delta: 5 },
    ]);
  });

  it("não duplica crédito em evento repetido", async () => {
    const event = gatewayEvent({
      eventId: "payment:dup",
      kind: BILLING_GATEWAY_EVENT_KINDS.packPaid,
    });

    await processBillingGatewayEvent(event);
    await processBillingGatewayEvent(event);

    expect(getBillingMemoryLedger(USER_ID)).toHaveLength(1);
  });

  it("ativa assinatura surfista", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "subscription_preapproval:sub_1",
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionActivated,
        offerKey: "surfista",
        amountCents: 3900,
        subscriptionExternalId: "preapproval_mem_1",
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
        periodStart: "2026-09-02T12:00:00.000Z",
        periodEnd: "2026-10-02T12:00:00.000Z",
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("surfista");
    expect(summary.subscription?.status).toBe("active");
    expect(summary.subscription?.provider).toBe(BILLING_PROVIDERS.mercadopago);
  });

  it("ativa assinatura se a primeira cobrança chegar antes do preapproval", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "subscription_authorized_payment:inv_first",
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionRenewed,
        offerKey: "surfista",
        amountCents: 3900,
        subscriptionExternalId: "preapproval_mem_first",
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
        periodStart: "2026-09-02T12:00:00.000Z",
        periodEnd: "2026-10-02T12:00:00.000Z",
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("surfista");
    expect(summary.subscription?.status).toBe("active");
    expect(getBillingMemoryLedger(USER_ID)).toEqual([
      { userId: USER_ID, reason: "subscription_activated", delta: 0 },
    ]);
  });

  it("marca cancelamento mantendo acesso até fim do período", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "subscription_preapproval:sub_2",
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionActivated,
        offerKey: "surfista",
        amountCents: 3900,
        subscriptionExternalId: "preapproval_mem_2",
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
        periodStart: "2026-09-02T12:00:00.000Z",
        periodEnd: "2026-10-02T12:00:00.000Z",
      }),
    );

    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "subscription_preapproval:sub_2_cancel",
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionCancelled,
        offerKey: "surfista",
        amountCents: 3900,
        subscriptionExternalId: "preapproval_mem_2",
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
        periodStart: "2026-09-02T12:00:00.000Z",
        periodEnd: "2026-10-02T12:00:00.000Z",
        cancelledAt: "2026-09-03T12:00:00.000Z",
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.subscription?.status).toBe("cancelled");
    expect(summary.hasActivePaidAccess).toBe(true);
    expect(summary.canCancelSubscription).toBe(false);
  });

  it("rejeita pack quando valor não bate com catálogo", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "payment:bad_amount",
        kind: BILLING_GATEWAY_EVENT_KINDS.packPaid,
        amountCents: 999,
      }),
    );

    expect(getBillingMemoryLedger(USER_ID)).toHaveLength(0);
  });

  it("ignora pagamento aprovado de assinatura no tópico pack", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "payment:sub_card",
        kind: BILLING_GATEWAY_EVENT_KINDS.packPaid,
        offerKey: "surfista",
        amountCents: 3900,
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
      }),
    );

    expect(getBillingMemoryLedger(USER_ID)).toHaveLength(0);
    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("free");
  });

  it("recusa cancelamento in-app sem MP_ACCESS_TOKEN", async () => {
    await processBillingGatewayEvent(
      gatewayEvent({
        eventId: "subscription_preapproval:sub_cancel_cfg",
        kind: BILLING_GATEWAY_EVENT_KINDS.subscriptionActivated,
        offerKey: "surfista",
        amountCents: 3900,
        subscriptionExternalId: "preapproval_cancel_cfg",
        checkoutExternalId: buildBillingExternalRef(USER_ID, "surfista"),
        periodStart: "2026-09-02T12:00:00.000Z",
        periodEnd: "2026-10-02T12:00:00.000Z",
      }),
    );

    delete process.env.MP_ACCESS_TOKEN;
    await expect(cancelUserSubscription(USER_ID)).rejects.toThrow(
      /Cancelamento indisponível/,
    );
  });
});
