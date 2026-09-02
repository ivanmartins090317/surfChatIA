import { randomUUID } from "crypto";

const MIME_TO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function inferMediaExtension(mimeType: string, fileName: string): string {
  const fromMime = MIME_TO_EXT[mimeType.toLowerCase()];
  if (fromMime) {
    return fromMime;
  }

  const fromName = fileName.split(".").pop()?.toLowerCase();
  const allowedExtensions = new Set([
    "mp4",
    "mov",
    "webm",
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);
  if (fromName && allowedExtensions.has(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  return mimeType.startsWith("video/") ? "mp4" : "jpg";
}

export function buildMediaStoragePath(
  userId: string,
  mediaId: string,
  extension: string,
  objectId: string = randomUUID(),
): string {
  return `${userId}/${mediaId}/${objectId}.${extension}`;
}

/** Path das fotos da session (frames JPEG) no bucket media. */
export function buildMediaFrameStoragePath(
  userId: string,
  mediaId: string,
  objectId: string = randomUUID(),
): string {
  return `${userId}/${mediaId}/frames/${objectId}.jpg`;
}

export function isMediaStoragePathOwned(
  userId: string,
  mediaId: string,
  storagePath: string,
): boolean {
  const prefix = `${userId}/${mediaId}/`;
  return storagePath.startsWith(prefix) && !storagePath.includes("..");
}
