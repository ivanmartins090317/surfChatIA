import { afterEach, describe, expect, it } from "vitest";

import {
  isAbacatePayDevMode,
  resolveAbacatePayMethods,
  translateAbacatePayError,
} from "@/lib/billing/abacatepay-errors";
import { BILLING_OFFER_KINDS } from "@/lib/domain/billing";

describe("abacatepay-errors", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_API_KEY;
  });

  it("usa só PIX em packs no Dev mode", () => {
    process.env.ABACATEPAY_API_KEY = "abc_dev_test";
    expect(isAbacatePayDevMode()).toBe(true);
    expect(resolveAbacatePayMethods(BILLING_OFFER_KINDS.pack)).toEqual(["PIX"]);
  });

  it("usa CARD em assinatura mesmo no Dev mode", () => {
    process.env.ABACATEPAY_API_KEY = "abc_dev_test";
    expect(resolveAbacatePayMethods(BILLING_OFFER_KINDS.subscription)).toEqual([
      "CARD",
    ]);
  });

  it("prioriza CARD em assinatura fora do Dev mode", () => {
    process.env.ABACATEPAY_API_KEY = "abc_live_key";
    expect(resolveAbacatePayMethods(BILLING_OFFER_KINDS.subscription)).toEqual([
      "CARD",
    ]);
  });

  it("traduz erro de produto sem ciclo de assinatura", () => {
    const message = translateAbacatePayError(
      "No subscription product with cycle found for billing",
    );
    expect(message).toContain("MONTHLY");
  });

  it("traduz erro de cartão indisponível", () => {
    const message = translateAbacatePayError("CARD is not available for this store");
    expect(message).toContain("Cartão");
    expect(message).toContain("4242");
  });

  it("traduz erro de PIX automático indisponível", () => {
    const message = translateAbacatePayError(
      "PIX Automático is not available for this store",
    );
    expect(message).toContain("PIX Automático");
  });
});
