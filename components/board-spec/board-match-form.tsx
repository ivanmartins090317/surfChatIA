"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createBoardMatchAction } from "@/actions/board-match-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Board } from "@/lib/domain/types";

interface BoardMatchFormProps {
  magicBoards: Board[];
}

export function BoardMatchForm({ magicBoards }: BoardMatchFormProps) {
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    if (referenceId) {
      formData.set("reference_board_id", referenceId);
    }

    startTransition(async () => {
      const result = await createBoardMatchAction(formData);
      if (result && !result.success) {
        setError(result.error ?? "Erro na análise.");
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/14 p-6">
        <UploadCloud className="size-10 text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">
          Fotos da prancha candidata
        </span>
        <input
          type="file"
          name="photos"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="sr-only"
        />
      </label>

      {magicBoards.length > 0 && (
        <div className="space-y-2">
          <Label>Prancha mágica de referência (opcional)</Label>
          <Select value={referenceId} onValueChange={setReferenceId}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma — avaliar só com perfil" />
            </SelectTrigger>
            <SelectContent>
              {magicBoards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name ?? `Prancha ${board.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-sm text-muted-foreground">
          Medidas anunciadas (opcional)
        </legend>
        <div className="space-y-2">
          <Label htmlFor="length_in">Comprimento (&quot;)</Label>
          <Input id="length_in" name="length_in" type="number" step="0.1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width_in">Largura (&quot;)</Label>
          <Input id="width_in" name="width_in" type="number" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume_l">Volume (L)</Label>
          <Input id="volume_l" name="volume_l" type="number" step="0.1" />
        </div>
      </fieldset>

      <Button type="submit" className="w-full" disabled={isPending}>
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
