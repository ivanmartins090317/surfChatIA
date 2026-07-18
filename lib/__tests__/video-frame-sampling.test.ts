import { describe, expect, it } from "vitest";
import {
  computeFrameTimestamps,
  VIDEO_FRAME_COUNT,
} from "@/lib/media/video-frame-sampling";

describe("computeFrameTimestamps", () => {
  it("gera VIDEO_FRAME_COUNT timestamps por padrão", () => {
    const timestamps = computeFrameTimestamps(60);
    expect(timestamps).toHaveLength(VIDEO_FRAME_COUNT);
  });

  it("distribui os timestamps em ordem crescente e uniforme", () => {
    const timestamps = computeFrameTimestamps(70);
    const sorted = [...timestamps].sort((a, b) => a - b);
    expect(timestamps).toEqual(sorted);

    for (let i = 1; i < timestamps.length; i += 1) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
    }
  });

  it("nunca gera timestamp nos extremos exatos (0% ou 100%)", () => {
    const duration = 30;
    const timestamps = computeFrameTimestamps(duration);
    for (const seconds of timestamps) {
      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThan(duration);
    }
  });

  it("respeita uma quantidade customizada de frames", () => {
    const timestamps = computeFrameTimestamps(90, 3);
    expect(timestamps).toHaveLength(3);
  });

  it("nunca excede a duração mesmo em vídeos muito curtos", () => {
    const timestamps = computeFrameTimestamps(1);
    for (const seconds of timestamps) {
      expect(seconds).toBeLessThan(1);
      expect(seconds).toBeGreaterThanOrEqual(0);
    }
  });
});
