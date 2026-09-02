import { NextResponse } from "next/server";

import { resolveMercadoPagoGatewayEvent } from "@/lib/billing/mercadopago-event-mapper";
import {
  parseMercadoPagoNotification,
  verifyMercadoPagoSignature,
} from "@/lib/billing/mercadopago-webhook";
import { handleMercadoPagoWebhookEvent } from "@/services/billing-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const notification = parseMercadoPagoNotification(rawBody);

  if (!notification) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const isValid = verifyMercadoPagoSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: notification.dataId,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await resolveMercadoPagoGatewayEvent(notification);
    if (event) {
      await handleMercadoPagoWebhookEvent(event);
    }
  } catch (error) {
    console.error("[mercadopago.webhook] falha ao processar evento", {
      type: notification.type,
      dataId: notification.dataId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
