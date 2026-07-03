import OpenAI from "openai";
import { hasOpenAiKey } from "@/lib/env";

const AI_TIMEOUT_MS = 90_000;

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
    model: "gpt-4o-mini",
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
