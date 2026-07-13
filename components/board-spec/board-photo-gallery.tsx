"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { fetchBoardPhotoUrlAction } from "@/actions/board-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BoardPhotoView } from "@/services/board-service";

interface BoardPhotoGalleryProps {
  visiblePhotos: BoardPhotoView[];
  extraPhotoPaths: string[];
  totalCount: number;
}

export function BoardPhotoGallery({
  visiblePhotos,
  extraPhotoPaths,
  totalCount,
}: BoardPhotoGalleryProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogUrl, setDialogUrl] = useState<string | null>(null);
  const [dialogLabel, setDialogLabel] = useState("");
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [cachedUrls, setCachedUrls] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openDialog = useCallback((url: string, label: string) => {
    setDialogUrl(url);
    setDialogLabel(label);
    setErrorMessage(null);
    setDialogOpen(true);
  }, []);

  const loadExtraPhoto = useCallback(
    (path: string, photoIndex: number) => {
      const label = `Foto ${photoIndex + 1} da prancha`;
      const cached = cachedUrls[path];
      if (cached) {
        openDialog(cached, label);
        return;
      }

      setLoadingPath(path);
      setErrorMessage(null);

      startTransition(async () => {
        const result = await fetchBoardPhotoUrlAction(path);
        setLoadingPath(null);

        if (!result.success || !result.data?.url) {
          setErrorMessage(result.error ?? "Não foi possível carregar a foto.");
          return;
        }

        const { url } = result.data;
        setCachedUrls((prev) => ({ ...prev, [path]: url }));
        openDialog(url, label);
      });
    },
    [cachedUrls, openDialog],
  );

  if (totalCount === 0) {
    return null;
  }

  const extraStartIndex = visiblePhotos.length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fotos da prancha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visiblePhotos.length > 0 && (
            <ul
              className={cn(
                "grid gap-3",
                visiblePhotos.length > 1 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {visiblePhotos.map((photo, index) => (
                <li key={photo.path}>
                  <button
                    type="button"
                    onClick={() =>
                      openDialog(photo.url, `Foto ${index + 1} da prancha`)
                    }
                    className="group block w-full overflow-hidden rounded-xl border border-white/08 bg-muted/20 text-left transition-colors hover:border-white/14 focus-visible:glow-focus"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1} da prancha`}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {extraPhotoPaths.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                +{extraPhotoPaths.length} foto
                {extraPhotoPaths.length !== 1 ? "s" : ""} — toque para abrir
              </p>
              <ul className="flex flex-wrap gap-2">
                {extraPhotoPaths.map((path, index) => {
                  const photoIndex = extraStartIndex + index;
                  const isLoading = isPending && loadingPath === path;

                  return (
                    <li key={path}>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => loadExtraPhoto(path, photoIndex)}
                        className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border border-white/08 bg-muted/20 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-white/14 hover:text-foreground focus-visible:glow-focus disabled:opacity-60"
                        aria-label={`Abrir foto ${photoIndex + 1}`}
                      >
                        {isLoading ? (
                          <Loader2
                            className="size-4 shrink-0 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <ImageIcon className="size-4 shrink-0" aria-hidden />
                        )}
                        Foto {photoIndex + 1}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {totalCount} foto{totalCount !== 1 ? "s" : ""} no total
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-4 sm:p-6">
          <DialogTitle className="sr-only">{dialogLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            Visualização ampliada da foto da prancha
          </DialogDescription>
          {dialogUrl && (
            <div className="overflow-hidden rounded-xl border border-white/08 bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dialogUrl}
                alt={dialogLabel}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
