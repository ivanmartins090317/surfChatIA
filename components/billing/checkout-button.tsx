"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { startCheckoutAction } from "@/actions/billing-actions";
import { Button } from "@/components/ui/button";
import type { BillingOfferKey } from "@/lib/domain/billing";

interface CheckoutButtonProps {
  offerKey: BillingOfferKey;
  label: string;
  variant?: "default" | "secondary" | "outline";
  className?: string;
  disabled?: boolean;
  disabledHint?: string | null;
}

export function CheckoutButton({
  offerKey,
  label,
  variant = "default",
  className,
  disabled = false,
  disabledHint = null,
}: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckoutAction(offerKey);
      if (!result.success || !result.data) {
        setError(
          result.error ??
            "Não foi possível abrir o checkout. Tente de novo ou contate o suporte.",
        );
        return;
      }

      window.location.href = result.data.checkoutUrl;
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={disabled || isPending}
        onClick={handleCheckout}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Abrindo checkout…
          </>
        ) : (
          label
        )}
      </Button>
      {disabled && disabledHint ? (
        <p className="text-xs text-muted-foreground">{disabledHint}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
