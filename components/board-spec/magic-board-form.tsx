"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createBoardDraftAction,
  generateBoardSpecAction,
  updateBoardAction,
} from "@/actions/board-actions";
import { BoardMeasurementsFields } from "@/components/board-spec/board-measurements-fields";
import { BoardPhotosDropzone } from "@/components/board-spec/board-photos-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { boardMeasurementsToInitialValues } from "@/lib/board/measurements";
import type { Board, BoardSensation } from "@/lib/domain/types";

const MIN_BOARD_PHOTOS = 3;

interface MagicBoardFormProps {
  board?: Board;
}

export function MagicBoardForm({ board }: MagicBoardFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(board);
  const sensation = board?.sensation_json as BoardSensation | null;
  const existingPhotoCount = board?.photo_paths.length ?? 0;
  const initialMeasurements = useMemo(
    () => (board ? boardMeasurementsToInitialValues(board) : undefined),
    [board],
  );

  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "processing">("form");
  const [isPending, startTransition] = useTransition();

  const totalPhotos = existingPhotoCount + photos.length;
  const canGenerateSpec = totalPhotos >= MIN_BOARD_PHOTOS;
  const canSubmitCreate = photos.length >= MIN_BOARD_PHOTOS;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isEdit && !canSubmitCreate) {
      const message = `Envie pelo menos ${MIN_BOARD_PHOTOS} fotos antes de continuar.`;
      setError(message);
      toast.error(message);
      return;
    }

    const formData = new FormData(event.currentTarget);
    for (const photo of photos) {
      formData.append("photos", photo);
    }

    startTransition(async () => {
      if (isEdit && board) {
        const updated = await updateBoardAction(board.id, formData);
        if (!updated.success) {
          setError(updated.error ?? "Erro ao salvar prancha.");
          toast.error(updated.error);
          return;
        }
        toast.success("Prancha atualizada.");
        router.push(`/boards/${board.id}`);
        return;
      }

      const draft = await createBoardDraftAction(formData);
      if (!draft.success || !draft.data) {
        setError(draft.error ?? "Erro ao criar prancha.");
        toast.error(draft.error);
        return;
      }

      setStep("processing");
      const spec = await generateBoardSpecAction(draft.data.boardId);
      if (!spec.success) {
        setError(spec.error ?? "Erro ao gerar ficha.");
        setStep("form");
        toast.error(spec.error);
        return;
      }
      router.push(`/boards/${draft.data.boardId}`);
    });
  }

  function handleRegenerateSpec() {
    if (!board || !formRef.current) return;

    if (!canGenerateSpec) {
      const message = `É preciso ter pelo menos ${MIN_BOARD_PHOTOS} fotos para gerar a ficha.`;
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    const formData = new FormData(formRef.current);
    for (const photo of photos) {
      formData.append("photos", photo);
    }

    startTransition(async () => {
      const updated = await updateBoardAction(board.id, formData);
      if (!updated.success) {
        setError(updated.error ?? "Erro ao salvar prancha.");
        toast.error(updated.error);
        return;
      }

      setStep("processing");
      const spec = await generateBoardSpecAction(board.id);
      if (!spec.success) {
        setError(spec.error ?? "Erro ao gerar ficha.");
        setStep("form");
        toast.error(spec.error);
        return;
      }
      toast.success("Ficha técnica regenerada.");
      router.push(`/boards/${board.id}`);
    });
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
        <p className="font-display text-xl">Gerando ficha técnica…</p>
        <p className="text-sm text-muted-foreground">
          A IA está analisando suas fotos e medidas.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da prancha (opcional)</Label>
        <Input
          id="name"
          name="name"
          defaultValue={board?.name ?? ""}
          placeholder="Ex.: Híbrida verão 2025"
        />
      </div>

      <BoardPhotosDropzone
        minPhotos={MIN_BOARD_PHOTOS}
        existingPhotoCount={existingPhotoCount}
        disabled={isPending}
        onFilesChange={setPhotos}
        onValidationError={(message) => setError(message)}
      />

      <BoardMeasurementsFields
        disabled={isPending}
        initialValues={initialMeasurements}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mar_pequeno">Como se comporta no mar pequeno?</Label>
          <Textarea
            id="mar_pequeno"
            name="mar_pequeno"
            rows={2}
            defaultValue={sensation?.mar_pequeno ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mar_grande">Como se comporta no mar grande?</Label>
          <Textarea
            id="mar_grande"
            name="mar_grande"
            rows={2}
            defaultValue={sensation?.mar_grande ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontos_fortes">Pontos fortes (um por linha)</Label>
          <Textarea
            id="pontos_fortes"
            name="pontos_fortes"
            rows={3}
            defaultValue={sensation?.pontos_fortes?.join("\n") ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontos_fracos">Pontos fracos (um por linha)</Label>
          <Textarea
            id="pontos_fracos"
            name="pontos_fracos"
            rows={3}
            defaultValue={sensation?.pontos_fracos?.join("\n") ?? ""}
          />
        </div>
      </div>

      {isEdit ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
          {board?.status !== "processing" && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={isPending || !canGenerateSpec}
              onClick={handleRegenerateSpec}
            >
              Regerar ficha técnica
            </Button>
          )}
        </div>
      ) : (
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !canSubmitCreate}
        >
          {isPending ? "Enviando…" : "Gerar ficha técnica"}
        </Button>
      )}
    </form>
  );
}
