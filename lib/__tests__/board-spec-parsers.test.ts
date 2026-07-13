import { describe, expect, it } from "vitest";
import {
  parseBoardMatchResult,
  parseBoardSpecResult,
} from "@/lib/ai/board-spec-parser";

describe("parseBoardSpecResult", () => {
  it("valida ficha técnica completa com resumo IA", () => {
    const raw = JSON.stringify({
      spec: {
        shape: "Híbrido com outline equilibrado",
        rails: "Rails médias com transição suave",
        bottom: "Single concave leve no meio",
        tail: "Squash tail com cantos arredondados",
        rocker: "Rocker moderado com entrada suave",
      },
      ai_summary:
        "Combina com surfista intermediário em beach break por volume adequado e manobrabilidade.",
    });

    const parsed = parseBoardSpecResult(raw);
    expect(parsed.spec.tail).toContain("Squash");
    expect(parsed.ai_summary.length).toBeGreaterThanOrEqual(20);
  });

  it("rejeita spec incompleta", () => {
    const raw = JSON.stringify({
      spec: { shape: "Shortboard" },
      ai_summary: "Resumo curto",
    });

    expect(() => parseBoardSpecResult(raw)).toThrow();
  });

  it("rejeita JSON inválido", () => {
    expect(() => parseBoardSpecResult("{ invalid")).toThrow();
  });
});

describe("parseBoardMatchResult", () => {
  it("valida veredito match com prós, contras e condições", () => {
    const raw = JSON.stringify({
      veredito: "match",
      pros: ["Volume compatível com o peso do surfista"],
      contras: ["Tail mais estreita que a prancha mágica"],
      condicoes_ideais: ["Ondas de 0,8 a 1,5 m com parede definida"],
      distancia_da_magica: "Muito próxima da prancha de referência",
    });

    const parsed = parseBoardMatchResult(raw);
    expect(parsed.veredito).toBe("match");
    expect(parsed.pros).toHaveLength(1);
    expect(parsed.distancia_da_magica).toContain("próxima");
  });

  it("aceita veredito partial e no_match", () => {
    const partial = parseBoardMatchResult(
      JSON.stringify({
        veredito: "partial",
        pros: ["Boa flutuação"],
        contras: ["Volume abaixo do ideal"],
        condicoes_ideais: ["Dias de swell pequeno"],
      }),
    );
    expect(partial.veredito).toBe("partial");

    const noMatch = parseBoardMatchResult(
      JSON.stringify({
        veredito: "no_match",
        pros: ["Construção aparentemente sólida"],
        contras: ["Comprimento inadequado para o nível"],
        condicoes_ideais: ["Não recomendada para o perfil atual"],
      }),
    );
    expect(noMatch.veredito).toBe("no_match");
  });

  it("rejeita veredito inválido", () => {
    const raw = JSON.stringify({
      veredito: "maybe",
      pros: ["Ok"],
      contras: ["Ruim"],
      condicoes_ideais: ["Beach break"],
    });

    expect(() => parseBoardMatchResult(raw)).toThrow();
  });

  it("rejeita arrays vazios", () => {
    const raw = JSON.stringify({
      veredito: "match",
      pros: [],
      contras: ["Volume alto"],
      condicoes_ideais: ["Ondas médias"],
    });

    expect(() => parseBoardMatchResult(raw)).toThrow();
  });
});
