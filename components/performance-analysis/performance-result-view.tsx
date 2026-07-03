import { CheckCircle2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceResult } from "@/lib/domain/types";

interface PerformanceResultViewProps {
  result: PerformanceResult;
}

export function PerformanceResultView({ result }: PerformanceResultViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {result.score != null && (
        <Card className="grad-surface-glow text-center">
          <CardContent className="py-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Surf Score
            </p>
            <p className="font-display text-6xl font-bold tabular-nums text-primary">
              {result.score}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo da sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{result.resumo}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" aria-hidden />
            Pontos fortes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            {result.pontos_fortes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pontos de melhoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
            {result.melhorias.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5 text-primary" aria-hidden />
            Prioridades de treino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.prioridades_treino.map((item, index) => (
            <div key={item} className="flex items-start gap-3">
              <Badge variant="primary">{index + 1}</Badge>
              <p>{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
