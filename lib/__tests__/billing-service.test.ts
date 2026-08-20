import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { signAbacatePayWebhookBody } from "@/lib/billing/abacatepay-webhook";
import { buildBillingExternalRef } from "@/lib/domain/billing";
import {
  getBillingMemoryLedger,
  getBillingSummary,
  processAbacatePayWebhook,
  resetBillingMemoryStore,
  seedBillingMemoryProfile,
} from "@/services/billing-service";

const USER_ID = "33333333-3333-4333-8333-333333333333";

function signedPayload(input: {
  id: string;
  event: string;
  data: Record<string, unknown>;
}) {
  const body = JSON.stringify({
    id: input.id,
    event: input.event,
    apiVersion: 2,
    devMode: true,
    data: input.data,
  });
  return JSON.parse(body) as {
    id: string;
    event: string;
    apiVersion: number;
    devMode: boolean;
    data: Record<string, unknown>;
  };
}

describe("billing-service webhook processing", () => {
  beforeEach(() => {
    resetBillingMemoryStore();
    process.env.ABACATEPAY_PRODUCT_PACK_S = "prod_pack_s_mem";
    process.env.ABACATEPAY_PRODUCT_SURFISTA = "prod_surfista_mem";
    seedBillingMemoryProfile(USER_ID, {
      plan: "free",
      creditsBalance: 0,
      creditsPeriodUsed: 2,
    });
  });

  afterEach(() => {
    delete process.env.ABACATEPAY_PRODUCT_PACK_S;
    delete process.env.ABACATEPAY_PRODUCT_SURFISTA;
  });

  it("credita pack avulso em checkout.completed", async () => {
    const externalRef = buildBillingExternalRef(USER_ID, "pack_s");
    await processAbacatePayWebhook(
      signedPayload({
        id: "log_pack_1",
        event: "checkout.completed",
        data: {
          checkout: {
            externalId: externalRef,
            paidAmount: 1900,
            items: [{ id: "prod_pack_s_mem", quantity: 1 }],
            metadata: { userId: USER_ID, offerKey: "pack_s" },
          },
        },
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("free");
    expect(getBillingMemoryLedger(USER_ID)).toEqual([
      { userId: USER_ID, reason: "pack_purchase", delta: 5 },
    ]);
  });

  it("não duplica crédito em evento repetido", async () => {
    const externalRef = buildBillingExternalRef(USER_ID, "pack_s");
    const eventData = {
      checkout: {
        externalId: externalRef,
        paidAmount: 1900,
        items: [{ id: "prod_pack_s_mem", quantity: 1 }],
        metadata: { userId: USER_ID, offerKey: "pack_s" },
      },
    };

    await processAbacatePayWebhook(
      signedPayload({ id: "log_dup", event: "checkout.completed", data: eventData }),
    );
    await processAbacatePayWebhook(
      signedPayload({ id: "log_dup", event: "checkout.completed", data: eventData }),
    );

    expect(getBillingMemoryLedger(USER_ID)).toHaveLength(1);
  });

  it("ativa assinatura surfista", async () => {
    const externalRef = buildBillingExternalRef(USER_ID, "surfista");
    await processAbacatePayWebhook(
      signedPayload({
        id: "log_sub_active",
        event: "subscription.completed",
        data: {
          subscription: {
            id: "subs_mem_1",
            amount: 3900,
            status: "ACTIVE",
            createdAt: "2026-08-20T12:00:00.000Z",
          },
          payment: {
            paidAmount: 3900,
            createdAt: "2026-08-20T12:00:00.000Z",
          },
          checkout: {
            externalId: externalRef,
            items: [{ id: "prod_surfista_mem", quantity: 1 }],
            metadata: { userId: USER_ID, offerKey: "surfista" },
          },
        },
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.plan).toBe("surfista");
    expect(summary.subscription?.status).toBe("active");
  });

  it("marca cancelamento mantendo acesso até fim do período", async () => {
    const externalRef = buildBillingExternalRef(USER_ID, "surfista");
    await processAbacatePayWebhook(
      signedPayload({
        id: "log_sub_active2",
        event: "subscription.completed",
        data: {
          subscription: {
            id: "subs_mem_2",
            amount: 3900,
            status: "ACTIVE",
            createdAt: "2026-08-20T12:00:00.000Z",
          },
          payment: {
            paidAmount: 3900,
            createdAt: "2026-08-20T12:00:00.000Z",
          },
          checkout: {
            externalId: externalRef,
            items: [{ id: "prod_surfista_mem", quantity: 1 }],
            metadata: { userId: USER_ID, offerKey: "surfista" },
          },
        },
      }),
    );

    await processAbacatePayWebhook(
      signedPayload({
        id: "log_sub_cancel",
        event: "subscription.cancelled",
        data: {
          subscription: {
            id: "subs_mem_2",
            amount: 3900,
            status: "CANCELLED",
            canceledAt: "2026-08-21T12:00:00.000Z",
          },
          checkout: {
            metadata: { userId: USER_ID, offerKey: "surfista" },
          },
        },
      }),
    );

    const summary = await getBillingSummary(USER_ID);
    expect(summary.subscription?.status).toBe("cancelled");
    expect(summary.hasActivePaidAccess).toBe(true);
    expect(summary.canCancelSubscription).toBe(false);
  });

  it("rejeita pack quando valor não bate com catálogo", async () => {
    const externalRef = buildBillingExternalRef(USER_ID, "pack_s");
    await processAbacatePayWebhook(
      signedPayload({
        id: "log_bad_amount",
        event: "checkout.completed",
        data: {
          checkout: {
            externalId: externalRef,
            paidAmount: 999,
            items: [{ id: "prod_pack_s_mem", quantity: 1 }],
            metadata: { userId: USER_ID, offerKey: "pack_s" },
          },
        },
      }),
    );

    expect(getBillingMemoryLedger(USER_ID)).toHaveLength(0);
  });
});

describe("abacatepay webhook security", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_WEBHOOK_SECRET;
  });

  it("signAbacatePayWebhookBody bate com crypto nativo", async () => {
    const { isValidWebhookSecret, verifyAbacatePaySignature } = await import(
      "@/lib/billing/abacatepay-webhook"
    );
    const rawBody = '{"id":"log_x","event":"checkout.completed"}';
    const expected = crypto
      .createHmac(
        "sha256",
        "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9",
      )
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");

    expect(signAbacatePayWebhookBody(rawBody)).toBe(expected);
    process.env.ABACATEPAY_WEBHOOK_SECRET = "secret-test";
    expect(isValidWebhookSecret("secret-test")).toBe(true);
    expect(verifyAbacatePaySignature(rawBody, expected)).toBe(true);
  });
});
