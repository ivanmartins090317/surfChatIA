import { MercadoPagoConfig } from "mercadopago";

export function getMercadoPagoAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Pagamentos indisponíveis no momento. Configure MP_ACCESS_TOKEN ou tente mais tarde.",
    );
  }
  return token;
}

export function getMercadoPagoConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: getMercadoPagoAccessToken() });
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

export function isMercadoPagoTestMode(): boolean {
  return process.env.MP_ACCESS_TOKEN?.trim().startsWith("TEST-") ?? false;
}
