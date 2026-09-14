import { fileTypeFromBuffer } from "file-type";
import { editUserImage } from "@/lib/ai/client";
import { buildCoachingEditPrompt } from "@/lib/ai/wave-coaching";
import type { WavePhase } from "@/lib/domain/types";

export const MAX_COACHING_IMAGE_BYTES = 4 * 1024 * 1024;

const ALLOWED_COACHING_MIMES = new Set(["image/png"]);

export async function validateCoachingImageBytes(bytes: Buffer): Promise<{
  bytes: Buffer;
  mimeType: string;
}> {
  if (bytes.length === 0 || bytes.length > MAX_COACHING_IMAGE_BYTES) {
    throw new Error("Foto anotada inválida ou grande demais.");
  }

  const detected = await fileTypeFromBuffer(bytes);
  const mime = detected?.mime ?? "";
  if (!ALLOWED_COACHING_MIMES.has(mime)) {
    throw new Error("Foto anotada com tipo não suportado.");
  }

  return { bytes, mimeType: mime };
}

export async function editCoachingFrame(input: {
  phase: WavePhase;
  sourceBytes: Buffer;
  sourceMimeType: string;
}): Promise<{ bytes: Buffer; mimeType: string }> {
  const edited = await editUserImage({
    imageBytes: input.sourceBytes,
    mimeType: input.sourceMimeType,
    fileName: `phase-${input.phase.frame_index}.jpg`,
    prompt: buildCoachingEditPrompt(input.phase),
  });

  return validateCoachingImageBytes(edited.bytes);
}
