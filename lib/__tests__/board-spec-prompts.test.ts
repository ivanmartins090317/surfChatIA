import { describe, expect, it } from "vitest";
import {
  buildBoardMatchSystemPrompt,
  buildBoardMatchUserPrompt,
  buildBoardSpecSystemPrompt,
} from "@/lib/ai/board-spec-prompt";

describe("buildBoardMatchSystemPrompt", () => {
  it("instrui análise visual das fotos candidatas", () => {
    const prompt = buildBoardMatchSystemPrompt();
    expect(prompt).toContain("fotos anexadas");
    expect(prompt).toContain("veredito");
    expect(prompt).toContain("match");
  });
});

describe("buildBoardMatchUserPrompt", () => {
  it("referencia fotos anexadas e medidas anunciadas", () => {
    const prompt = buildBoardMatchUserPrompt({
      profile: null,
      magicBoard: null,
      photoCount: 3,
      advertisedMeasurements: { length_in: 5.7, width_in: 19.25, volume_l: 28 },
    });

    expect(prompt).toContain("Fotos anexadas: 3");
    expect(prompt).toContain("5.7");
    expect(prompt).toContain("Sem prancha mágica cadastrada");
  });
});

describe("buildBoardSpecSystemPrompt", () => {
  it("exige JSON com spec e ai_summary", () => {
    const prompt = buildBoardSpecSystemPrompt();
    expect(prompt).toContain("ai_summary");
    expect(prompt).toContain("shape");
  });
});
