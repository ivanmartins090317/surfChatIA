import { z } from "zod";

export const performanceResultSchema = z.object({
  resumo: z.string().min(10),
  pontos_fortes: z.array(z.string()).min(1),
  melhorias: z.array(z.string()).min(1),
  prioridades_treino: z.tuple([z.string(), z.string(), z.string()]),
  score: z.number().min(0).max(100).optional(),
});

export type PerformanceResultParsed = z.infer<typeof performanceResultSchema>;

export function parsePerformanceResult(raw: string): PerformanceResultParsed {
  const json = JSON.parse(raw) as unknown;
  return performanceResultSchema.parse(json);
}
