/**
 * Limites de arquivo no aparelho (vídeo de análise não sobe o original ao Storage).
 * Teto de tamanho protege o dispositivo na decodificação; duração limita o trecho.
 */
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 90;

export const MAX_VIDEO_MB = MAX_VIDEO_BYTES / (1024 * 1024);
export const MAX_IMAGE_MB = MAX_IMAGE_BYTES / (1024 * 1024);

export const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const VIDEO_DROPZONE_FORMATS_HINT =
  `MP4, MOV, WebM — até ${MAX_VIDEO_DURATION_SECONDS} s e ${MAX_VIDEO_MB} MB.`;

export const VIDEO_STAYS_ON_DEVICE_MICROCOPY =
  "O vídeo fica no seu aparelho. Enviamos só algumas fotos da session para a análise.";

export const LEGACY_VIDEO_REANALYSIS_MESSAGE =
  "Esta análise antiga não tem as fotos da session guardadas. Envie o vídeo de novo para analisar.";

export interface MediaFileValidationResult {
  valid: boolean;
  error?: string;
}

export function videoOversizeMessage(): string {
  return `Vídeo acima de ${MAX_VIDEO_MB} MB. Este aparelho pode não conseguir ler um arquivo tão grande. Use um trecho mais curto ou envie um link.`;
}

export function videoDurationOversizeMessage(): string {
  return `Vídeo acima de ${MAX_VIDEO_DURATION_SECONDS} segundos. Envie um trecho mais curto ou use um link.`;
}

export function imageOversizeMessage(): string {
  return `Imagem acima de ${MAX_IMAGE_MB} MB. Reduza o tamanho e tente novamente.`;
}

export function validateMediaFile(
  file: File,
  type: "video" | "image",
): MediaFileValidationResult {
  const maxSize = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  const allowed = type === "video" ? ALLOWED_VIDEO_MIMES : ALLOWED_IMAGE_MIMES;

  if (file.size === 0) {
    return { valid: false, error: "O arquivo está vazio. Escolha outro." };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: type === "video" ? videoOversizeMessage() : imageOversizeMessage(),
    };
  }

  const mime = file.type.toLowerCase();
  if (!mime || !allowed.has(mime)) {
    return {
      valid: false,
      error:
        type === "video"
          ? "Formato não suportado. Use MP4, MOV ou WebM."
          : "Formato não suportado. Use JPEG, PNG ou WebP.",
    };
  }

  return { valid: true };
}

export function validateVideoDurationSeconds(
  durationSeconds: number,
): MediaFileValidationResult {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return {
      valid: false,
      error: "Não foi possível ler a duração do vídeo.",
    };
  }

  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    return { valid: false, error: videoDurationOversizeMessage() };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
