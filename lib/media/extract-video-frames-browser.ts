import { computeFrameTimestamps } from "@/lib/media/video-frame-sampling";

export interface ClientVideoFrame {
  base64: string;
  mimeType: "image/jpeg";
  timestampLabel: string;
}

const JPEG_QUALITY = 0.85;
const MAX_FRAME_EDGE_PX = 1280;

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function loadVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => {
      reject(new Error("Não foi possível ler o vídeo no navegador."));
    };
  });
}

function seekVideoTo(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao extrair frames do vídeo."));
    }, 15_000);

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

export async function extractVideoFramesInBrowser(
  file: File,
): Promise<ClientVideoFrame[]> {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await loadVideoMetadata(video);

    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("Não foi possível ler a duração do vídeo.");
    }

    const frames: ClientVideoFrame[] = [];

    for (const seconds of computeFrameTimestamps(video.duration)) {
      await seekVideoTo(video, seconds);
      frames.push(captureFrame(video, seconds));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}
