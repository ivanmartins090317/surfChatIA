"use client";

import { CheckCircle2, ImageIcon, UploadCloud, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatFileSize,
  validateMediaFile,
} from "@/lib/media/upload-limits";
import { cn } from "@/lib/utils";

interface MediaFileDropzoneProps {
  mediaType: "video" | "image";
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onValidationError?: (message: string | null) => void;
}

const DROPZONE_COPY = {
  video: {
    hint: "Arraste um vídeo ou toque para enviar",
    formats: "MP4, MOV, WebM — máx. 100 MB",
    accept: "video/mp4,video/quicktime,video/webm",
  },
  image: {
    hint: "Arraste uma imagem ou toque para enviar",
    formats: "JPEG, PNG ou WebP — máx. 10 MB",
    accept: "image/jpeg,image/png,image/webp",
  },
} as const;

export function MediaFileDropzone({
  mediaType,
  disabled = false,
  onFileChange,
  onValidationError,
}: MediaFileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const copy = DROPZONE_COPY[mediaType];

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearSelection() {
    setSelectedFile(null);
    setLocalError(null);
    onValidationError?.(null);
    onFileChange(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function applyFile(file: File) {
    const validation = validateMediaFile(file, mediaType);
    if (!validation.valid) {
      clearSelection();
      setLocalError(validation.error ?? "Arquivo inválido.");
      onValidationError?.(validation.error ?? "Arquivo inválido.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setLocalError(null);
    onValidationError?.(null);
    onFileChange(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      applyFile(file);
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

    const file = event.dataTransfer.files?.[0];
    if (file) {
      applyFile(file);
    }
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-colors",
          disabled && "pointer-events-none opacity-60",
          isDragging && "border-primary bg-primary/5",
          selectedFile && !localError && "border-primary/50 bg-primary/5",
          !selectedFile && !isDragging && "border-white/14 hover:border-primary/40",
          localError && "border-destructive/50 bg-destructive/5",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={copy.accept}
          className="sr-only"
          disabled={disabled}
          onChange={handleInputChange}
        />

        {selectedFile && previewUrl && mediaType === "image" && !localError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pré-visualização da imagem selecionada"
              className="max-h-40 w-full rounded-xl object-contain"
            />
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{selectedFile.name}</span>
              <span className="text-muted-foreground">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
          </>
        ) : selectedFile && !localError ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="size-10 text-success" aria-hidden />
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(selectedFile.size)} · pronto para analisar
            </p>
          </div>
        ) : (
          <>
            {mediaType === "image" ? (
              <ImageIcon className="size-12 text-muted-foreground" aria-hidden />
            ) : (
              <UploadCloud className="size-12 text-muted-foreground" aria-hidden />
            )}
            <span className="text-center text-sm text-muted-foreground">
              {copy.hint}
              <br />
              {copy.formats}
            </span>
            {isDragging && (
              <span className="text-sm font-medium text-primary">
                Solte o arquivo aqui
              </span>
            )}
          </>
        )}

        {selectedFile && !disabled && (
          <button
            type="button"
            aria-label="Remover arquivo selecionado"
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/14 bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              clearSelection();
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </label>

      {localError && (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
