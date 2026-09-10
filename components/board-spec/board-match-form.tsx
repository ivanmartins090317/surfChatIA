"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createBoardMatchAction } from "@/actions/board-match-actions";
import { BoardMeasurementsFields } from "@/components/board-spec/board-measurements-fields";
import { BoardPhotosDropzone } from "@/components/board-spec/board-photos-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Board } from "@/lib/domain/types";

const MIN_MATCH_PHOTOS = 1;

interface BoardMatchFormProps {
  magicBoards: Board[];
  initialReferenceBoardId?: string;
}

export function BoardMatchForm({
  magicBoards,
  initialReferenceBoardId = "",
}: BoardMatchFormProps) {
  const router = useRouter();
  const [referenceId, setReferenceId] = useState(() => {
    if (
      initialReferenceBoardId &&
      magicBoards.some((board) => board.id === initialReferenceBoardId)
    ) {
      return initialReferenceBoardId;
    }
    return "";
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!referenceId) {
      const message = "Escolha a prancha mágica de referência para continuar.";
      setError(message);
      toast.error(message);
      return;
    }

    if (photos.length < MIN_MATCH_PHOTOS) {
      const message = "Envie pelo menos uma foto da prancha candidata.";
      setError(message);
      toast.error(message);
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("reference_board_id", referenceId);
    for (const photo of photos) {
      formData.append("photos", photo);
    }

    startTransition(async () => {
      const result = await createBoardMatchAction(formData);
      if (!result.success || !result.data) {
        setError(result.error ?? "Erro na análise.");
        toast.error(result.error);
        return;
      }
      router.push(`/compatibility/${result.data.analysisId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <BoardPhotosDropzone
        minPhotos={MIN_MATCH_PHOTOS}
        emptyHint="Fotos da prancha candidata — JPEG/PNG/WebP"
        disabled={isPending}
        onFilesChange={setPhotos}
        onValidationError={(message) => setError(message)}
      />

      <div className="space-y-2">
        <Label htmlFor="reference-board">
          Prancha mágica de referência
        </Label>
        <Select
          value={referenceId || undefined}
          onValueChange={setReferenceId}
          required
        >
          <SelectTrigger id="reference-board" className="min-h-[44px]">
            <SelectValue placeholder="Selecione a prancha mágica" />
          </SelectTrigger>
          <SelectContent>
            {magicBoards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name ?? `Prancha ${board.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Obrigatório — o Match compara a candidata com a sua mágica.
        </p>
      </div>

      <BoardMeasurementsFields
        disabled={isPending}
        showThickness={false}
        legend="Medidas anunciadas (opcional)"
      />

      <Button
        type="submit"
        className="w-full min-h-[44px]"
        disabled={
          isPending || photos.length < MIN_MATCH_PHOTOS || !referenceId
        }
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Analisando compatibilidade…
          </>
        ) : (
          "Analisar compatibilidade"
        )}
      </Button>
    </form>
  );
}
