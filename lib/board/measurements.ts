export const INCHES_PER_FOOT = 12;
export const CM_PER_INCH = 2.54;
export const MM_PER_INCH = 25.4;

export const COMMON_BOARD_VOLUMES_L = [
  24, 26, 28, 30, 32, 34, 36, 38, 40, 42,
] as const;

export const THICKNESS_FRACTIONS = [
  { label: "—", value: 0 },
  { label: "1/16", value: 1 / 16 },
  { label: "1/8", value: 1 / 8 },
  { label: "3/16", value: 3 / 16 },
  { label: "1/4", value: 1 / 4 },
  { label: "3/8", value: 3 / 8 },
  { label: "1/2", value: 1 / 2 },
  { label: "5/8", value: 5 / 8 },
  { label: "3/4", value: 3 / 4 },
  { label: "7/8", value: 7 / 8 },
] as const;

export const LINEAR_UNIT_MODES = {
  surf: { label: "Padrão surf", short: "ft/in · in" },
  cm: { label: "Centímetros", short: "cm" },
  mm: { label: "Milímetros", short: "mm" },
} as const;

export type LinearUnitMode = keyof typeof LINEAR_UNIT_MODES;

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function parseNumericInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function parseFractionInches(raw: string): number | null {
  const input = raw.trim().replace(/"/g, "").replace(/\s+/g, " ");
  if (!input) return null;

  for (const [symbol, value] of Object.entries(UNICODE_FRACTIONS)) {
    if (input.includes(symbol)) {
      const wholeMatch = input.match(/^(\d+)\s*/);
      const whole = wholeMatch ? Number(wholeMatch[1]) : 0;
      return roundTo(whole + value, 3);
    }
  }

  const mixedMatch = input.match(/^(\d+)\s*[-\s](\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    if (denominator === 0) return null;
    return roundTo(whole + numerator / denominator, 3);
  }

  const fractionMatch = input.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (denominator === 0) return null;
    return roundTo(numerator / denominator, 3);
  }

  const decimal = parseNumericInput(input.replace(/in(g)?/gi, ""));
  if (decimal == null || decimal <= 0) return null;
  return roundTo(decimal, 3);
}

export function parseLengthFromFeetInches(
  feetRaw: string,
  inchesRaw: string,
): number | null {
  const hasFeet = feetRaw.trim() !== "";
  const hasInches = inchesRaw.trim() !== "";
  if (!hasFeet && !hasInches) return null;

  const feet = hasFeet ? Number(feetRaw) : 0;
  const inches = hasInches ? parseNumericInput(inchesRaw) : 0;
  if (!Number.isFinite(feet) || inches == null) return null;
  if (feet < 0 || inches < 0) return null;

  const total = feet * INCHES_PER_FOOT + inches;
  if (total <= 0) return null;
  return roundTo(total, 2);
}

export function parseSurfWholeFractionInches(
  wholeRaw: string,
  fractionValue: number,
): number | null {
  const whole = wholeRaw.trim() === "" ? 0 : Number(wholeRaw);
  if (!Number.isFinite(whole) || whole < 0) return null;
  if (whole === 0 && fractionValue === 0 && wholeRaw.trim() === "") {
    return null;
  }

  const total = whole + fractionValue;
  return total > 0 ? roundTo(total, 3) : null;
}

export function parseLinearInches(raw: string): number | null {
  const cleaned = raw.trim().replace(/"/g, "").replace(/in(g)?/gi, "").trim();
  if (!cleaned) return null;

  const fraction = parseFractionInches(cleaned);
  if (fraction != null) return fraction;

  const decimal = parseNumericInput(cleaned);
  if (decimal == null || decimal <= 0) return null;
  return roundTo(decimal, 3);
}

export function parseVolumeLiters(raw: string): number | null {
  const cleaned = raw.trim().replace(/l(itros?)?/gi, "").trim();
  if (!cleaned) return null;

  const value = parseNumericInput(cleaned);
  if (value == null || value <= 0) return null;
  return roundTo(value, 2);
}

export function formatVolumeLiters(liters: number): string {
  return `${liters.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} L`;
}

export function inchesToCm(inches: number): number {
  return roundTo(inches * CM_PER_INCH, 1);
}

export function inchesToMm(inches: number): number {
  return roundTo(inches * MM_PER_INCH, 0);
}

export function cmToInches(cm: number): number {
  return roundTo(cm / CM_PER_INCH, 2);
}

export function mmToInches(mm: number): number {
  return roundTo(mm / MM_PER_INCH, 2);
}

export function parseMetricToInches(
  raw: string,
  mode: Exclude<LinearUnitMode, "surf">,
): number | null {
  const value = parseNumericInput(raw);
  if (value == null || value <= 0) return null;
  return mode === "cm" ? cmToInches(value) : mmToInches(value);
}

export function splitFeetInches(totalInches: number): {
  feet: number;
  inches: number;
} {
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = roundTo(totalInches - feet * INCHES_PER_FOOT, 2);
  return { feet, inches };
}

export function formatSurfLength(totalInches: number): string {
  const { feet, inches } = splitFeetInches(totalInches);
  const inchLabel =
    Number.isInteger(inches) ? String(inches) : inches.toFixed(2).replace(/\.?0+$/, "");
  return `${feet}'${inchLabel}"`;
}

export function formatThickness(totalInches: number): string {
  const whole = Math.floor(totalInches);
  const fraction = roundTo(totalInches - whole, 3);

  const match = THICKNESS_FRACTIONS.find(
    (item) => item.value > 0 && Math.abs(item.value - fraction) < 0.001,
  );

  if (match) {
    return whole > 0 ? `${whole} ${match.label}"` : `${match.label}"`;
  }

  return `${roundTo(totalInches, 2)}"`;
}

export function formatFractionalInches(totalInches: number): string {
  return formatThickness(totalInches);
}

export function formatConversionHint(
  inches: number,
  mode: LinearUnitMode,
): string {
  if (mode === "surf") {
    return `≈ ${inchesToCm(inches)} cm · ${inchesToMm(inches)} mm`;
  }
  if (mode === "cm") {
    return `≈ ${formatSurfLength(inches)} · ${inchesToMm(inches)} mm`;
  }
  return `≈ ${formatSurfLength(inches)} · ${inchesToCm(inches)} cm`;
}

export interface BoardMeasurementInitialValues {
  lengthFeet: string;
  lengthInchesPart: string;
  widthWhole: string;
  widthFraction: string;
  thicknessWhole: string;
  thicknessFraction: string;
  volumeValue: string;
}

export function splitWholeAndFraction(totalInches: number): {
  whole: string;
  fraction: string;
} {
  const whole = Math.floor(totalInches);
  const fractionPart = roundTo(totalInches - whole, 3);
  const match = THICKNESS_FRACTIONS.find(
    (item) => item.value > 0 && Math.abs(item.value - fractionPart) < 0.001,
  );

  return {
    whole: String(whole),
    fraction: String(match?.value ?? fractionPart),
  };
}

export function boardMeasurementsToInitialValues(board: {
  length_in: number | null;
  width_in: number | null;
  thickness_in: number | null;
  volume_l: number | null;
}): BoardMeasurementInitialValues {
  const length =
    board.length_in != null ? splitFeetInches(board.length_in) : null;
  const width =
    board.width_in != null ? splitWholeAndFraction(board.width_in) : null;
  const thickness =
    board.thickness_in != null
      ? splitWholeAndFraction(board.thickness_in)
      : null;

  return {
    lengthFeet: length ? String(length.feet) : "",
    lengthInchesPart: length
      ? String(length.inches).replace(/\.?0+$/, "")
      : "",
    widthWhole: width?.whole ?? "",
    widthFraction: width?.fraction ?? "0",
    thicknessWhole: thickness?.whole ?? "",
    thicknessFraction: thickness?.fraction ?? "0",
    volumeValue:
      board.volume_l != null
        ? board.volume_l.toLocaleString("pt-BR", {
            maximumFractionDigits: 2,
          })
        : "",
  };
}

export function formatBoardMeasurementsSummary(board: {
  length_in: number | null;
  width_in: number | null;
  thickness_in: number | null;
  volume_l: number | null;
}): string[] {
  return [
    board.length_in != null ? formatSurfLength(board.length_in) : null,
    board.width_in != null
      ? `${formatFractionalInches(board.width_in)} largura`
      : null,
    board.thickness_in != null ? formatFractionalInches(board.thickness_in) : null,
    board.volume_l != null ? formatVolumeLiters(board.volume_l) : null,
  ].filter((part): part is string => part != null);
}
