import Link from "next/link";
import { CreditsSummary } from "@/components/credits/credits-summary";
import { NewAnalysisForm } from "@/components/performance-analysis/new-analysis-form";
import { Button } from "@/components/ui/button";
import { requireAuthUser } from "@/lib/supabase/server";
import { getCreditsSnapshot } from "@/services/usage-service";

export const metadata = { title: "Nova análise" };

export default async function NewAnalysisPage() {
  const user = await requireAuthUser();
  const credits = await getCreditsSnapshot(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/analyses">← Voltar</Link>
        </Button>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold">Nova análise</h1>
        <p className="mt-1 text-muted-foreground">
          Envie vídeo, imagem ou link da sua session.
        </p>
      </div>
      <CreditsSummary credits={credits} compact />
      {credits.remaining >= 1 ? <NewAnalysisForm /> : null}
    </div>
  );
}
