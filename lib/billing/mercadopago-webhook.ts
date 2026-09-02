import crypto from "node:crypto";

export function getMercadoPagoWebhookSecret(): string | undefined {
  return process.env.MP_WEBHOOK_SECRET?.trim() || undefined;
}

export function parseMercadoPagoSignatureHeader(
  header: string | null,
): { ts: string; v1: string } | null {
  if (!header?.trim()) return null;

  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const separator = segment.indexOf("=");
    if (separator <= 0) continue;
    const key = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (key && value) parts[key] = value;
  }

  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

export function buildMercadoPagoSignatureManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  const dataId = input.dataId.toLowerCase();
  return `id:${dataId};request-id:${input.requestId};ts:${input.ts};`;
}

export function signMercadoPagoManifest(
  manifest: string,
  secret: string,
): string {
  return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
}

function timingSafeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyMercadoPagoSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = getMercadoPagoWebhookSecret();
  const parsed = parseMercadoPagoSignatureHeader(input.xSignature);
  if (!secret || !parsed || !input.xRequestId?.trim() || !input.dataId?.trim()) {
    return false;
  }

  const manifest = buildMercadoPagoSignatureManifest({
    dataId: input.dataId,
    requestId: input.xRequestId,
    ts: parsed.ts,
  });
  const expected = signMercadoPagoManifest(manifest, secret);
  return timingSafeEqualHex(expected, parsed.v1);
}

export function parseMercadoPagoNotification(rawBody: string): {
  type: string;
  dataId: string;
} | null {
  try {
    const payload = JSON.parse(rawBody) as {
      type?: unknown;
      topic?: unknown;
      data?: { id?: unknown };
    };
    const type =
      typeof payload.type === "string"
        ? payload.type
        : typeof payload.topic === "string"
          ? payload.topic
          : "";
    const dataId =
      payload.data?.id === undefined || payload.data?.id === null
        ? ""
        : String(payload.data.id).trim();

    if (!type || !dataId) return null;
    return { type, dataId };
  } catch {
    return null;
  }
}
