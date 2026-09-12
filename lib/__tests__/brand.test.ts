import { describe, expect, it } from "vitest";
import { BRAND_NAME, COMPANY_NAME, PRODUCT_NAME } from "@/lib/brand";

describe("brand", () => {
  it("usa Surf AI Coach como nome do app na UI", () => {
    expect(PRODUCT_NAME).toBe("Surf AI Coach");
    expect(BRAND_NAME).toBe(PRODUCT_NAME);
  });

  it("reserva ModernXLab só como marca da empresa", () => {
    expect(COMPANY_NAME).toBe("ModernXLab");
    expect(BRAND_NAME).not.toBe(COMPANY_NAME);
  });
});
