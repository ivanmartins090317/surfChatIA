"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createAnalysisFromFileAction,
  createAnalysisFromLinkAction,
} from "@/actions/analysis-actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANALYSIS_FOCUS, WAVE_TYPES } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function NewAnalysisForm() {
  const [waveType, setWaveType] = useState("");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function appendContext(formData: FormData) {
    if (waveType) formData.set("wave_type", waveType);
    if (focus) formData.set("focus", focus);
  }

  function submitFile(type: "video" | "image") {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecione um arquivo antes de analisar.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("media_type", type);
    appendContext(formData);

    startTransition(async () => {
      const result = await createAnalysisFromFileAction(formData);
      if (result && !result.success) {
        setError(result.error ?? "Erro no upload.");
        toast.error(result.error);
      }
    });
  }

  function submitLink(formData: FormData) {
    setError(null);
    appendContext(formData);
    startTransition(async () => {
      const result = await createAnalysisFromLinkAction(formData);
      if (result && !result.success) {
        setError(result.error ?? "Erro ao analisar link.");
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de onda</Label>
          <Select value={waveType} onValueChange={setWaveType}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WAVE_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Foco da análise</Label>
          <Select value={focus} onValueChange={setFocus}>
            <SelectTrigger>
              <SelectValue placeholder="Opcional" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ANALYSIS_FOCUS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="file">
        <TabsList className="w-full">
          <TabsTrigger value="file" className="flex-1">
            Arquivo
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            Imagem
          </TabsTrigger>
          <TabsTrigger value="link" className="flex-1">
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-4">
          <label
            className={cn(
              "flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/14 p-8 transition-colors hover:border-primary/50",
            )}
          >
            <UploadCloud className="size-12 text-muted-foreground" aria-hidden />
            <span className="text-center text-sm text-muted-foreground">
              Arraste um vídeo ou toque para enviar
              <br />
              MP4, MOV, WebM — máx. 100 MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
            />
          </label>
          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={() => submitFile("video")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Analisando…
              </>
            ) : (
              "Analisar vídeo"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/14 p-8">
            <UploadCloud className="size-12 text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">
              JPEG, PNG ou WebP — máx. 10 MB
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
            />
          </label>
          <Button
            type="button"
            className="w-full"
            disabled={isPending}
            onClick={() => submitFile("image")}
          >
            {isPending ? "Analisando…" : "Analisar imagem"}
          </Button>
        </TabsContent>

        <TabsContent value="link">
          <form action={submitLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="external_url">Link YouTube ou Instagram</Label>
              <Input
                id="external_url"
                name="external_url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Analisando…" : "Analisar link"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
