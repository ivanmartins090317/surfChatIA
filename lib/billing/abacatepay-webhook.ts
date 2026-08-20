import crypto from "node:crypto";

import {
  ABACATEPAY_WEBHOOK_PUBLIC_KEY,
  ABACATEPAY_WEBHOOK_SIGNATURE_HEADER,
} from "@/lib/billing/abacatepay-constants";

export interface AbacatePayWebhookPayload {
  id: string;
  event: string;
  apiVersion?: number;
  devMode?: boolean;
  data?: unknown;
}

function getConfiguredWebhookSecret(): string | undefined {
  return process.env.ABACATEPAY_WEBHOOK_SECRET?.trim() || undefined;
}

export function isValidWebhookSecret(provided: string | null): boolean {
  const configured = getConfiguredWebhookSecret();
  if (!configured || !provided) {
    return false;
  }

  const configuredBuffer = Buffer.from(configured, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (configuredBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(configuredBuffer, providedBuffer);
}

export function signAbacatePayWebhookBody(rawBody: string): string {
  return crypto
    .createHmac("sha256", ABACATEPAY_WEBHOOK_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
}

export function verifyAbacatePaySignature(
  rawBody: string,
  signatureFromHeader: string | null,
): boolean {
  if (!signatureFromHeader?.trim()) {
    return false;
  }

  const expectedSignature = signAbacatePayWebhookBody(rawBody);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signatureFromHeader.trim(), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function parseAbacatePayWebhookPayload(
  rawBody: string,
): AbacatePayWebhookPayload | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const id = record.id;
  const event = record.event;

  if (typeof id !== "string" || !id.trim()) {
    return null;
  }

  if (typeof event !== "string" || !event.trim()) {
    return null;
  }

  return {
    id,
    event,
    apiVersion:
      typeof record.apiVersion === "number" ? record.apiVersion : undefined,
    devMode: typeof record.devMode === "boolean" ? record.devMode : undefined,
    data: record.data,
  };
}

export async function handleAbacatePayWebhookEvent(
  payload: AbacatePayWebhookPayload,
): Promise<void> {
  const { handleAbacatePayWebhookEvent: processEvent } = await import(
    "@/services/billing-service"
  );
  await processEvent(payload);
}

export function getAbacatePaySignatureHeaderName(): string {
  return ABACATEPAY_WEBHOOK_SIGNATURE_HEADER;
}
