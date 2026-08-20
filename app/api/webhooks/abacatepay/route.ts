import { NextResponse } from "next/server";

import {
  getAbacatePaySignatureHeaderName,
  handleAbacatePayWebhookEvent,
  isValidWebhookSecret,
  parseAbacatePayWebhookPayload,
  verifyAbacatePaySignature,
} from "@/lib/billing/abacatepay-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const webhookSecret = url.searchParams.get("webhookSecret");

  if (!isValidWebhookSecret(webhookSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get(getAbacatePaySignatureHeaderName());

  if (!verifyAbacatePaySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = parseAbacatePayWebhookPayload(rawBody);

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await handleAbacatePayWebhookEvent(payload);
  } catch (error) {
    console.error("[abacatepay.webhook] falha ao processar evento", {
      eventId: payload.id,
      event: payload.event,
      message: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
