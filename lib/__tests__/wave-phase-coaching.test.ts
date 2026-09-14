import { describe, expect, it } from "vitest";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";
import { buildPerformanceSystemPrompt } from "@/lib/ai/performance-prompt";
import { validateCoachingImageBytes } from "@/lib/ai/edit-coaching-image";
import {
  COACHING_ANNOTATED_CAPTION,
  COACHING_PREPARING_COPY,
  MAX_WAVE_COACHING_IMAGES,
  WAVE_COACHING_VISUAL_ENABLED,
  buildCoachingEditPrompt,
  deriveLegacyManeuverName,
  finalizeVideoPerformanceResult,
  needsCoachingVisual,
  normalizeWavePhases,
  selectCoachingPhases,
  toPersistedPerformanceResult,
} from "@/lib/ai/wave-coaching";
import {
  collectCoachingImagePathsFromResult,
  getWavePhaseIdentificationLabel,
  hasWavePhaseTimeline,
} from "@/lib/domain/analysis-display";
import type { WavePhase } from "@/lib/domain/types";
import { buildCoachingImageStoragePath } from "@/lib/media/storage-path";
import { VIDEO_FRAME_COUNT } from "@/lib/media/video-frame-sampling";

const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function validBaseResult() {
  return {
    resumo:
      "Ride com drop cadenciado, bottom turn curto e batida sem conexão no lip.",
    pontos_fortes: ["Linha na parede", "Leitura da seção"],
    melhorias_detalhadas: [
      {
        titulo: "Vertical da batida",
        observacao: "No frame em 0:12 a prancha não chega no lip com rail.",
        impacto: "A seção fecha sem gerar spray nem velocidade de saída.",
        dica_pratica: "Olhe o lip e leve o bico às 12h na subida.",
      },
      {
        titulo: "Amplitude do bottom turn",
        observacao: "O bottom turn termina cedo e o bico aponta para a praia.",
        impacto: "Falta projeção para a manobra seguinte.",
        dica_pratica: "Complete o arco até o rail interno enterrar.",
      },
      {
        titulo: "Mão no rail",
        observacao: "A mão da frente não conduz o trilho na subida.",
        impacto: "A prancha abre e perde a linha.",
        dica_pratica: "Use a mão da frente para guiar o rail até o lip.",
      },
    ],
    prioridades_treino: ["Bottom turn", "Batida", "Leitura de seção"],
    score: 60,
  };
}

function phase(overrides: Partial<WavePhase>): WavePhase {
  return {
    nome: "Drop",
    frame_index: 0,
    timestamp: "0:04",
    qualidade_execucao: "boa",
    confianca_identificacao: "alta",
    o_que_vi: "Surfista em pé com prancha alinhada à parede.",
    como_melhorar: "Manter o olhar na seção seguinte.",
    ...overrides,
  };
}

describe("contrato de fases da onda", () => {
  it("aceita JSON com fases e leitura da seção", () => {
    const raw = JSON.stringify({
      ...validBaseResult(),
      fases: [
        phase({ nome: "Drop", frame_index: 0, timestamp: "0:04" }),
        phase({
          nome: "Batida / Off the lip",
          frame_index: 3,
          timestamp: "0:18",
          qualidade_execucao: "falhou",
          o_que_vi: "Prancha sobe sem vertical e perde o lip.",
          como_melhorar: "Olhar o lip e apontar o bico às 12h.",
        }),
      ],
      leitura_da_secao: {
        o_que_a_onda_fez: "A seção fechou rápido depois da primeira batida.",
        alternativa: "Abortar a segunda manobra fez sentido; emendar perderia a linha.",
      },
      manobra_observada: "Batida / Off the lip",
      confianca_manobra: "alta",
    });

    const parsed = parsePerformanceResult(raw);
    expect(parsed.fases).toHaveLength(2);
    expect(parsed.leitura_da_secao?.alternativa).toMatch(/Abortar/);
    expect(parsed.coaching_visual_status).toBeUndefined();
  });

  it("descarta coaching_image_path vindo da IA", () => {
    const raw = JSON.stringify({
      ...validBaseResult(),
      fases: [
        phase({
          qualidade_execucao: "regular",
          coaching_image_path: "https://evil.example/x.png",
        }),
      ],
    });

    const parsed = parsePerformanceResult(raw);
    expect(parsed.fases?.[0]?.coaching_image_path).toBeUndefined();
  });

  it("aceita análise antiga sem fases", () => {
    const parsed = parsePerformanceResult(JSON.stringify(validBaseResult()));
    expect(parsed.fases).toBeUndefined();
    expect(hasWavePhaseTimeline(parsed)).toBe(false);
  });

  it("rejeita qualidade de execução inválida", () => {
    const raw = JSON.stringify({
      ...validBaseResult(),
      fases: [phase({ qualidade_execucao: "excelente" as WavePhase["qualidade_execucao"] })],
    });
    expect(() => parsePerformanceResult(raw)).toThrow();
  });
});

