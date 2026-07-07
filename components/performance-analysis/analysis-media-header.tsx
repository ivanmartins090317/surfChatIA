import { ExternalLink, ImageIcon, Link2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

export function AnalysisMediaHeader({
  media,
  previewUrl,
}: AnalysisMediaHeaderProps) {
  if (!media) return null;

  const subtitle = getAnalysisListSubtitle(media);

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1.5">
            <MediaIcon type={media.type} />
            {getAnalysisMediaLabel(media)}
          </Badge>
          {media.type === "image" && (
            <span className="text-xs text-muted-foreground">
              Análise visual do frame (IA com visão)
            </span>
          )}
          {media.type === "link" && (
            <span className="text-xs text-muted-foreground">
              Orientação por contexto — vídeo não assistido pela IA
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}

        {media.type === "link" && media.external_url && (
          <a
            href={media.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            {media.external_url}
          </a>
        )}

        {previewUrl && media.type === "image" && (
          <div className="overflow-hidden rounded-xl border border-white/08">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Foto analisada na session"
              className="max-h-64 w-full object-contain bg-black/20"
            />
          </div>
        )}

        {media.type === "video" && (
          <p className="text-sm text-muted-foreground">
            {MEDIA_TYPES.video} analisado em múltiplos frames com IA de visão.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
