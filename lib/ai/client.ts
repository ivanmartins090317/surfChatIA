import OpenAI from "openai";
import { hasOpenAiKey } from "@/lib/env";
import {
  AI_USAGE_KIND,
  buildAiUsageLogPayload,
  logAiUsage,
  type RawCompletionUsage,
} from "@/lib/ai/usage-log";

const AI_TIMEOUT_MS = process.env.VERCEL ? 55_000 : 90_000;
/**
 * Fase A do plano de especialização (docs/implementation/2026-07-17-plano-especializacao-ia-performance.md):
 * testado gpt-4o para reduzir erro de nomenclatura de manobra, mas revertido para gpt-4o-mini
 * (custo ~17x maior) enquanto valida-se o ganho real de precisão com os outros ajustes de prompt.
 */
const VISION_MODEL = "gpt-4o-mini";
const TEXT_MODEL = "gpt-4o-mini";

export interface AiImageInput {
  base64: string;
  mimeType: string;
}

export function createAiClient(): OpenAI | null {
  if (!hasOpenAiKey()) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: AI_TIMEOUT_MS,
  });
}

export async function chatJsonCompletion(
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  const client = createAiClient();
  if (!client) {
    throw new Error(
      "IA não configurada. Defina OPENAI_API_KEY no servidor.",
    );
  }

  const response = await client.chat.completions.create({
    model: TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.4,
  });

  logAiUsage(
    buildAiUsageLogPayload({
      model: TEXT_MODEL,
      kind: AI_USAGE_KIND.text,
      usage: response.usage,
    }),
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA.");
  }
  return content;
}

export async function chatJsonCompletionWithVision(
  systemPrompt: string,
  userText: string,
  images: AiImageInput[],
): Promise<string> {
  const client = createAiClient();
  if (!client) {
    throw new Error(
      "IA não configurada. Defina OPENAI_API_KEY no servidor.",
    );
  }

  if (images.length === 0) {
    throw new Error("Nenhuma imagem fornecida para análise visual.");
  }

  const imageContent = images.map((image) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:${image.mimeType};base64,${image.base64}`,
      detail: "high" as const,
    },
  }));

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [{ type: "text", text: userText }, ...imageContent],
      },
    ],
    temperature: 0.45,
  });

  logAiUsage(
    buildAiUsageLogPayload({
      model: VISION_MODEL,
      kind: AI_USAGE_KIND.vision,
      imageCount: images.length,
      usage: response.usage,
    }),
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA.");
  }
  return content;
}

export const COACHING_IMAGE_MODEL = "gpt-image-1";

export interface EditedImageResult {
  bytes: Buffer;
  mimeType: "image/png";
}

/**
 * Edita a foto real do usuário (marcas de coaching). Saída não confiável —
 * o caller valida MIME/tamanho antes de persistir.
 */
export async function editUserImage(input: {
  imageBytes: Buffer;
  mimeType: string;
  fileName: string;
  prompt: string;
}): Promise<EditedImageResult> {
  const client = createAiClient();
  if (!client) {
    throw new Error(
      "IA não configurada. Defina OPENAI_API_KEY no servidor.",
    );
  }

  const imageFile = new File([new Uint8Array(input.imageBytes)], input.fileName, {
    type: input.mimeType,
  });

  const response = await client.images.edit({
    model: COACHING_IMAGE_MODEL,
    image: imageFile,
    prompt: input.prompt,
    input_fidelity: "high",
    quality: "low",
    output_format: "png",
  });

  logAiUsage(
    buildAiUsageLogPayload({
      model: COACHING_IMAGE_MODEL,
      kind: AI_USAGE_KIND.image_edit,
      imageCount: 1,
      usage: mapImageEditUsage(response.usage),
    }),
  );

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Edição de imagem sem conteúdo.");
  }

  return {
    bytes: Buffer.from(b64, "base64"),
    mimeType: "image/png",
  };
}

function mapImageEditUsage(
  usage:
    | {
        input_tokens?: number | null;
        output_tokens?: number | null;
        total_tokens?: number | null;
      }
    | null
    | undefined,
): RawCompletionUsage | null {
  if (!usage) return null;
  return {
    prompt_tokens: usage.input_tokens,
    completion_tokens: usage.output_tokens,
    total_tokens: usage.total_tokens,
  };
}
