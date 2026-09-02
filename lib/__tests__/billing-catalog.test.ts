import { afterEach, describe, expect, it } from "vitest";

import {
  getBillingOffer,
  getOfferCheckoutDisabledHint,
  isOfferCheckoutReady,
  validatePaidAmount,
} from "@/lib/billing/billing-catalog";
import { reaisToCents } from "@/lib/billing/billing-gateway-event";
import {
  buildBillingExternalRef,
  parseBillingExternalRef,
} from "@/lib/domain/billing";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("billing catalog", () => {
  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
  });

  it("marca ofertas prontas quando MP_ACCESS_TOKEN existe", () => {
    process.env.MP_ACCESS_TOKEN = "TEST-token";
    expect(isOfferCheckoutReady()).toBe(true);
    expect(getOfferCheckoutDisabledHint()).toBeNull();
  });

  it("retorna hint quando falta MP_ACCESS_TOKEN", () => {
    expect(isOfferCheckoutReady()).toBe(false);
    expect(getOfferCheckoutDisabledHint()).toContain("MP_ACCESS_TOKEN");
  });

  it("valida valor pago contra catálogo", () => {
    const offer = getBillingOffer("pack_m");
    expect(validatePaidAmount(offer, 4900)).toBe(true);
    expect(validatePaidAmount(offer, 1900)).toBe(false);
  });

  it("converte reais do Mercado Pago para centavos com arredondamento", () => {
    expect(reaisToCents(39)).toBe(3900);
    expect(reaisToCents(19.0)).toBe(1900);
    expect(reaisToCents(89.99)).toBe(8999);
  });
});

describe("billing external ref", () => {
  it("gera e parseia referência do surfista", () => {
    const ref = buildBillingExternalRef(USER_ID, "surfista");
    expect(parseBillingExternalRef(ref)).toEqual({
      userId: USER_ID,
      offerKey: "surfista",
    });
  });

  it("rejeita referência inválida", () => {
    expect(parseBillingExternalRef("pedido-123")).toBeNull();
  });
});
