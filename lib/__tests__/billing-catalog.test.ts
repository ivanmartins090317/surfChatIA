import { afterEach, describe, expect, it } from "vitest";

import {
  getBillingOffer,
  getOfferCheckoutDisabledHint,
  isOfferCheckoutReady,
  resolveOfferByProductId,
  validatePaidAmount,
} from "@/lib/billing/billing-catalog";
import {
  buildBillingExternalRef,
  parseBillingExternalRef,
} from "@/lib/domain/billing";

const USER_ID = "11111111-1111-4111-8111-111111111111";

describe("billing catalog", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_API_KEY;
    delete process.env.ABACATEPAY_PRODUCT_PACK_S;
    delete process.env.ABACATEPAY_PRODUCT_SURFISTA;
  });

  it("detecta oferta pronta para checkout quando product id existe", () => {
    process.env.ABACATEPAY_PRODUCT_SURFISTA = "prod_surfista_test";
    expect(isOfferCheckoutReady("surfista")).toBe(true);
  });

  it("retorna hint quando falta product id da oferta", () => {
    process.env.ABACATEPAY_API_KEY = "abc_dev_test";
    expect(getOfferCheckoutDisabledHint("surfista")).toContain(
      "ABACATEPAY_PRODUCT_SURFISTA",
    );
  });

  it("mapeia oferta pack_s pelo product id configurado", () => {
    process.env.ABACATEPAY_PRODUCT_PACK_S = "prod_pack_s_test";
    const resolved = resolveOfferByProductId("prod_pack_s_test");
    expect(resolved?.offerKey).toBe("pack_s");
    expect(resolved?.offer.credits).toBe(5);
  });

  it("valida valor pago contra catálogo", () => {
    const offer = getBillingOffer("pack_m");
    expect(validatePaidAmount(offer, 4900)).toBe(true);
    expect(validatePaidAmount(offer, 1900)).toBe(false);
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
