import Link from "next/link";
import { MagicBoardWizard } from "@/components/board-spec/magic-board-wizard";
import { CreditsSummary } from "@/components/credits/credits-summary";
import { Button } from "@/components/ui/button";
import { requireAuthUser } from "@/lib/supabase/server";
import { getCreditsSnapshot } from "@/services/usage-service";

export const metadata = { title: "Nova prancha mágica" };

export default async function NewBoardPage() {
  const user = await requireAuthUser();
  const credits = await getCreditsSnapshot(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/boards">← Pranchas</Link>
      </Button>
      <div>
        <h1 className="font-display text-3xl font-bold">Prancha mágica</h1>
        <p className="mt-1 text-muted-foreground">
          Envie fotos e sensações — a IA gera a ficha técnica.
        </p>
      </div>
      <CreditsSummary credits={credits} compact />
      {credits.remaining >= 1 ? <MagicBoardWizard /> : null}
    </div>
  );
}
