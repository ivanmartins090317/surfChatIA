import { afterEach, describe, expect, it } from "vitest";

import {
  buildMercadoPagoSignatureManifest,
  parseMercadoPagoNotification,
  parseMercadoPagoSignatureHeader,
  signMercadoPagoManifest,
  verifyMercadoPagoSignature,
} from "@/lib/billing/mercadopago-webhook";

const WEBHOOK_SECRET = "mp-test-webhook-secret";

describe("mercadopago webhook security", () => {
  afterEach(() => {
    delete process.env.MP_WEBHOOK_SECRET;
  });

  it("parseia header x-signature ts e v1", () => {
    const parsed = parseMercadoPagoSignatureHeader(
      "ts=1700000000,v1=abc123def",
    );
    expect(parsed).toEqual({ ts: "1700000000", v1: "abc123def" });
  });

  it("valida HMAC do manifesto oficial", () => {
    process.env.MP_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const dataId = "123456";
    const requestId = "req-abc";
    const ts = "1700000000";
    const manifest = buildMercadoPagoSignatureManifest({
      dataId,
      requestId,
      ts,
    });
    const v1 = signMercadoPagoManifest(manifest, WEBHOOK_SECRET);

    expect(
      verifyMercadoPagoSignature({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(true);
    expect(
      verifyMercadoPagoSignature({
        xSignature: `ts=${ts},v1=assinatura-invalida`,
        xRequestId: requestId,
        dataId,
      }),
    ).toBe(false);
  });

  it("normaliza data.id em minúsculas no manifesto", () => {
    const lower = buildMercadoPagoSignatureManifest({
      dataId: "AbC123",
      requestId: "req-1",
      ts: "1",
    });
    const mixed = buildMercadoPagoSignatureManifest({
      dataId: "abc123",
      requestId: "req-1",
      ts: "1",
    });
    expect(lower).toBe(mixed);
    expect(lower).toBe("id:abc123;request-id:req-1;ts:1;");
  });

  it("rejeita assinatura sem secret configurado", () => {
    expect(
      verifyMercadoPagoSignature({
        xSignature: "ts=1,v1=abc",
        xRequestId: "req",
        dataId: "1",
      }),
    ).toBe(false);
  });

  it("parseia notificação com type e data.id", () => {
    expect(
      parseMercadoPagoNotification(
        JSON.stringify({ type: "payment", data: { id: 987 } }),
      ),
    ).toEqual({ type: "payment", dataId: "987" });
  });

  it("aceita topic como alias de type", () => {
    expect(
      parseMercadoPagoNotification(
        JSON.stringify({
          topic: "subscription_preapproval",
          data: { id: "pre_1" },
        }),
      ),
    ).toEqual({ type: "subscription_preapproval", dataId: "pre_1" });
  });

  it("rejeita payload sem type ou data.id", () => {
    expect(parseMercadoPagoNotification(JSON.stringify({ type: "payment" }))).toBeNull();
    expect(parseMercadoPagoNotification("not-json")).toBeNull();
  });
});
