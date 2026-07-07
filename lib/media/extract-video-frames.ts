import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const FRAME_PERCENTAGES = [0.2, 0.5, 0.8] as const;
const MAX_FRAMES = FRAME_PERCENTAGES.length;

export interface ExtractedVideoFrame {
  base64: string;
  mimeType: "image/jpeg";
  timestampLabel: string;
}

function ensureFfmpegPath(): void {
  if (!ffmpegPath) {
    throw new Error("ffmpeg não disponível no servidor.");
  }
  ffmpeg.setFfmpegPath(ffmpegPath);
}

async function getVideoDurationSeconds(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }
      const duration = metadata.format.duration ?? 0;
      if (duration <= 0) {
        reject(new Error("Não foi possível ler a duração do vídeo."));
        return;
      }
      resolve(duration);
    });
  });
}

async function extractFrameAt(
  videoPath: string,
  outputPath: string,
  seconds: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(seconds)
      .frames(1)
      .outputOptions(["-q:v", "2"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (error) => reject(error))
      .run();
  });
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export async function extractVideoFrames(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedVideoFrame[]> {
  ensureFfmpegPath();

  const workDir = await mkdtemp(join(tmpdir(), "surf-video-"));
  const extension = mimeType.includes("quicktime") ? "mov" : "mp4";
  const videoPath = join(workDir, `${randomUUID()}.${extension}`);

  try {
    await writeFile(videoPath, buffer);
    const duration = await getVideoDurationSeconds(videoPath);
    const frames: ExtractedVideoFrame[] = [];

    for (let index = 0; index < MAX_FRAMES; index += 1) {
      const ratio = FRAME_PERCENTAGES[index];
      const seconds = Math.max(0, Math.min(duration - 0.1, duration * ratio));
      const framePath = join(workDir, `frame-${index}.jpg`);

      await extractFrameAt(videoPath, framePath, seconds);
      const frameBuffer = await readFile(framePath);

      frames.push({
        base64: frameBuffer.toString("base64"),
        mimeType: "image/jpeg",
        timestampLabel: formatTimestamp(seconds),
      });
    }

    return frames;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
