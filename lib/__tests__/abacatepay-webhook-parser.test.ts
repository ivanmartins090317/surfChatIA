import { describe, expect, it } from "vitest";

import { parseWebhookContext } from "@/lib/billing/abacatepay-webhook-parser";
import type { AbacatePayWebhookPayload } from "@/lib/billing/abacatepay-webhook";
import { buildBillingExternalRef } from "@/lib/domain/billing";

const USER_ID = "22222222-2222-4222-8222-222222222222";

function payload(
  event: string,
  data: Record<string, unknown>,
): AbacatePayWebhookPayload {
  return {
    id: "log_test_event",
    event,
    apiVersion: 2,
    devMode: true,
    data,
  };
}

describe("abacatepay webhook parser", () => {
  it("extrai userId e offerKey de metadata do checkout", () => {
    const context = parseWebhookContext(
      payload("checkout.completed", {
        checkout: {
          externalId: buildBillingExternalRef(USER_ID, "pack_s"),
          paidAmount: 1900,
          items: [{ id: "prod_pack_s", quantity: 1 }],
          metadata: { userId: USER_ID, offerKey: "pack_s" },
        },
      }),
    );

    expect(context.userId).toBe(USER_ID);
    expect(context.offerKey).toBe("pack_s");
    expect(context.amountCents).toBe(1900);
    expect(context.productId).toBe("prod_pack_s");
  });

  it("extrai subscription id e período em subscription.completed", () => {
    const context = parseWebhookContext(
      payload("subscription.completed", {
        subscription: {
          id: "subs_test123",
          amount: 3900,
          status: "ACTIVE",
          createdAt: "2026-08-20T12:00:00.000Z",
        },
        payment: {
          paidAmount: 3900,
          createdAt: "2026-08-20T12:00:00.000Z",
        },
        checkout: {
          externalId: buildBillingExternalRef(USER_ID, "surfista"),
          items: [{ id: "prod_surfista", quantity: 1 }],
          metadata: { userId: USER_ID, offerKey: "surfista" },
        },
      }),
    );

    expect(context.subscriptionExternalId).toBe("subs_test123");
    expect(context.periodStart).toBe("2026-08-20T12:00:00.000Z");
    expect(context.periodEnd).toBeTruthy();
  });

  it("extrai checkout.id quando externalId vem null do gateway", () => {
    const context = parseWebhookContext(
      payload("checkout.completed", {
        checkout: {
          id: "bill_abc123",
          externalId: null,
          paidAmount: 1900,
          items: [{ id: "prod_gsFmquFPEBqfkrRJBuc6FStj", quantity: 1 }],
        },
      }),
    );

    expect(context.checkoutExternalId).toBeNull();
    expect(context.checkoutGatewayId).toBe("bill_abc123");
    expect(context.productId).toBe("prod_gsFmquFPEBqfkrRJBuc6FStj");
  });
});
