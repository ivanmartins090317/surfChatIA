import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { computeFrameTimestamps } from "@/lib/media/video-frame-sampling";

export interface ExtractedVideoFrame {
  base64: string;
  mimeType: "image/jpeg";
  timestampLabel: string;
}

function ensureFfmpegBinaries(): void {
  if (!ffmpegPath) {
    throw new Error("ffmpeg não disponível no servidor.");
  }

  const probePath = ffprobeStatic.path;
  if (!probePath) {
    throw new Error("ffprobe não disponível no servidor.");
  }

  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(probePath);
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
  ensureFfmpegBinaries();

  const workDir = await mkdtemp(join(tmpdir(), "surf-video-"));
  const extension = mimeType.includes("quicktime") ? "mov" : "mp4";
  const videoPath = join(workDir, `${randomUUID()}.${extension}`);

  try {
    await writeFile(videoPath, buffer);
    const duration = await getVideoDurationSeconds(videoPath);
    const timestamps = computeFrameTimestamps(duration);
    const frames: ExtractedVideoFrame[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const seconds = timestamps[index];
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
