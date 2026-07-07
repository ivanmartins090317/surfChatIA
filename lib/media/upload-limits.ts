export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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

export interface MediaFileValidationResult {
  valid: boolean;
  error?: string;
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
      error:
        type === "video"
          ? "Vídeo acima de 100 MB. Comprima o arquivo ou envie um link."
          : "Imagem acima de 10 MB. Reduza o tamanho e tente novamente.",
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
