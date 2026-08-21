import type { BillingOfferKind } from "@/lib/domain/billing";

export function isAbacatePayDevMode(): boolean {
  return process.env.ABACATEPAY_API_KEY?.trim().startsWith("abc_dev_") ?? false;
}

export function resolveAbacatePayMethods(
  offerKind: BillingOfferKind,
): Array<"PIX" | "CARD"> {
  if (isAbacatePayDevMode()) {
    return ["PIX"];
  }

  if (offerKind === "subscription") {
    return ["CARD", "PIX"];
  }

  return ["PIX", "CARD"];
}

export function translateAbacatePayError(message: string): string {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (lower.includes("no subscription product with cycle")) {
    return "O produto deste plano no AbacatePay precisa ser de assinatura com ciclo mensual (cycle: MONTHLY). Produtos avulsos não funcionam em /subscriptions/create — recrie no painel.";
  }

  if (lower.includes("card is not available")) {
    return "Cartão não está habilitado nesta loja (comum em Dev mode). O checkout foi configurado para PIX — tente novamente.";
  }

  if (lower.includes("product") && lower.includes("not found")) {
    return "Produto não encontrado no AbacatePay. Confira se o ID em ABACATEPAY_PRODUCT_* corresponde ao painel e ao ambiente (Dev vs produção).";
  }

  return normalized;
}
