import Link from "next/link";
import { Plus } from "lucide-react";
import { AnalysisListCard } from "@/components/performance-analysis/analysis-list-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthUser } from "@/lib/supabase/server";
import { listPerformanceAnalysesWithMedia } from "@/services/analysis-service";

export const metadata = { title: "Análises" };

export default async function AnalysesPage() {
  const user = await requireAuthUser();
  const analyses = await listPerformanceAnalysesWithMedia(user.id).catch(
    () => [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold">Análises</h1>
          <p className="text-muted-foreground">Histórico de feedback de performance.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/analyses/new">
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        </Button>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma análise ainda.{" "}
            <Link href="/analyses/new" className="text-primary hover:underline">
              Enviar primeira session
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {analyses.map((item) => (
            <li key={item.analysis.id}>
              <AnalysisListCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
