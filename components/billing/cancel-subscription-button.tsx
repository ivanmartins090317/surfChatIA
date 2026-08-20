"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cancelSubscriptionAction } from "@/actions/billing-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CancelSubscriptionButtonProps {
  disabled?: boolean;
}

export function CancelSubscriptionButton({
  disabled = false,
}: CancelSubscriptionButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (!result.success) {
        setError(
          result.error ??
            "Não foi possível cancelar. Tente novamente ou contate o suporte.",
        );
        return;
      }
      setOpen(false);
    });
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isPending}
            className="min-h-[44px]"
          >
            Cancelar assinatura
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar assinatura?</DialogTitle>
            <DialogDescription>
              Você mantém o plano e os créditos do ciclo atual até o fim do
              período já pago. Depois disso, volta ao plano grátis (créditos
              avulsos permanecem).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button type="button" onClick={handleCancel} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Cancelando…
                </>
              ) : (
                "Confirmar cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
