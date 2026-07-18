import { describe, expect, it } from "vitest";
import { validateMediaFile } from "@/lib/media/upload-limits";
import { validateExternalVideoUrl } from "@/lib/security/url-validator";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";

describe("validateMediaFile", () => {
  it("aceita imagem JPEG dentro do limite", () => {
    const file = new File(["x"], "session.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 });
    expect(validateMediaFile(file, "image").valid).toBe(true);
  });

  it("rejeita imagem acima de 10 MB", () => {
    const file = new File(["x"], "grande.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
    const result = validateMediaFile(file, "image");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10 MB");
  });

  it("rejeita formato de imagem não suportado", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    Object.defineProperty(file, "size", { value: 1024 });
    expect(validateMediaFile(file, "image").valid).toBe(false);
  });
});

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
  it("valida JSON com critérios de score e melhorias detalhadas", () => {
    const raw = JSON.stringify({
      criterios_score: [
        { nome: "Entrada / take-off", nota: 14, comentario: "Entrada limpa com timing adequado na espuma." },
        { nome: "Postura e centro de gravidade", nota: 12, comentario: "Joelhos flexionados, tronco levemente aberto." },
        { nome: "Linha na parede", nota: 16, comentario: "Boa projeção paralela à parede no trim." },
        { nome: "Manobras e técnica", nota: 11, comentario: "Cutback iniciado cedo, saída sem fechamento." },
        { nome: "Consistência e leitura", nota: 13, comentario: "Leitura da seção correta, ritmo estável." },
      ],
      score: 99,
      resumo: "Session sólida em beach break com foco em manobras e boa leitura da parede.",
      pontos_fortes: ["Linha alta na parede", "Entrada com timing"],
      melhorias_detalhadas: [
        {
          titulo: "Fechamento do cutback",
          observacao: "O corpo abre na saída da manobra e o olhar antecipa demais a praia.",
          impacto: "Perde velocidade e espaço para a próxima manobra.",
          dica_pratica: "Na próxima sessão, foque em manter ombros fechados até completar o carve.",
        },
        {
          titulo: "Distribuição de peso",
          observacao: "O peso fica concentrado no pé traseiro durante o trim.",
          impacto: "Reduz resposta rápida para transições.",
          dica_pratica: "Pratique trim alternando 60/40 entre frente e trás a cada 3 segundos.",
        },
        {
          titulo: "Braço dianteiro",
          observacao: "Braço dianteiro baixo limita rotação do tronco na reentrada.",
          impacto: "Manobra perde amplitude e controle na boca da onda.",
          dica_pratica: "Use o braço dianteiro como guia apontando para a parede na entrada do cutback.",
        },
      ],
      prioridades_treino: ["Cutback", "Transição de trilho", "Paddle power"],
    });

    const parsed = parsePerformanceResult(raw);
    expect(parsed.score).toBe(66);
    expect(parsed.criterios_score).toHaveLength(5);
    expect(parsed.melhorias_detalhadas).toHaveLength(3);
    expect(parsed.melhorias).toEqual([
      "Fechamento do cutback",
      "Distribuição de peso",
      "Braço dianteiro",
    ]);
  });

  it("aceita formato legado com melhorias simples", () => {
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

  it("aceita campos opcionais de análise visual", () => {
    const raw = JSON.stringify({
      manobra_observada: "Cutback com compressão na boca da onda",
      confianca_manobra: "alta",
      detalhes_frame: "Joelhos flexionados, olhar na parede, braço dianteiro estendido.",
      criterios_score: [
        { nome: "Entrada / take-off", nota: 10, comentario: "Não visível neste frame." },
        { nome: "Postura e centro de gravidade", nota: 15, comentario: "Centro baixo e estável." },
        { nome: "Linha na parede", nota: 14, comentario: "Boa linha paralela." },
        { nome: "Manobras e técnica", nota: 16, comentario: "Compressão forte no cutback." },
        { nome: "Consistência e leitura", nota: 13, comentario: "Olhar fixo na parede." },
      ],
      resumo: "Boa compressão no cutback com espaço para fechar o corpo na saída.",
      pontos_fortes: ["Compressão", "Olhar na parede"],
      melhorias_detalhadas: [
        {
          titulo: "Saída do cutback",
          observacao: "Ombros abrem antes de completar o carve observado no frame.",
          impacto: "Perde velocidade na saída da manobra.",
          dica_pratica: "Mantenha o olhar na parede até o fim do carve.",
        },
        {
          titulo: "Braço traseiro",
          observacao: "Braço traseiro alto desbalanceia o corpo na compressão.",
          impacto: "Reduz controle na transição seguinte.",
          dica_pratica: "Mantenha o cotovelo traseiro mais baixo durante a manobra.",
        },
        {
          titulo: "Pé dianteiro",
          observacao: "Pouco peso no pé dianteiro na fase final do cutback.",
          impacto: "Limita fechamento da manobra.",
          dica_pratica: "Pressione o pé dianteiro ao iniciar a saída do cutback.",
        },
      ],
      prioridades_treino: ["Cutback", "Transição de trilho", "Paddle power"],
      score: 68,
    });
    const parsed = parsePerformanceResult(raw);
    expect(parsed.manobra_observada).toContain("Cutback");
    expect(parsed.confianca_manobra).toBe("alta");
    expect(parsed.score).toBe(68);
  });

  it("rejeita confianca_manobra fora do enum permitido", () => {
    const raw = JSON.stringify({
      manobra_observada: "Cutback",
      confianca_manobra: "certeza_absoluta",
      resumo: "Boa compressão no cutback com espaço para fechar o corpo na saída.",
      pontos_fortes: ["Compressão", "Olhar na parede"],
      melhorias_detalhadas: [
        {
          titulo: "Saída do cutback",
          observacao: "Ombros abrem antes de completar o carve observado no frame.",
          impacto: "Perde velocidade na saída da manobra.",
          dica_pratica: "Mantenha o olhar na parede até o fim do carve.",
        },
        {
          titulo: "Braço traseiro",
          observacao: "Braço traseiro alto desbalanceia o corpo na compressão.",
          impacto: "Reduz controle na transição seguinte.",
          dica_pratica: "Mantenha o cotovelo traseiro mais baixo durante a manobra.",
        },
        {
          titulo: "Pé dianteiro",
          observacao: "Pouco peso no pé dianteiro na fase final do cutback.",
          impacto: "Limita fechamento da manobra.",
          dica_pratica: "Pressione o pé dianteiro ao iniciar a saída do cutback.",
        },
      ],
      prioridades_treino: ["Cutback", "Transição de trilho", "Paddle power"],
    });

    expect(() => parsePerformanceResult(raw)).toThrow();
  });
});
