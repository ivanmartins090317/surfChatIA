import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoardMatchResult } from "@/lib/domain/types";
import { BOARD_MATCH_VERDICT_LABELS } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { getBoardMatchAnalysis } from "@/services/board-match-service";

interface CompatibilityResultPageProps {
  params: Promise<{ id: string }>;
}

function verdictBadgeVariant(
  veredito: BoardMatchResult["veredito"],
): "success" | "warning" | "destructive" {
  if (veredito === "match") return "success";
  if (veredito === "partial") return "warning";
  return "destructive";
}

export default async function CompatibilityResultPage({
  params,
}: CompatibilityResultPageProps) {
  const { id } = await params;
  const user = await requireAuthUser();
  const analysis = await getBoardMatchAnalysis(user.id, id);

  if (!analysis) {
    notFound();
  }

  const result = analysis.result_json as BoardMatchResult | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/compatibility/new">← Nova análise</Link>
      </Button>

      <h1 className="font-display text-3xl font-bold">Resultado</h1>

      {result && (
        <>
          <div className="flex justify-center">
            <Badge
              variant={verdictBadgeVariant(result.veredito)}
              className="px-6 py-2 text-base"
            >
              {BOARD_MATCH_VERDICT_LABELS[result.veredito]}
            </Badge>
          </div>

          {result.distancia_da_magica && (
            <Card>
              <CardHeader>
                <CardTitle>Distância da prancha mágica</CardTitle>
              </CardHeader>
              <CardContent>{result.distancia_da_magica}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Prós</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1">
                {result.pros.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contras</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1">
                {result.contras.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições ideais</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1">
                {result.condicoes_ideais.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {analysis.status === "error" && (
        <p className="text-destructive">Falha na análise. Tente novamente.</p>
      )}
    </div>
  );
}
