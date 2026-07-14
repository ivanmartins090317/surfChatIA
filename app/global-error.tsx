"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao dashboard.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
