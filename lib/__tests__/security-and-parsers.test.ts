import { describe, expect, it } from "vitest";
import { validateExternalVideoUrl } from "@/lib/security/url-validator";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";

describe("validateExternalVideoUrl", () => {
  it("aceita YouTube HTTPS", () => {
    const result = validateExternalVideoUrl(
      "https://www.youtube.com/watch?v=abc123",
    );
    expect(result.valid).toBe(true);
  });

  it("rejeita HTTP", () => {
    const result = validateExternalVideoUrl(
      "http://www.youtube.com/watch?v=abc",
    );
    expect(result.valid).toBe(false);
  });

  it("rejeita domínio não permitido", () => {
    const result = validateExternalVideoUrl("https://evil.com/video");
    expect(result.valid).toBe(false);
  });

  it("rejeita localhost (SSRF)", () => {
    const result = validateExternalVideoUrl("https://localhost/video");
    expect(result.valid).toBe(false);
  });
});

describe("parsePerformanceResult", () => {
  it("valida JSON de performance", () => {
    const raw = JSON.stringify({
      resumo: "Boa session com linha consistente na parede.",
      pontos_fortes: ["Postura baixa", "Leitura da onda"],
      melhorias: ["Fechamento de manobra"],
      prioridades_treino: ["Cutback", "Transição de trilho", "Paddle power"],
      score: 72,
    });
    const parsed = parsePerformanceResult(raw);
    expect(parsed.prioridades_treino).toHaveLength(3);
    expect(parsed.score).toBe(72);
  });
});
