import { NextResponse } from "next/server";
import { reportServerError } from "@/lib/observability/report-server-error";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  if (!process.env.SENTRY_DSN?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "SENTRY_DSN não configurado em .env.local",
      },
      { status: 503 },
    );
  }

  const error = new Error("Teste Sentry — dev only (surf-ai-coach)");
  reportServerError(error, {
    area: "ai",
    operation: "sentry_dev_test",
  });

  return NextResponse.json({
    ok: true,
    message: "Evento enviado ao Sentry. Confira Issues no painel em ~30s.",
  });
}
