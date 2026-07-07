"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createAnalysisFromFileAction,
  createAnalysisFromLinkAction,
} from "@/actions/analysis-actions";
import { MediaFileDropzone } from "@/components/performance-analysis/media-file-dropzone";
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

export function NewAnalysisForm() {
  const router = useRouter();
  const [waveType, setWaveType] = useState("");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function appendContext(formData: FormData) {
    if (waveType) formData.set("wave_type", waveType);
    if (focus) formData.set("focus", focus);
  }

  function submitFile(type: "video" | "image") {
    const file = type === "video" ? videoFile : imageFile;
    if (!file) {
      const message = "Selecione um arquivo antes de analisar.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("media_type", type);
    appendContext(formData);

    startTransition(async () => {
      const result = await createAnalysisFromFileAction(formData);
      if (!result.success || !result.data) {
        setError(result.error ?? "Erro no upload.");
        toast.error(result.error);
        return;
      }
      router.push(`/analyses/${result.data.analysisId}`);
    });
  }

  function submitLink(formData: FormData) {
    setError(null);
    appendContext(formData);
    startTransition(async () => {
      const result = await createAnalysisFromLinkAction(formData);
      if (!result.success || !result.data) {
        setError(result.error ?? "Erro ao analisar link.");
        toast.error(result.error);
        return;
      }
      router.push(`/analyses/${result.data.analysisId}`);
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
          <MediaFileDropzone
            mediaType="video"
            disabled={isPending}
            onFileChange={setVideoFile}
            onValidationError={(message) => setError(message)}
          />
          <Button
            type="button"
            className="w-full"
            disabled={isPending || !videoFile}
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
          <MediaFileDropzone
            mediaType="image"
            disabled={isPending}
            onFileChange={setImageFile}
            onValidationError={(message) => setError(message)}
          />
          <Button
            type="button"
            className="w-full"
            disabled={isPending || !imageFile}
            onClick={() => submitFile("image")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Analisando…
              </>
            ) : (
              "Analisar imagem"
            )}
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
