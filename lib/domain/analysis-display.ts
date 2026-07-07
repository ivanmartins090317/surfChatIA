import type { Analysis, MediaItem, MediaType, PerformanceResult } from "@/lib/domain/types";
import { ANALYSIS_FOCUS, MEDIA_TYPES, WAVE_TYPES } from "@/lib/domain/types";

export interface PerformanceAnalysisListItem {
  analysis: Analysis;
  media: MediaItem | null;
  previewUrl: string | null;
}

function truncate(text: string, max = 48): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link externo";
  }
}

export function getAnalysisMediaLabel(media: MediaItem | null): string {
  if (!media) return "Performance";
  return MEDIA_TYPES[media.type];
}

export function getAnalysisListTitle(
  media: MediaItem | null,
  result: PerformanceResult | null,
): string {
  if (!media) return "Análise de performance";

  if (media.type === "link" && media.external_url) {
    return `Link · ${extractHost(media.external_url)}`;
  }

  if (media.type === "image" && result?.manobra_observada) {
    return `Imagem · ${truncate(result.manobra_observada, 42)}`;
  }

  if (media.type === "image") {
    return "Imagem · foto da session";
  }

  if (media.type === "video") {
    return "Vídeo · session";
  }

  return `Performance · ${MEDIA_TYPES[media.type]}`;
}

export function getAnalysisListSubtitle(media: MediaItem | null): string | null {
  if (!media) return null;

  const parts: string[] = [];
  if (media.wave_type) parts.push(WAVE_TYPES[media.wave_type]);
  if (media.focus) parts.push(ANALYSIS_FOCUS[media.focus]);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getMediaTypeIconName(type: MediaType): "link" | "image" | "video" {
  return type;
}