describe("normalização e coaching das fases", () => {
  it("descarta fase sem foto correspondente", () => {
    const fases = normalizeWavePhases(
      [
        phase({ frame_index: 0, timestamp: "errado" }),
        phase({ frame_index: 9, nome: "Batida / Off the lip" }),
      ],
      ["0:04", "0:12"],
    );

    expect(fases).toHaveLength(1);
    expect(fases[0]?.timestamp).toBe("0:04");
    expect(fases[0]?.coaching_image_path).toBeUndefined();
  });

  it("seleciona no máximo 3 fases regular/falhou com evidência única", () => {
    const selected = selectCoachingPhases([
      phase({ nome: "Drop", qualidade_execucao: "boa" }),
      phase({
        nome: "Bottom turn",
        frame_index: 1,
        qualidade_execucao: "regular",
      }),
      phase({
        nome: "Batida / Off the lip",
        frame_index: 2,
        qualidade_execucao: "falhou",
      }),
      phase({
        nome: "Cutback",
        frame_index: 2,
        qualidade_execucao: "regular",
      }),
      phase({
        nome: "Linha da onda",
        frame_index: 3,
        qualidade_execucao: "regular",
      }),
      phase({
        nome: "snap",
        frame_index: 4,
        qualidade_execucao: "falhou",
      }),
    ]);

    expect(selected).toHaveLength(MAX_WAVE_COACHING_IMAGES);
    expect(selected.map((item) => item.nome)).toEqual([
      "Bottom turn",
      "Batida / Off the lip",
      "Linha da onda",
    ]);
  });

  it("não agenda pintura da foto enquanto o visual está desligado", () => {
    expect(WAVE_COACHING_VISUAL_ENABLED).toBe(false);

    const withFail = finalizeVideoPerformanceResult(
      {
        ...validBaseResult(),
        fases: [
          phase({ qualidade_execucao: "boa" }),
          phase({
            nome: "Batida / Off the lip",
            frame_index: 1,
            qualidade_execucao: "falhou",
            como_melhorar: "Olhar o lip e subir com o bico às 12h.",
          }),
        ],
      },
      ["0:04", "0:12"],
    );
    expect(withFail.coaching_visual_status).toBe("skipped");
    expect(needsCoachingVisual(withFail)).toBe(false);

    const allGood = finalizeVideoPerformanceResult(
      {
        ...validBaseResult(),
        fases: [phase({ qualidade_execucao: "boa" })],
      },
      ["0:04"],
    );
    expect(allGood.coaching_visual_status).toBe("skipped");
  });

  it("não persiste timeline em foto ou link", () => {
    const parsed = parsePerformanceResult(
      JSON.stringify({
        ...validBaseResult(),
        fases: [phase({ qualidade_execucao: "falhou" })],
        leitura_da_secao: {
          o_que_a_onda_fez: "Seção fechou no fim da ride observada.",
          alternativa: "Abortar a segunda manobra era a leitura correta.",
        },
      }),
    );

    const imageResult = toPersistedPerformanceResult("image", parsed, ["0:04"]);
    expect(imageResult.fases).toBeUndefined();
    expect(imageResult.leitura_da_secao).toBeUndefined();
    expect(imageResult.coaching_visual_status).toBeUndefined();
  });

  it("deriva manobra observada da fase de manobra mais relevante", () => {
    expect(
      deriveLegacyManeuverName([
        phase({ nome: "Drop" }),
        phase({ nome: "Batida / Off the lip", frame_index: 1 }),
      ]),
    ).toBe("Batida / Off the lip");
  });
});

