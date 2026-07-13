import { ExternalLink, ImageIcon, Link2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  getAnalysisListSubtitle,
  getAnalysisMediaLabel,
} from "@/lib/domain/analysis-display";
import type { MediaItem } from "@/lib/domain/types";
import { MEDIA_TYPES } from "@/lib/domain/types";

interface AnalysisMediaHeaderProps {
  media: MediaItem | null;
  previewUrl: string | null;
}

function MediaIcon({ type }: { type: MediaItem["type"] }) {
  const className = "size-4 shrink-0";
  if (type === "link") return <Link2 className={className} aria-hidden />;
  if (type === "image") return <ImageIcon className={className} aria-hidden />;
  return <Video className={className} aria-hidden />;
}

function getMediaContextHint(media: MediaItem): string | null {
  if (media.type === "image") {
    return "Análise visual do frame com IA de visão.";
  }
  if (media.type === "link") {
    return "Orientação por contexto — o vídeo não é assistido pela IA.";
  }
  if (media.type === "video") {
    return `${MEDIA_TYPES.video} analisado em múltiplos frames com IA de visão.`;
  }
  return null;
}

export function AnalysisMediaHeader({
  media,
  previewUrl,
}: AnalysisMediaHeaderProps) {
  if (!media) return null;

  const subtitle = getAnalysisListSubtitle(media);
  const contextHint = getMediaContextHint(media);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3 pb-4">
        <Badge variant="default" className="w-fit gap-1.5">
          <MediaIcon type={media.type} />
          {getAnalysisMediaLabel(media)}
        </Badge>

        {contextHint && (
          <CardDescription className="text-sm leading-relaxed">
            {contextHint}
          </CardDescription>
        )}

        {subtitle && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}

        {media.type === "link" && media.external_url && (
          <a
            href={media.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{media.external_url}</span>
          </a>
        )}
      </CardHeader>

      {previewUrl && media.type === "image" && (
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-2xl border border-white/08 bg-muted/20">
            <div className="flex items-center justify-center p-4 md:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Foto analisada na session"
                className="max-h-64 w-auto max-w-full rounded-lg object-contain md:max-h-80"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
