import { chatJsonCompletion } from "@/lib/ai/client";
import {
  buildPerformanceSystemPrompt,
  buildPerformanceUserPrompt,
} from "@/lib/ai/performance-prompt";
import { parsePerformanceResult } from "@/lib/ai/performance-parser";
import type { Analysis, PerformanceResult } from "@/lib/domain/types";
import { rateLimitAiAction } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getMediaItem } from "@/services/media-service";
import { getProfile } from "@/services/profile-service";

function describeMedia(input: {
  type: string;
  storage_path: string | null;
  external_url: string | null;
}): string {
  if (input.type === "link" && input.external_url) {
    return `Link externo de vídeo: ${input.external_url}. Analise com base no contexto típico de sessão de surf neste tipo de mídia.`;
  }
  if (input.storage_path) {
    return `Arquivo enviado (${input.type}) no caminho ${input.storage_path}. Considere postura, linha e manobras típicas de session filmada em ${input.type === "video" ? "vídeo" : "imagem"}.`;
  }
  return "Mídia sem detalhes adicionais.";
}

export async function createPerformanceAnalysis(
  userId: string,
  mediaItemId: string,
): Promise<Analysis> {
  const rate = rateLimitAiAction(userId);
  if (!rate.allowed) {
    throw new Error("Limite diário de análises atingido. Tente amanhã.");
  }

  const media = await getMediaItem(userId, mediaItemId);
  if (!media) {
    throw new Error("Mídia não encontrada.");
  }

  const supabase = await createClient();
  const { data: analysisRow, error: insertError } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      media_item_id: mediaItemId,
      type: "performance",
      status: "processing",
    })
    .select("*")
    .single();

  if (insertError || !analysisRow) {
    throw new Error("Não foi possível iniciar a análise.");
  }

  await supabase
    .from("media_items")
    .update({ status: "processing" })
    .eq("id", mediaItemId)
    .eq("user_id", userId);

  try {
    const profile = await getProfile(userId);
    const raw = await chatJsonCompletion(
      buildPerformanceSystemPrompt(),
      buildPerformanceUserPrompt({
        profile,
        waveType: media.wave_type,
        focus: media.focus,
        mediaDescription: describeMedia(media),
      }),
    );

    const result: PerformanceResult = parsePerformanceResult(raw);

    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({ status: "done", result_json: result })
      .eq("id", analysisRow.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    await supabase
      .from("media_items")
      .update({ status: "ready" })
      .eq("id", mediaItemId)
      .eq("user_id", userId);

    if (updateError || !updated) {
      throw new Error("Falha ao salvar resultado.");
    }

    return updated as Analysis;
  } catch (error) {
    await supabase
      .from("analyses")
      .update({ status: "error" })
      .eq("id", analysisRow.id)
      .eq("user_id", userId);

    await supabase
      .from("media_items")
      .update({ status: "error" })
      .eq("id", mediaItemId)
      .eq("user_id", userId);

    const message =
      error instanceof Error ? error.message : "Erro ao processar análise.";
    throw new Error(message);
  }
}

export async function listPerformanceAnalyses(
  userId: string,
): Promise<Analysis[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "performance")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível listar análises.");
  }

  return (data ?? []) as Analysis[];
}

export async function getPerformanceAnalysis(
  userId: string,
  analysisId: string,
): Promise<Analysis | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .eq("type", "performance")
    .maybeSingle();

  if (error) {
    throw new Error("Análise não encontrada.");
  }

  return data as Analysis | null;
}