describe("rótulos e copy de coaching", () => {
  it("rotula certeza da identificação, não qualidade técnica", () => {
    const label = getWavePhaseIdentificationLabel(
      phase({
        nome: "Batida / Off the lip",
        confianca_identificacao: "alta",
      }),
    );

    expect(label).toBe("Certeza alta de que era Batida / Off the lip");
    expect(label.toLowerCase()).not.toContain("bem feita");
    expect(label).not.toBe("Alta confiança");
  });

  it("usa copy de ajuste sugerido, nunca foto ideal", () => {
    expect(COACHING_ANNOTATED_CAPTION).toBe("Ajuste sugerido neste instante");
    expect(COACHING_PREPARING_COPY).toBe("Preparando o visual do ajuste");
    expect(COACHING_ANNOTATED_CAPTION.toLowerCase()).not.toContain("foto ideal");

    const prompt = buildCoachingEditPrompt(
      phase({
        qualidade_execucao: "falhou",
        como_melhorar: "Olhar o lip e completar o arco do bottom turn.",
      }),
    );
    expect(prompt).toMatch(/Do not generate a different person/i);
    expect(prompt).toContain("Keep the same surfer");
    expect(prompt.toLowerCase()).not.toContain("foto ideal");
  });

  it("pinta um traço só, sem texto nem caption na foto", () => {
    const dica = "Mantenha o centro de gravidade mais baixo durante as manobras.";
    const prompt = buildCoachingEditPrompt(
      phase({
        nome: "Bottom turn",
        qualidade_execucao: "regular",
        como_melhorar: dica,
      }),
    );

    expect(prompt).toMatch(/GRAPHICS ONLY/i);
    expect(prompt).toMatch(/Do not write on the photo/i);
    expect(prompt).toMatch(/FORBIDDEN: any text/i);
    expect(prompt).toMatch(/One mark only/i);
    expect(prompt).not.toContain(dica);
    expect(prompt).toMatch(/exactly ONE mark/i);
    expect(prompt).toMatch(/arc on the water/i);
  });

  it("escolhe a marca pela fase, não um amontoado de setas", () => {
    const batida = buildCoachingEditPrompt(
      phase({ nome: "Batida / Off the lip", qualidade_execucao: "falhou" }),
    );
    const cutback = buildCoachingEditPrompt(
      phase({ nome: "Cutback", qualidade_execucao: "regular" }),
    );
    const olhar = buildCoachingEditPrompt(
      phase({
        nome: "Wipeout",
        qualidade_execucao: "falhou",
        como_melhorar: "Olhar a seção seguinte e não o fundo da praia.",
      }),
    );

    expect(batida).toMatch(/arrow from the board nose/i);
    expect(cutback).toMatch(/arc from the board back/i);
    expect(olhar).toMatch(/arrow from the rider's head/i);
  });
});

describe("paths de coaching e exclusão", () => {
  it(`extrai ${VIDEO_FRAME_COUNT} como teto de fotos da session`, () => {
    expect(VIDEO_FRAME_COUNT).toBe(8);
  });

  it("gera path sob {userId}/{mediaId}/coaching/{analysisId}/", () => {
    const path = buildCoachingImageStoragePath(
      "user-1",
      "media-1",
      "analysis-1",
      "uuid-1",
    );
    expect(path).toBe("user-1/media-1/coaching/analysis-1/uuid-1.png");
  });

  it("coleta paths de coaching no result_json para exclusão de conta", () => {
    const paths = collectCoachingImagePathsFromResult({
      fases: [
        { coaching_image_path: "user-1/media-1/coaching/a1/x.png" },
        { coaching_image_path: "../secret.png" },
        { coaching_image_path: "" },
        { nome: "Drop" },
      ],
    });

    expect(paths).toEqual(["user-1/media-1/coaching/a1/x.png"]);
  });

  it("expõe buffer PNG mínimo usado na validação de saída", () => {
    expect(MINIMAL_PNG[0]).toBe(0x89);
    expect(MINIMAL_PNG.length).toBeGreaterThan(20);
  });
});

describe("validação da foto anotada", () => {
  it("aceita PNG pequeno válido", async () => {
    const result = await validateCoachingImageBytes(MINIMAL_PNG);
    expect(result.mimeType).toBe("image/png");
  });

  it("rejeita buffer vazio ou tipo inválido", async () => {
    await expect(validateCoachingImageBytes(Buffer.alloc(0))).rejects.toThrow(
      /inválida|grande/i,
    );
    await expect(
      validateCoachingImageBytes(Buffer.from("not-an-image")),
    ).rejects.toThrow(/tipo não suportado/i);
  });
});

describe("prompts por tipo de mídia", () => {
  it("prompt de vídeo pede fases, cadência de drop e não elogiar falha", () => {
    const prompt = buildPerformanceSystemPrompt("video");
    expect(prompt).toContain("leitura_da_secao");
    expect(prompt).toContain("fases");
    expect(prompt).toContain("mais agressivo");
    expect(prompt).toMatch(/NÃO elogie execução/i);
    expect(prompt).toContain("Abortar a 2ª manobra");
  });

  it("prompt de foto e link não pedem timeline da onda", () => {
    expect(buildPerformanceSystemPrompt("image")).not.toContain("leitura_da_secao");
    expect(buildPerformanceSystemPrompt("link")).not.toContain("leitura_da_secao");
  });
});
