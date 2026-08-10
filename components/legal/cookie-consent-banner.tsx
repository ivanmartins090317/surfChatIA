"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const COOKIE_CONSENT_STORAGE_KEY = "surfai-cookie-consent-v1";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!stored) setIsVisible(true);
    } catch {
      setIsVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "essential");
    } catch {
      // storage indisponível — apenas fecha o aviso nesta sessão
    }
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur sm:p-5"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Usamos cookies essenciais de sessão para manter seu login. Não usamos
          cookies de marketing nesta versão. Veja a{" "}
          <Link
            href="/privacidade"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <Button
          type="button"
          size="lg"
          className="w-full shrink-0 sm:w-auto"
          onClick={dismiss}
        >
          Entendi
        </Button>
      </div>
    </div>
  );
}
