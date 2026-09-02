import crypto from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildAbacatePayWebhookEndpoint,
  extractAbacatePayWebhookSecret,
  isValidWebhookSecret,
  parseAbacatePayWebhookPayload,
  signAbacatePayWebhookBody,
  verifyAbacatePaySignature,
} from "@/lib/billing/abacatepay-webhook";

const WEBHOOK_SECRET = "test-webhook-secret-value";

describe("abacatepay webhook security", () => {
  afterEach(() => {
    delete process.env.ABACATEPAY_WEBHOOK_SECRET;
  });

  it("preserva + no secret da query string", () => {
    const secret = "h3UQrV8GKU7y5eG0aqqrK+SP9U2Azu5xo9xGTM3cJ7A=";
    process.env.ABACATEPAY_WEBHOOK_SECRET = secret;

    const rawUrl =
      "https://surfiacoach.modernxlab.com.br/api/webhooks/abacatepay?webhookSecret=" +
      secret;
    const encodedUrl = buildAbacatePayWebhookEndpoint(
      "https://surfiacoach.modernxlab.com.br",
      secret,
    );

    expect(extractAbacatePayWebhookSecret(rawUrl)).toBe(secret);
    expect(extractAbacatePayWebhookSecret(encodedUrl)).toBe(secret);
    expect(isValidWebhookSecret(extractAbacatePayWebhookSecret(rawUrl))).toBe(
      true,
    );
    expect(
      encodedUrl.includes("webhookSecret=") &&
        !encodedUrl.includes("webhookSecret=" + secret),
    ).toBe(true);
  });

  it("rejeita secret incorreto", () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
    expect(isValidWebhookSecret("outro-secret")).toBe(false);
  });

  it("valida assinatura HMAC do corpo raw", () => {
    const rawBody = JSON.stringify({
      id: "log_test123",
      event: "checkout.completed",
      apiVersion: 2,
      devMode: true,
      data: { amount: 1000 },
    });

    const signature = signAbacatePayWebhookBody(rawBody);
    expect(verifyAbacatePaySignature(rawBody, signature)).toBe(true);
    expect(verifyAbacatePaySignature(rawBody, "assinatura-invalida")).toBe(false);
  });

  it("parseia payload mínimo com id e event", () => {
    const rawBody = JSON.stringify({
      id: "log_abc",
      event: "subscription.renewed",
      devMode: false,
    });

    expect(parseAbacatePayWebhookPayload(rawBody)).toEqual({
      id: "log_abc",
      event: "subscription.renewed",
      apiVersion: undefined,
      devMode: false,
      data: undefined,
    });
  });

  it("rejeita payload sem id ou event", () => {
    expect(parseAbacatePayWebhookPayload(JSON.stringify({ event: "x" }))).toBeNull();
    expect(parseAbacatePayWebhookPayload("not-json")).toBeNull();
  });

  it("signAbacatePayWebhookBody bate com crypto nativo", () => {
    const rawBody = '{"id":"log_x","event":"checkout.completed"}';
    const expected = crypto
      .createHmac(
        "sha256",
        "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9",
      )
      .update(Buffer.from(rawBody, "utf8"))
      .digest("base64");

    expect(signAbacatePayWebhookBody(rawBody)).toBe(expected);
  });
});
