import type { AnalysisFocus, Profile, WaveType } from "@/lib/domain/types";
import { WAVE_TYPES, ANALYSIS_FOCUS, SURF_LEVELS } from "@/lib/domain/types";

export function buildPerformanceSystemPrompt(): string {
  return `Você é um coach de surf experiente. Analise a sessão descrita pelo usuário e responda SOMENTE em JSON válido com esta estrutura:
{
  "resumo": "string",
  "pontos_fortes": ["string"],
  "melhorias": ["string"],
  "prioridades_treino": ["string", "string", "string"],
  "score": 0-100
}
Use linguagem técnica acessível em português do Brasil. Não invente manobras não observáveis.`;
}

export function buildPerformanceUserPrompt(input: {
  profile: Profile | null;
  waveType?: WaveType | null;
  focus?: AnalysisFocus | null;
  mediaDescription: string;
}): string {
  const profileLines = input.profile
    ? [
        `Nome: ${input.profile.display_name ?? "Surfista"}`,
        `Nível: ${input.profile.surf_level ? SURF_LEVELS[input.profile.surf_level] : "não informado"}`,
        `Peso: ${input.profile.weight_kg ?? "?"} kg`,
        `Altura: ${input.profile.height_cm ?? "?"} cm`,
        `Onda habitual: ${input.profile.wave_type ? WAVE_TYPES[input.profile.wave_type] : "não informado"}`,
      ].join("\n")
    : "Perfil não preenchido.";

  const contextLines = [
    input.waveType ? `Onda da sessão: ${WAVE_TYPES[input.waveType]}` : null,
    input.focus ? `Foco: ${ANALYSIS_FOCUS[input.focus]}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `[PERFIL]
${profileLines}

[CONTEXTO DA SESSÃO]
${contextLines || "Sem contexto adicional."}

[MÍDIA]
${input.mediaDescription}

Analise a performance técnica: entrada na onda, postura, linha na parede, manobras e consistência.`;
}
