import type { Board, BoardSensation, Profile } from "@/lib/domain/types";
import { SURF_LEVELS, WAVE_TYPES } from "@/lib/domain/types";

export function buildBoardSpecSystemPrompt(): string {
  return `Você é um shaper e analista de pranchas de surf. Com base nas fotos descritas e medidas informadas, gere uma ficha técnica.
Responda SOMENTE em JSON:
{
  "spec": {
    "shape": "string",
    "rails": "string",
    "bottom": "string",
    "tail": "string",
    "rocker": "string"
  },
  "ai_summary": "Por que esta prancha funciona para este surfista (2-4 frases)"
}
Use português do Brasil. Explique jargão brevemente entre parênteses.`;
}

export function buildBoardSpecUserPrompt(input: {
  profile: Profile | null;
  measurements: {
    length_in?: number | null;
    width_in?: number | null;
    thickness_in?: number | null;
    volume_l?: number | null;
  };
  sensation: BoardSensation | null;
  photoCount: number;
  name?: string | null;
}): string {
  const profileBlock = input.profile
    ? `Nível: ${input.profile.surf_level ? SURF_LEVELS[input.profile.surf_level] : "?"}
Peso: ${input.profile.weight_kg ?? "?"} kg | Altura: ${input.profile.height_cm ?? "?"} cm
Onda habitual: ${input.profile.wave_type ? WAVE_TYPES[input.profile.wave_type] : "?"}`
    : "Perfil não informado.";

  const measures = [
    input.measurements.length_in != null
      ? `Comprimento: ${input.measurements.length_in}"`
      : null,
    input.measurements.width_in != null
      ? `Largura: ${input.measurements.width_in}"`
      : null,
    input.measurements.thickness_in != null
      ? `Espessura: ${input.measurements.thickness_in}"`
      : null,
    input.measurements.volume_l != null
      ? `Volume: ${input.measurements.volume_l} L`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const sensation = input.sensation
    ? JSON.stringify(input.sensation, null, 2)
    : "Sem sensações registradas.";

  return `[PRANCHA]
Nome: ${input.name ?? "Prancha mágica"}
Medidas: ${measures || "Não informadas"}
Fotos enviadas: ${input.photoCount} (deck, fundo, rails, rabeta, bico)

[SENSAÇÕES DO SURFISTA]
${sensation}

[PERFIL DO SURFISTA]
${profileBlock}

Gere ficha técnica detalhada e explique por que combina com o perfil.`;
}

export function buildBoardMatchSystemPrompt(): string {
  return `Você compara uma prancha candidata com o perfil do surfista e opcionalmente uma prancha mágica de referência.
As fotos anexadas mostram a prancha candidata — analise visualmente shape, tail, rails, rocker aparente, volume estimado e estado geral.
Cruze o que vê nas imagens com as medidas anunciadas e o perfil do surfista.
Responda SOMENTE em JSON:
{
  "veredito": "match" | "partial" | "no_match",
  "pros": ["string"],
  "contras": ["string"],
  "condicoes_ideais": ["string"],
  "distancia_da_magica": "string opcional"
}
Use português do Brasil. Explique jargão brevemente entre parênteses.`;
}

export function buildBoardMatchUserPrompt(input: {
  profile: Profile | null;
  magicBoard: Board | null;
  photoCount: number;
  advertisedMeasurements?: Record<string, number | null> | null;
}): string {
  const magic = input.magicBoard
    ? `Prancha mágica: ${input.magicBoard.name ?? "Referência"}
Medidas: ${input.magicBoard.length_in ?? "?"} x ${input.magicBoard.width_in ?? "?"} x ${input.magicBoard.thickness_in ?? "?"} | ${input.magicBoard.volume_l ?? "?"}L
Resumo IA: ${input.magicBoard.ai_summary ?? "—"}`
    : "Sem prancha mágica cadastrada — avalie só com perfil.";

  const profileBlock = input.profile
    ? `Nível: ${input.profile.surf_level ?? "?"}
Peso/altura: ${input.profile.weight_kg ?? "?"}kg / ${input.profile.height_cm ?? "?"}cm
Onda: ${input.profile.wave_type ?? "?"}`
    : "Perfil incompleto.";

  return `[CANDIDATA]
Fotos anexadas: ${input.photoCount} (analise visualmente deck, fundo, rails, rabeta e bico)
Medidas anunciadas: ${JSON.stringify(input.advertisedMeasurements ?? {})}

[REFERÊNCIA]
${magic}

[PERFIL]
${profileBlock}

Dê veredito de compatibilidade.`;
}
