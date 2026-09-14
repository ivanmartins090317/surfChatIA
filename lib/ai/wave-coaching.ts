import type {
  CoachingVisualStatus,
  PerformanceResult,
  WavePhase,
  WavePhaseQuality,
} from "@/lib/domain/types";

export const MAX_WAVE_COACHING_IMAGES = 3;

/** Homologação 14/09: o traço na foto não ficou coerente — desliga só o passo visual. */
export const WAVE_COACHING_VISUAL_ENABLED = false;

export const COACHING_PREPARING_COPY = "Preparando o visual do ajuste";
export const COACHING_ANNOTATED_CAPTION = "Ajuste sugerido neste instante";

const PHASES_THAT_NEED_COACHING: ReadonlySet<WavePhaseQuality> = new Set([
  "regular",
  "falhou",
]);

const MANEUVER_PHASE_NAMES = new Set([
  "Cutback",
  "Batida / Off the lip",
  "snap",
  "Rasgada",
  "Floater",
  "Aéreo",
  "Aéreo 360",
  "Tubo / Barrel",
]);

export function normalizeWavePhases(
  fases: WavePhase[],
  timestamps: string[],
): WavePhase[] {
  if (timestamps.length === 0) return [];

  return fases
    .filter(
      (fase) =>
        Number.isInteger(fase.frame_index) &&
        fase.frame_index >= 0 &&
        fase.frame_index < timestamps.length,
    )
    .map((fase) => ({
      ...fase,
      timestamp: timestamps[fase.frame_index] ?? fase.timestamp,
      coaching_image_path: undefined,
    }));
}

export function selectCoachingPhases(fases: WavePhase[]): WavePhase[] {
  const selected: WavePhase[] = [];
  const usedFrames = new Set<number>();

  for (const fase of fases) {
    if (selected.length >= MAX_WAVE_COACHING_IMAGES) break;
    if (!PHASES_THAT_NEED_COACHING.has(fase.qualidade_execucao)) continue;
    if (usedFrames.has(fase.frame_index)) continue;
    usedFrames.add(fase.frame_index);
    selected.push(fase);
  }

  return selected;
}

export function deriveLegacyManeuverName(fases: WavePhase[]): string | undefined {
  const maneuver = fases.find((fase) => MANEUVER_PHASE_NAMES.has(fase.nome));
  return maneuver?.nome ?? fases[0]?.nome;
}

export function resolveCoachingVisualStatus(
  fases: WavePhase[],
): CoachingVisualStatus | undefined {
  if (fases.length === 0) return undefined;
  if (!WAVE_COACHING_VISUAL_ENABLED) return "skipped";
  return selectCoachingPhases(fases).length > 0 ? "pending" : "skipped";
}

export function isCoachingVisualInFlight(
  status: CoachingVisualStatus | undefined,
): boolean {
  if (!WAVE_COACHING_VISUAL_ENABLED) return false;
  return status === "pending" || status === "processing";
}

export function needsCoachingVisual(result: {
  coaching_visual_status?: CoachingVisualStatus;
}): boolean {
  return (
    WAVE_COACHING_VISUAL_ENABLED &&
    result.coaching_visual_status === "pending"
  );
}

export function finalizeVideoPerformanceResult<
  T extends {
    fases?: WavePhase[];
    leitura_da_secao?: PerformanceResult["leitura_da_secao"];
    manobra_observada?: string;
    coaching_visual_status?: CoachingVisualStatus;
  },
>(parsed: T, timestamps: string[]): T & {
  fases?: WavePhase[];
  coaching_visual_status?: CoachingVisualStatus;
} {
  const fases = normalizeWavePhases(parsed.fases ?? [], timestamps);
  const manobra =
    parsed.manobra_observada ?? deriveLegacyManeuverName(fases);

  return {
    ...parsed,
    fases: fases.length > 0 ? fases : undefined,
    leitura_da_secao: parsed.leitura_da_secao,
    manobra_observada: manobra,
    coaching_visual_status: resolveCoachingVisualStatus(fases),
  };
}

export function toPersistedPerformanceResult(
  mediaType: "video" | "image" | "link",
  parsed: PerformanceResult,
  videoFrameTimestamps: string[] | undefined,
): PerformanceResult {
  if (mediaType !== "video") {
    return {
      ...parsed,
      fases: undefined,
      leitura_da_secao: undefined,
      coaching_visual_status: undefined,
    };
  }

  return finalizeVideoPerformanceResult(parsed, videoFrameTimestamps ?? []);
}

const OVERLAY_ORANGE =
  "thick smooth orange stroke (high contrast, clean vector-like, not sketchy)";

interface OverlayRecipe {
  test: (nome: string) => boolean;
  mark: string;
}

const PHASE_OVERLAY_RECIPES: readonly OverlayRecipe[] = [
  {
    test: (nome) => /bottom\s*turn/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} arc on the water: the complete bottom-turn path, starting at the board and ending where the nose would climb the face again.`,
  },
  {
    test: (nome) => /cutback/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} arc from the board back toward the whitewater, showing the cutback path.`,
  },
  {
    test: (nome) => /batida|off the lip|snap|rasgada/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} arrow from the board nose up the face, pointing at the lip the rider should hit.`,
  },
  {
    test: (nome) => /floater/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} line along the crumbling lip, showing the floater trajectory.`,
  },
  {
    test: (nome) => /drop/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} arrow along the drop line the board should take down the face.`,
  },
  {
    test: (nome) => /linha da onda|trim/i.test(nome),
    mark: `ONE ${OVERLAY_ORANGE} arrow along the open face, showing the speed line to hold.`,
  },
];

function overlayMarkForPhase(phase: WavePhase): string {
  const recipe = PHASE_OVERLAY_RECIPES.find((item) => item.test(phase.nome));
  if (recipe) return recipe.mark;

  const tip = phase.como_melhorar.toLowerCase();
  if (/olhar|cabeça|visão/.test(tip)) {
    return `ONE ${OVERLAY_ORANGE} arrow from the rider's head toward the next section they should look at.`;
  }
  if (/bico|nariz|12h|nose/.test(tip)) {
    return `ONE ${OVERLAY_ORANGE} arrow along the board showing where the nose should point.`;
  }
  if (/arco|amplitude|rail|trilho/.test(tip)) {
    return `ONE ${OVERLAY_ORANGE} arc on the water showing the turn path to complete.`;
  }

  return `ONE ${OVERLAY_ORANGE} arrow on the surfer or board showing the single most important direction for this moment.`;
}

/**
 * Prompt de edição da foto real. Não inclui o texto de coaching:
 * o modelo de imagem pinta legendas como caracteres ilegíveis.
 */
export function buildCoachingEditPrompt(phase: WavePhase): string {
  const mark = overlayMarkForPhase(phase);

  return [
    "Edit THIS exact surf photo. Keep the same surfer, board, wave, camera angle, lighting and body pose.",
    "Do not generate a different person, a different wave, or a photorealistic 'ideal body'.",
    "GRAPHICS ONLY. The written coaching tip is in the app UI, never on the photo.",
    `Phase to illustrate: ${phase.nome}.`,
    `Draw exactly ONE mark and nothing else: ${mark}`,
    "Place that single mark on the real surfista, board or wave in this photo. Align it with the body and the board.",
    "FORBIDDEN: any text, letters, numbers, words, captions, titles, watermarks, logos, speech balloons, legends, UI chrome, triangles, boxes, scribbles, extra arrows, extra curves, or a second color.",
    "Do not write on the photo. Do not paint a caption. Do not doodle. One mark only.",
  ].join(" ");
}
