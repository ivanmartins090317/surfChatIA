import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Integração AbacatePay encerrada. Use /api/webhooks/mercadopago." },
    { status: 410 },
  );
}
