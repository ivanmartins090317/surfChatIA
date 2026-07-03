import { z } from "zod";

export const boardSpecResultSchema = z.object({
  shape: z.string().min(1),
  rails: z.string().min(1),
  bottom: z.string().min(1),
  tail: z.string().min(1),
  rocker: z.string().min(1),
});

export const boardSpecAiResponseSchema = z.object({
  spec: boardSpecResultSchema,
  ai_summary: z.string().min(20),
});

export type BoardSpecAiResponse = z.infer<typeof boardSpecAiResponseSchema>;

export function parseBoardSpecResult(raw: string): BoardSpecAiResponse {
  const json = JSON.parse(raw) as unknown;
  return boardSpecAiResponseSchema.parse(json);
}

export const boardMatchResultSchema = z.object({
  veredito: z.enum(["match", "partial", "no_match"]),
  pros: z.array(z.string()).min(1),
  contras: z.array(z.string()).min(1),
  condicoes_ideais: z.array(z.string()).min(1),
  distancia_da_magica: z.string().optional(),
});

export type BoardMatchResultParsed = z.infer<typeof boardMatchResultSchema>;

export function parseBoardMatchResult(raw: string): BoardMatchResultParsed {
  const json = JSON.parse(raw) as unknown;
  return boardMatchResultSchema.parse(json);
}
