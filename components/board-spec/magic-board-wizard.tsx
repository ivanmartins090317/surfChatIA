"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createBoardDraftAction,
  generateBoardSpecAction,
} from "@/actions/board-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MagicBoardWizard() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "processing">("form");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const draft = await createBoardDraftAction(formData);
      if (!draft.success || !draft.data) {
        setError(draft.error ?? "Erro ao criar prancha.");
        toast.error(draft.error);
        return;
      }

      setStep("processing");
      const spec = await generateBoardSpecAction(draft.data.boardId);
      if (spec && !spec.success) {
        setError(spec.error ?? "Erro ao gerar ficha.");
        setStep("form");
        toast.error(spec.error);
        return;
      }
      router.refresh();
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
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da prancha (opcional)</Label>
        <Input id="name" name="name" placeholder="Ex.: Híbrida verão 2025" />
      </div>

      <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/14 p-6">
        <UploadCloud className="size-10 text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">
          Mínimo 3 fotos (deck, fundo, rails…) — JPEG/PNG/WebP
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

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-medium text-muted-foreground">
          Medidas (opcional)
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
          <Label htmlFor="thickness_in">Espessura (&quot;)</Label>
          <Input id="thickness_in" name="thickness_in" type="number" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume_l">Volume (L)</Label>
          <Input id="volume_l" name="volume_l" type="number" step="0.1" />
          <p className="text-xs text-muted-foreground">
            Litragem em litros; deixe vazio se não souber.
          </p>
        </div>
      </fieldset>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mar_pequeno">Como se comporta no mar pequeno?</Label>
          <Textarea id="mar_pequeno" name="mar_pequeno" rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mar_grande">Como se comporta no mar grande?</Label>
          <Textarea id="mar_grande" name="mar_grande" rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontos_fortes">Pontos fortes (um por linha)</Label>
          <Textarea id="pontos_fortes" name="pontos_fortes" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontos_fracos">Pontos fracos (um por linha)</Label>
          <Textarea id="pontos_fracos" name="pontos_fracos" rows={3} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando…" : "Gerar ficha técnica"}
      </Button>
    </form>
  );
}
