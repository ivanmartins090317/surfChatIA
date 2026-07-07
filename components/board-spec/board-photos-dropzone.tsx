"use client";

import { CheckCircle2, ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatFileSize,
  validateMediaFile,
} from "@/lib/media/upload-limits";
import { cn } from "@/lib/utils";

interface BoardPhotosDropzoneProps {
  minPhotos?: number;
  existingPhotoCount?: number;
  emptyHint?: string;
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onValidationError?: (message: string | null) => void;
}

interface PhotoPreview {
  id: string;
  file: File;
  previewUrl: string;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function BoardPhotosDropzone({
  minPhotos = 3,
  existingPhotoCount = 0,
  emptyHint,
  disabled = false,
  onFilesChange,
  onValidationError,
}: BoardPhotosDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PhotoPreview[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  photosRef.current = photos;

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, []);

  function syncFiles(nextPhotos: PhotoPreview[]) {
    setPhotos(nextPhotos);
    onFilesChange(nextPhotos.map((photo) => photo.file));
  }

  function addFiles(incoming: File[]) {
    const validPhotos: PhotoPreview[] = [];

    for (const file of incoming) {
      const validation = validateMediaFile(file, "image");
      if (!validation.valid) {
        setLocalError(validation.error ?? "Arquivo inválido.");
        onValidationError?.(validation.error ?? "Arquivo inválido.");
        return;
      }

      validPhotos.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validPhotos.length === 0) return;

    setLocalError(null);
    onValidationError?.(null);
    syncFiles([...photos, ...validPhotos]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    const target = photos.find((photo) => photo.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    const nextPhotos = photos.filter((photo) => photo.id !== id);
    syncFiles(nextPhotos);

    if (nextPhotos.length === 0) {
      setLocalError(null);
      onValidationError?.(null);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files?.length) {
      addFiles(Array.from(files));
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const dropped = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (dropped.length === 0) {
      const message = "Solte apenas imagens JPEG, PNG ou WebP.";
      setLocalError(message);
      onValidationError?.(message);
      return;
    }

    addFiles(dropped);
  }

  const totalPhotos = existingPhotoCount + photos.length;
  const hasMinimum = totalPhotos >= minPhotos;
  const defaultEmptyHint =
    existingPhotoCount > 0
      ? `${existingPhotoCount} foto(s) já salva(s). Adicione mais se quiser.`
      : `Mínimo ${minPhotos} foto${minPhotos !== 1 ? "s" : ""} (deck, fundo, rails…) — JPEG/PNG/WebP`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors",
          disabled && "pointer-events-none opacity-60",
          isDragging && "border-primary bg-primary/5",
          hasMinimum && !localError && "border-primary/50 bg-primary/5",
          !hasMinimum && !isDragging && "border-white/14 hover:border-primary/40",
          localError && "border-destructive/50 bg-destructive/5",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={handleInputChange}
        />

        {photos.length > 0 ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-background/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={photo.file.name}
                    className="size-full object-cover"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remover ${photo.file.name}`}
                      className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full border border-white/14 bg-background/90 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removePhoto(photo.id);
                      }}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                hasMinimum ? "text-success" : "text-muted-foreground",
              )}
            >
              {hasMinimum ? (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              ) : (
                <ImageIcon className="size-4 shrink-0" aria-hidden />
              )}
              <span>
                {totalPhotos} foto{totalPhotos !== 1 ? "s" : ""} no total
                {existingPhotoCount > 0 &&
                  ` (${existingPhotoCount} salva${existingPhotoCount !== 1 ? "s" : ""} + ${photos.length} nova${photos.length !== 1 ? "s" : ""})`}
                {!hasMinimum && ` · mínimo ${minPhotos}`}
              </span>
            </div>

            <span className="text-xs text-muted-foreground">
              Toque ou arraste para adicionar mais
            </span>
          </div>
        ) : (
          <>
            <UploadCloud className="size-10 text-muted-foreground" aria-hidden />
            <span className="text-center text-sm text-muted-foreground">
              Arraste fotos ou toque para enviar
              <br />
              {emptyHint ?? defaultEmptyHint}
            </span>
            {isDragging && (
              <span className="text-sm font-medium text-primary">
                Solte as fotos aqui
              </span>
            )}
          </>
        )}
      </label>

      {localError && (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      )}

      {photos.length > 0 && !localError && (
        <ul className="sr-only" aria-live="polite">
          {photos.map((photo) => (
            <li key={photo.id}>
              {photo.file.name} ({formatFileSize(photo.file.size)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
