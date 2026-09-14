import { describe, expect, it } from "vitest";
import {
  buildCoachingImageStoragePath,
  buildMediaFrameStoragePath,
  isMediaStoragePathOwned,
} from "@/lib/media/storage-path";
import {
  LEGACY_VIDEO_REANALYSIS_MESSAGE,
  MAX_VIDEO_DURATION_SECONDS,
  VIDEO_DROPZONE_FORMATS_HINT,
  VIDEO_STAYS_ON_DEVICE_MICROCOPY,
  validateVideoDurationSeconds,
  videoDurationOversizeMessage,
  videoOversizeMessage,
} from "@/lib/media/upload-limits";

describe("limites de vídeo no aparelho", () => {
  it("mensagem de tamanho cita 500 MB e correção com trecho ou link", () => {
    expect(videoOversizeMessage()).toContain("500 MB");
    expect(videoOversizeMessage()).toMatch(/trecho mais curto|link/i);
  });

  it("mensagem de duração cita 90 segundos", () => {
    expect(MAX_VIDEO_DURATION_SECONDS).toBe(90);
    expect(videoDurationOversizeMessage()).toContain("90");
    expect(videoDurationOversizeMessage()).toMatch(/trecho mais curto|link/i);
  });

  it("rejeita duração acima de 90 s", () => {
    const result = validateVideoDurationSeconds(90.1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(videoDurationOversizeMessage());
  });

  it("aceita duração de exatamente 90 s", () => {
    expect(validateVideoDurationSeconds(90).valid).toBe(true);
  });

  it("copy do dropzone menciona 90 s e 500 MB", () => {
    expect(VIDEO_DROPZONE_FORMATS_HINT).toContain("90 s");
    expect(VIDEO_DROPZONE_FORMATS_HINT).toContain("500 MB");
  });

  it("microcopy deixa claro que o original não sobe", () => {
    expect(VIDEO_STAYS_ON_DEVICE_MICROCOPY).toMatch(/aparelho/i);
    expect(VIDEO_STAYS_ON_DEVICE_MICROCOPY).toMatch(/fotos da session/i);
  });
});

describe("paths das fotos da session", () => {
  it("gera path sob {userId}/{mediaId}/frames/", () => {
    const path = buildMediaFrameStoragePath(
      "user-1",
      "media-1",
      "frame-uuid",
    );
    expect(path).toBe("user-1/media-1/frames/frame-uuid.jpg");
  });

  it("aceita ownership de path de frame do dono", () => {
    expect(
      isMediaStoragePathOwned(
        "user-1",
        "media-1",
        "user-1/media-1/frames/abc.jpg",
      ),
    ).toBe(true);
  });

  it("rejeita path com traversal ou de outro usuário", () => {
    expect(
      isMediaStoragePathOwned(
        "user-1",
        "media-1",
        "user-1/media-1/frames/../secret.jpg",
      ),
    ).toBe(false);
    expect(
      isMediaStoragePathOwned(
        "user-1",
        "media-1",
        "user-2/media-1/frames/abc.jpg",
      ),
    ).toBe(false);
  });

  it("aceita ownership do path de coaching do dono", () => {
    const path = buildCoachingImageStoragePath(
      "user-1",
      "media-1",
      "analysis-1",
      "uuid-1",
    );
    expect(isMediaStoragePathOwned("user-1", "media-1", path)).toBe(true);
    expect(isMediaStoragePathOwned("user-2", "media-1", path)).toBe(false);
  });
});

describe("reanálise de vídeo legado", () => {
  it("mensagem orienta a enviar o vídeo de novo", () => {
    expect(LEGACY_VIDEO_REANALYSIS_MESSAGE).toMatch(/análise antiga/i);
    expect(LEGACY_VIDEO_REANALYSIS_MESSAGE).toMatch(/envie o vídeo de novo/i);
  });
});
