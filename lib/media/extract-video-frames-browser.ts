import {
  computeFrameTimestamps,
  MIN_VIDEO_FRAMES,
} from "@/lib/media/video-frame-sampling";

export interface ClientVideoFrame {
  base64: string;
  mimeType: "image/jpeg";
  timestampLabel: string;
}

export interface ExtractVideoFramesProgress {
  current: number;
  total: number;
}

export interface ExtractVideoFramesOptions {
  onProgress?: (progress: ExtractVideoFramesProgress) => void;
}

const JPEG_QUALITY = 0.85;
const MAX_FRAME_EDGE_PX = 1280;
const METADATA_TIMEOUT_MS = 20_000;
const SEEK_TIMEOUT_MS = 20_000;
const SEEK_RETRY_COUNT = 1;

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * iOS Safari e alguns navegadores Android decodificam vídeo `blob:` de forma
 * mais confiável quando o elemento está anexado ao DOM (mesmo invisível) do
 * que quando existe apenas em memória.
 */
function attachHiddenVideoElement(video: HTMLVideoElement): void {
  video.style.position = "fixed";
  video.style.width = "1px";
  video.style.height = "1px";
  video.style.opacity = "0";
  video.style.pointerEvents = "none";
  document.body.appendChild(video);
}

const READY_STATE_BY_EVENT = {
  loadedmetadata: 1, // HAVE_METADATA
  loadeddata: 2, // HAVE_CURRENT_DATA
} as const;

function waitForEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata" | "loadeddata",
  timeoutMs: number,
  timeoutMessage: string,
): Promise<void> {
  if (video.readyState >= READY_STATE_BY_EVENT[eventName]) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeoutId);
      video.removeEventListener(eventName, handleReady);
      video.removeEventListener("error", handleError);
    }

    function handleReady() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error("Não foi possível ler o vídeo no navegador."));
    }

    video.addEventListener(eventName, handleReady);
    video.addEventListener("error", handleError);
  });
}

function seekVideoToOnce(
  video: HTMLVideoElement,
  seconds: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao buscar o frame do vídeo."));
    }, SEEK_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      video.removeEventListener("seeked", handleSeeked);
    }

    function handleSeeked() {
      cleanup();
      resolve();
    }

    video.addEventListener("seeked", handleSeeked);
    video.currentTime = seconds;
  });
}

async function seekVideoTo(
  video: HTMLVideoElement,
  seconds: number,
): Promise<void> {
  for (let attempt = 0; attempt <= SEEK_RETRY_COUNT; attempt += 1) {
    try {
      await seekVideoToOnce(video, seconds);
      return;
    } catch (error) {
      if (attempt === SEEK_RETRY_COUNT) {
        throw error;
      }
    }
  }
}

function captureFrame(
  video: HTMLVideoElement,
  seconds: number,
): ClientVideoFrame {
  const canvas = document.createElement("canvas");
  const scale = Math.min(
    1,
    MAX_FRAME_EDGE_PX / Math.max(video.videoWidth, video.videoHeight),
  );
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas indisponível para extrair frames.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1];

  if (!base64) {
    throw new Error("Falha ao gerar frame do vídeo.");
  }

  return {
    base64,
    mimeType: "image/jpeg",
    timestampLabel: formatTimestamp(seconds),
  };
}

async function captureFramesAtTimestamps(
  video: HTMLVideoElement,
  timestamps: number[],
  onProgress?: ExtractVideoFramesOptions["onProgress"],
): Promise<ClientVideoFrame[]> {
  const frames: ClientVideoFrame[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const seconds = timestamps[index];
    onProgress?.({ current: index + 1, total: timestamps.length });

    try {
      await seekVideoTo(video, seconds);
      frames.push(captureFrame(video, seconds));
    } catch {
      // Falha isolada em um frame não invalida a extração inteira — o
      // dispositivo móvel pode falhar o seek em um ponto específico do
      // vídeo (ex.: distância grande do keyframe anterior).
    }
  }

  return frames;
}

function releaseVideoElement(video: HTMLVideoElement, objectUrl: string): void {
  URL.revokeObjectURL(objectUrl);
  video.removeAttribute("src");
  video.load();
  video.remove();
}

export async function extractVideoFramesInBrowser(
  file: File,
  options?: ExtractVideoFramesOptions,
): Promise<ClientVideoFrame[]> {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  attachHiddenVideoElement(video);

  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await waitForEvent(
      video,
      "loadedmetadata",
      METADATA_TIMEOUT_MS,
      "Tempo esgotado ao carregar o vídeo. Verifique sua conexão e tente novamente.",
    );

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("Não foi possível ler a duração do vídeo.");
    }

    await waitForEvent(
      video,
      "loadeddata",
      METADATA_TIMEOUT_MS,
      "Tempo esgotado ao carregar o vídeo. Verifique sua conexão e tente novamente.",
    );

    const timestamps = computeFrameTimestamps(video.duration);
    const frames = await captureFramesAtTimestamps(
      video,
      timestamps,
      options?.onProgress,
    );

    if (frames.length < MIN_VIDEO_FRAMES) {
      throw new Error(
        "Não foi possível extrair frames suficientes do vídeo neste dispositivo. Tente novamente, use um vídeo mais curto ou envie por um link.",
      );
    }

    return frames;
  } finally {
    releaseVideoElement(video, objectUrl);
  }
}
