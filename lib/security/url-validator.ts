const ALLOWED_VIDEO_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "instagram.com",
  "www.instagram.com",
];

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
}

export function validateExternalVideoUrl(rawUrl: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return {
      valid: false,
      error: "URL inválida. Use um link completo começando com https://.",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Apenas links HTTPS são aceitos por segurança.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_VIDEO_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );

  if (!isAllowed) {
    return {
      valid: false,
      error:
        "Domínio não permitido. Use YouTube ou Instagram.",
    };
  }

  if (PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return {
      valid: false,
      error: "Endereço interno bloqueado por segurança (SSRF).",
    };
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}
