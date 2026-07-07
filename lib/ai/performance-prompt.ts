import type { AnalysisFocus, MediaType, Profile, WaveType } from "@/lib/domain/types";
import { WAVE_TYPES, ANALYSIS_FOCUS, SURF_LEVELS } from "@/lib/domain/types";

const SCORE_CRITERIA = [
  "Entrada / take-off",
  "Postura e centro de gravidade",
  "Linha na parede",
  "Manobras e técnica",
  "Consistência e leitura",
] as const;

const PERFORMANCE_JSON_SHAPE = `{
  "criterios_score": [
    { "nome": "Entrada / take-off", "nota": 0-20, "comentario": "string — evidência observada" },
    { "nome": "Postura e centro de gravidade", "nota": 0-20, "comentario": "string" },
    { "nome": "Linha na parede", "nota": 0-20, "comentario": "string" },
    { "nome": "Manobras e técnica", "nota": 0-20, "comentario": "string" },
    { "nome": "Consistência e leitura", "nota": 0-20, "comentario": "string" }
  ],
  "score": 0-100,
  "resumo": "string — 3 a 5 frases específicas desta sessão",
  "pontos_fortes": ["string — mínimo 2, cada um com detalhe observável"],
  "melhorias_detalhadas": [
    {
      "titulo": "string curto",
      "observacao": "string — o que você viu ou inferiu com evidência (mín. 2 frases)",
      "impacto": "string — como isso limita velocidade, manobra ou consistência",
      "dica_pratica": "string — drill, foco mental ou ajuste corporal aplicável na água"
    }
  ],
  "prioridades_treino": ["string", "string", "string"]
}`;

const PERFORMANCE_IMAGE_JSON_SHAPE = `{
  "manobra_observada": "string",
  "detalhes_frame": "string",
  ${PERFORMANCE_JSON_SHAPE.slice(1)}`;

function buildScoreRules(mediaType: MediaType): string {
  const criteriaList = SCORE_CRITERIA.map((c) => `- ${c}: 0–20 pts`).join("\n");

  return `RUBRICA DE SCORE (obrigatória):
${criteriaList}

Regras do score:
- Avalie CADA critério de forma independente antes de somar.
- "score" DEVE ser a soma exata das 5 notas (0–100).
- NÃO use notas padrão (ex.: 15 em tudo ou total ~75). Varie conforme evidência.
- Se a evidência for fraca em um critério, a nota deve cair (pode ir abaixo de 10).
- Calibre expectativa ao nível do surfista informado no perfil.
- Priorize o foco solicitado (${mediaType === "link" ? "contexto declarado" : "manobras/velocidade/consistência"}) ao pesar "Manobras" e "Consistência".`;
}

function buildImprovementRules(): string {
  return `MELHORIAS (mínimo 3 itens em melhorias_detalhadas):
- Cada item precisa ser acionável e específico desta análise — nada genérico tipo "melhore a postura".
- "observacao" cita corpo, equipamento, linha ou timing observáveis.
- "dica_pratica" traz um exercício ou foco que o surfista pode testar na próxima sessão.`;
}

export function buildPerformanceSystemPrompt(mediaType: MediaType): string {
  const sharedRules = `${buildScoreRules(mediaType)}

${buildImprovementRules()}

Responda SOMENTE em JSON válido. Linguagem técnica acessível em português do Brasil.`;

  if (mediaType === "image") {
    return `Você é um coach de surf experiente analisando UM FRAME (foto) de uma manobra ou momento da session.
${sharedRules}

Formato:
${PERFORMANCE_IMAGE_JSON_SHAPE}

Regras adicionais:
- Baseie-se APENAS no visível na foto.
- Identifique manobra ou fase (bottom turn, cutback, reentry, take-off, trim, etc.).
- Notas altas só com evidência clara no frame; frames parciais não recebem 80+ sem justificativa.`;
  }

  if (mediaType === "video") {
    return `Você é um coach de surf experiente analisando FRAMES extraídos de um vídeo de surf (amostras em momentos diferentes).
${sharedRules}

Formato:
${PERFORMANCE_IMAGE_JSON_SHAPE}

Regras adicionais:
- Compare os frames para inferir sequência, ritmo e consistência.
- "manobra_observada" descreve a manobra ou fase mais relevante entre os frames.
- "detalhes_frame" sintetiza postura, linha e posição na onda vistos nos frames.
- Se frames mostrarem momentos distintos, mencione evolução ou repetição de padrão.
- Diferencie claramente esta sessão de uma análise genérica — cite o que é único aqui.`;
  }

  return `Você é um coach de surf. O usuário enviou um LINK de vídeo — você NÃO assistiu ao vídeo.
${sharedRules}

Formato:
${PERFORMANCE_JSON_SHAPE}

Regras adicionais:
- Deixe claro no "resumo" que a orientação é baseada no contexto informado, não em visualização do vídeo.
- Não invente manobras específicas. Use checklist técnico aplicável.
- Score deve refletir incerteza: sem evidência visual, evite totais acima de 65 a menos que o contexto seja muito detalhado.`;
}

export function buildPerformanceUserPrompt(input: {
  profile: Profile | null;
  waveType?: WaveType | null;
  focus?: AnalysisFocus | null;
  mediaType: MediaType;
  mediaDescription: string;
  videoFrameTimestamps?: string[];
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
    input.focus ? `Foco solicitado: ${ANALYSIS_FOCUS[input.focus]}` : null,
    `Tipo de mídia: ${input.mediaType}`,
    input.videoFrameTimestamps?.length
      ? `Frames do vídeo (ordem cronológica): ${input.videoFrameTimestamps.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const analysisInstruction =
    input.mediaType === "image"
      ? "Analise o frame anexado com rigor: manobra, postura, linha, peso nos pés e o que pode melhorar neste instante."
      : input.mediaType === "video"
        ? "Analise os frames anexados como amostras do vídeo. Cruze os momentos para avaliar técnica, consistência e prioridades de treino."
        : "Com base no link e contexto, dê orientação técnica honesta (sem afirmar que viu o vídeo).";

  return `[PERFIL]
${profileLines}

[CONTEXTO DA SESSÃO]
${contextLines}

[MÍDIA]
${input.mediaDescription}

${analysisInstruction}`;
}
