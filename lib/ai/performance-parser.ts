import { z } from "zod";
import type { WavePhase } from "@/lib/domain/types";

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

const wavePhaseSchema = z.object({
  nome: z.string().min(3).max(80),
  frame_index: z.number().int().min(0).max(31),
  timestamp: z.string().min(1).max(16),
  qualidade_execucao: z.enum(["boa", "regular", "falhou"]),
  confianca_identificacao: z.enum(["alta", "media", "baixa"]),
  o_que_vi: z.string().min(8).max(800),
  como_melhorar: z.string().min(8).max(800),
  coaching_image_path: z.string().optional(),
});

const leituraDaSecaoSchema = z.object({
  o_que_a_onda_fez: z.string().min(12).max(800),
  alternativa: z.string().min(12).max(800),
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
    confianca_manobra: z.enum(["alta", "media", "baixa"]).optional(),
    detalhes_frame: z.string().min(3).optional(),
    fases: z.array(wavePhaseSchema).max(16).optional(),
    leitura_da_secao: leituraDaSecaoSchema.optional(),
    coaching_visual_status: z
      .enum(["pending", "processing", "ready", "skipped"])
      .optional(),
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
  extends Omit<PerformanceResultParsed, "melhorias" | "fases"> {
  melhorias: string[];
  fases?: WavePhase[];
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

function stripUntrustedCoachingPaths(
  fases: z.infer<typeof wavePhaseSchema>[] | undefined,
): WavePhase[] | undefined {
  if (!fases?.length) return undefined;

  return fases.map((fase) => ({
    nome: fase.nome,
    frame_index: fase.frame_index,
    timestamp: fase.timestamp,
    qualidade_execucao: fase.qualidade_execucao,
    confianca_identificacao: fase.confianca_identificacao,
    o_que_vi: fase.o_que_vi,
    como_melhorar: fase.como_melhorar,
  }));
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
    fases: stripUntrustedCoachingPaths(parsed.fases),
    coaching_visual_status: undefined,
  };
}
