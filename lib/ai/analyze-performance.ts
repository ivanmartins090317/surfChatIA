import type { AiImageInput } from "@/lib/ai/client";
import {
  chatJsonCompletion,
  chatJsonCompletionWithVision,
} from "@/lib/ai/client";
import {
  buildPerformanceSystemPrompt,
  buildPerformanceUserPrompt,
} from "@/lib/ai/performance-prompt";
import type { MediaItem, Profile } from "@/lib/domain/types";

function describeMedia(media: MediaItem): string {
  if (media.type === "link" && media.external_url) {
    return `Link externo: ${media.external_url}`;
  }
  if (media.type === "image" && media.storage_path) {
    return "Foto da session enviada pelo surfista (frame único para análise visual).";
  }
  if (media.type === "video" && media.storage_path) {
    return "Vídeo da session — frames extraídos em diferentes momentos para análise visual.";
  }
  if (media.storage_path) {
    return `Arquivo de ${media.type} enviado pelo surfista.`;
  }
  return "Mídia sem detalhes adicionais.";
}

export async function runPerformanceAnalysis(input: {
  media: MediaItem;
  profile: Profile | null;
  images?: AiImageInput[];
  videoFrameTimestamps?: string[];
}): Promise<string> {
  const userPrompt = buildPerformanceUserPrompt({
    profile: input.profile,
    waveType: input.media.wave_type,
    focus: input.media.focus,
    mediaType: input.media.type,
    mediaDescription: describeMedia(input.media),
    videoFrameTimestamps: input.videoFrameTimestamps,
  });

  const systemPrompt = buildPerformanceSystemPrompt(input.media.type);

  if (input.media.type === "image" || input.media.type === "video") {
    if (!input.images?.length) {
      throw new Error(
        input.media.type === "image"
          ? "Não foi possível carregar a imagem para análise visual."
          : "Não foi possível extrair frames do vídeo para análise visual.",
      );
    }
    return chatJsonCompletionWithVision(systemPrompt, userPrompt, input.images);
  }

  return chatJsonCompletion(systemPrompt, userPrompt);
}
