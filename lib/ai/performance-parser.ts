import { z } from "zod";

const criterioScoreSchema = z.object({
  nome: z.string().min(3),
  nota: z.number().min(0).max(20),
  comentario: z.string().min(8),
});

const melhoriaDetalhadaSchema = z.object({
  titulo: z.string().min(3),
  observacao: z.string().min(20),
  impacto: z.string().min(15),
  dica_pratica: z.string().min(15),
});

const performanceResultSchema = z
  .object({
    resumo: z.string().min(20),
    pontos_fortes: z.array(z.string().min(5)).min(2),
    melhorias: z.array(z.string()).optional(),
    melhorias_detalhadas: z.array(melhoriaDetalhadaSchema).min(3).optional(),
    prioridades_treino: z.tuple([z.string(), z.string(), z.string()]),
    score: z.number().min(0).max(100).optional(),
    criterios_score: z.array(criterioScoreSchema).length(5).optional(),
    manobra_observada: z.string().min(3).optional(),
    detalhes_frame: z.string().min(3).optional(),
  })
  .superRefine((value, ctx) => {
    const hasDetailed = (value.melhorias_detalhadas?.length ?? 0) >= 3;
    const hasLegacy = (value.melhorias?.length ?? 0) >= 1;

    if (!hasDetailed && !hasLegacy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe melhorias_detalhadas (mín. 3) ou melhorias.",
        path: ["melhorias_detalhadas"],
      });
    }
  });

export type PerformanceResultParsed = z.infer<typeof performanceResultSchema>;

export interface PerformanceResultNormalized
  extends Omit<PerformanceResultParsed, "melhorias"> {
  melhorias: string[];
}

function deriveMelhorias(
  detalhadas: z.infer<typeof melhoriaDetalhadaSchema>[] | undefined,
  legacy: string[] | undefined,
): string[] {
  if (detalhadas?.length) {
    return detalhadas.map((item) => item.titulo);
  }
  return legacy ?? [];
}

function normalizeScoreFromCriteria(
  score: number | undefined,
  criterios: z.infer<typeof criterioScoreSchema>[] | undefined,
): number | undefined {
  if (!criterios?.length) {
    return score;
  }
  return criterios.reduce((total, criterio) => total + criterio.nota, 0);
}

export function parsePerformanceResult(raw: string): PerformanceResultNormalized {
  const json = JSON.parse(raw) as unknown;
  const parsed = performanceResultSchema.parse(json);

  const melhorias = deriveMelhorias(
    parsed.melhorias_detalhadas,
    parsed.melhorias,
  );
  const score = normalizeScoreFromCriteria(
    parsed.score,
    parsed.criterios_score,
  );

  return {
    ...parsed,
    melhorias,
    score,
  };
}
