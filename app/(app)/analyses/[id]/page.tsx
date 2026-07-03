import Link from "next/link";
import { notFound } from "next/navigation";
import { PerformanceResultView } from "@/components/performance-analysis/performance-result-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerformanceResult } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { getPerformanceAnalysis } from "@/services/analysis-service";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AnalysisDetailPageProps) {
  const { id } = await params;
  return { title: `Análise ${id.slice(0, 8)}` };
}

export default async function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { id } = await params;
  const user = await requireAuthUser();
  const analysis = await getPerformanceAnalysis(user.id, id);

  if (!analysis) {
    notFound();
  }

  const result = analysis.result_json as PerformanceResult | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/analyses">← Análises</Link>
        </Button>
        <Badge
          variant={
            analysis.status === "done"
              ? "success"
              : analysis.status === "error"
                ? "destructive"
                : "info"
          }
        >
          {analysis.status === "done"
            ? "Pronto"
            : analysis.status === "error"
              ? "Falhou"
              : "Processando"}
        </Badge>
      </div>

      <h1 className="font-display text-3xl font-bold">Resultado da análise</h1>

      {analysis.status === "processing" && (
        <div className="space-y-4">
          <Alert variant="info">
            <AlertDescription>
              A IA está analisando sua session. Atualize a página em alguns
              segundos.
            </AlertDescription>
          </Alert>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {analysis.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            Falha no processamento. Verifique sua chave de IA ou tente uma nova
            análise.
          </AlertDescription>
        </Alert>
      )}

      {analysis.status === "done" && result && (
        <PerformanceResultView result={result} />
      )}
    </div>
  );
}
