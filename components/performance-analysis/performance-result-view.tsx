import { CheckCircle2, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  MelhoriaDetalhada,
  ManeuverConfidence,
  PerformanceResult,
} from "@/lib/domain/types";
import { MANEUVER_CONFIDENCE_LEVELS } from "@/lib/domain/types";

interface PerformanceResultViewProps {
  result: PerformanceResult;
}

const CONFIDENCE_BADGE_VARIANT: Record<
  ManeuverConfidence,
  "success" | "warning" | "destructive"
> = {
  alta: "success",
  media: "warning",
  baixa: "destructive",
};

function ManeuverConfidenceBadge({
  confidence,
}: {
  confidence: ManeuverConfidence;
}) {
  return (
    <Badge variant={CONFIDENCE_BADGE_VARIANT[confidence]}>
      {MANEUVER_CONFIDENCE_LEVELS[confidence]}
    </Badge>
  );
}

function ScoreBreakdown({ result }: { result: PerformanceResult }) {
  if (!result.criterios_score?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" aria-hidden />
          Critérios do Surf Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.criterios_score.map((criterio) => (
          <div key={criterio.nome} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{criterio.nome}</span>
              <span className="tabular-nums text-primary">
                {criterio.nota}/20
              </span>
            </div>
            <Progress value={(criterio.nota / 20) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {criterio.comentario}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MelhoriaCard({ item }: { item: MelhoriaDetalhada }) {
  return (
    <div className="space-y-3 rounded-xl border border-white/08 bg-card/80 p-4">
      <h4 className="font-medium leading-snug">{item.titulo}</h4>
      <div className="space-y-2 text-sm leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">O que observei: </span>
          <span className="text-muted-foreground">{item.observacao}</span>
        </p>
        <p>
          <span className="font-semibold text-foreground">Por que importa: </span>
          <span className="text-muted-foreground">{item.impacto}</span>
        </p>
        <p className="flex items-start gap-2">
          <Lightbulb
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <span>
            <span className="font-semibold text-foreground">Na água: </span>
            <span className="text-muted-foreground">{item.dica_pratica}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

function MelhoriasList({ result }: { result: PerformanceResult }) {
  if (result.melhorias_detalhadas?.length) {
    return (
      <div className="space-y-4">
        {result.melhorias_detalhadas.map((item) => (
          <MelhoriaCard key={item.titulo} item={item} />
        ))}
      </div>
    );
  }

  return (
    <ul className="list-inside list-disc space-y-2 text-muted-foreground">
      {result.melhorias.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
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
            {result.criterios_score?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Soma de 5 critérios técnicos (0–20 cada)
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <ScoreBreakdown result={result} />

      {result.manobra_observada && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Zap className="size-5 text-primary" aria-hidden />
                Manobra observada
              </span>
              {result.confianca_manobra && (
                <ManeuverConfidenceBadge confidence={result.confianca_manobra} />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg font-medium leading-relaxed">
              {result.manobra_observada}
            </p>
            {result.detalhes_frame && (
              <p className="text-muted-foreground leading-relaxed">
                {result.detalhes_frame}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {result.manobra_observada ? "Resumo técnico" : "Resumo da sessão"}
          </CardTitle>
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
          <MelhoriasList result={result} />
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
