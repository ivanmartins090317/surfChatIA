import { describe, expect, it } from "vitest";
import {
  boardMeasurementsToInitialValues,
  cmToInches,
  formatSurfLength,
  formatThickness,
  parseFractionInches,
  parseLengthFromFeetInches,
  parseLinearInches,
  parseMetricToInches,
  parseSurfWholeFractionInches,
  parseVolumeLiters,
} from "@/lib/board/measurements";

describe("parseLengthFromFeetInches", () => {
  it("converte 5'7\" para 67 polegadas", () => {
    expect(parseLengthFromFeetInches("5", "7")).toBe(67);
  });

  it("retorna null quando vazio", () => {
    expect(parseLengthFromFeetInches("", "")).toBeNull();
  });
});

describe("parseLinearInches", () => {
  it("aceita largura em polegadas", () => {
    expect(parseLinearInches("19")).toBe(19);
    expect(parseLinearInches('19"')).toBe(19);
  });
});

describe("parseSurfWholeFractionInches", () => {
  it("aceita largura 19 1/2", () => {
    expect(parseSurfWholeFractionInches("19", 0.5)).toBe(19.5);
  });
});

describe("parseFractionInches", () => {
  it("aceita espessura 2 1/2", () => {
    expect(parseFractionInches("2 1/2")).toBe(2.5);
    expect(parseFractionInches("2-1/2")).toBe(2.5);
  });

  it("aceita decimal", () => {
    expect(parseFractionInches("2.5")).toBe(2.5);
  });
});

describe("parseVolumeLiters", () => {
  it("aceita volume 28L", () => {
    expect(parseVolumeLiters("28")).toBe(28);
    expect(parseVolumeLiters("28L")).toBe(28);
    expect(parseVolumeLiters("28 l")).toBe(28);
  });

  it("aceita litragem decimal com vírgula ou ponto", () => {
    expect(parseVolumeLiters("28,2")).toBe(28.2);
    expect(parseVolumeLiters("28.2")).toBe(28.2);
    expect(parseVolumeLiters("25,75")).toBe(25.75);
    expect(parseVolumeLiters("25,75L")).toBe(25.75);
  });
});

describe("parseMetricToInches", () => {
  it("converte centímetros para polegadas", () => {
    expect(parseMetricToInches("170", "cm")).toBe(cmToInches(170));
  });
});

describe("formatSurfLength", () => {
  it("formata 67\" como 5'7\"", () => {
    expect(formatSurfLength(67)).toBe(`5'7"`);
  });
});

describe("formatThickness", () => {
  it("formata 2.5\" como 2 1/2\"", () => {
    expect(formatThickness(2.5)).toBe('2 1/2"');
  });
});

describe("boardMeasurementsToInitialValues", () => {
  it("preenche formulário a partir de medidas salvas", () => {
    const values = boardMeasurementsToInitialValues({
      length_in: 67,
      width_in: 19.5,
      thickness_in: 2.5,
      volume_l: 28.2,
    });

    expect(values.lengthFeet).toBe("5");
    expect(values.lengthInchesPart).toBe("7");
    expect(values.widthWhole).toBe("19");
    expect(values.widthFraction).toBe("0.5");
    expect(values.thicknessWhole).toBe("2");
    expect(values.thicknessFraction).toBe("0.5");
    expect(values.volumeValue).toBe("28,2");
  });
});

describe("exemplo completo 5'7 19 2 1/2 28L", () => {
  it("normaliza medidas para o banco", () => {
    const length = parseLengthFromFeetInches("5", "7");
    const width = parseLinearInches("19");
    const thickness = parseFractionInches("2 1/2");
    const volume = parseVolumeLiters("28L");

    expect(length).toBe(67);
    expect(width).toBe(19);
    expect(thickness).toBe(2.5);
    expect(volume).toBe(28);
  });
});
