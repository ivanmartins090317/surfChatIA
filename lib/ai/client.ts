import OpenAI from "openai";
import { hasOpenAiKey } from "@/lib/env";

const AI_TIMEOUT_MS = process.env.VERCEL ? 55_000 : 90_000;
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

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA.");
  }
  return content;
}
