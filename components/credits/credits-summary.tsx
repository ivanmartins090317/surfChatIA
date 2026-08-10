import Link from "next/link";
import { Coins } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCreditsLabel } from "@/lib/domain/credits";
import type { CreditsSnapshot } from "@/lib/domain/types";

interface CreditsSummaryProps {
  credits: CreditsSnapshot;
  compact?: boolean;
}

export function CreditsSummary({ credits, compact = false }: CreditsSummaryProps) {
  if (credits.remaining < 1) {
    return <CreditsPaywall />;
  }

  if (compact) {
    return (
      <p className="text-sm text-muted-foreground">
        Você tem{" "}
        <span className="font-medium text-foreground">
          {formatCreditsLabel(credits.remaining)}
        </span>{" "}
        restantes.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3">
      <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary">
        <Coins className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">Créditos disponíveis</p>
        <p className="font-display text-2xl font-bold tabular-nums">
          {credits.remaining}
        </p>
      </div>
    </div>
  );
}

export function CreditsPaywall() {
  return (
    <Alert variant="warning">
      <AlertTitle>Sem créditos</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Você usou todos os créditos do plano grátis. Veja os planos de exemplo
          para continuar analisando.
        </span>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/planos">Ver planos</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
