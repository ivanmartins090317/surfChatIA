import { ImageIcon, Link2, Video } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAnalysisListSubtitle,
  getAnalysisListTitle,
  getAnalysisMediaLabel,
} from "@/lib/domain/analysis-display";
import type { PerformanceAnalysisListItem } from "@/lib/domain/analysis-display";
import type { PerformanceResult } from "@/lib/domain/types";
import { formatDatePtBr } from "@/lib/utils";

interface AnalysisListCardProps {
  item: PerformanceAnalysisListItem;
}

function MediaTypeIcon({ type }: { type: "link" | "image" | "video" }) {
  const className = "size-5 shrink-0 text-muted-foreground";
  if (type === "link") return <Link2 className={className} aria-hidden />;
  if (type === "image") return <ImageIcon className={className} aria-hidden />;
  return <Video className={className} aria-hidden />;
}

export function AnalysisListCard({ item }: AnalysisListCardProps) {
  const { analysis, media, previewUrl } = item;
  const result = analysis.result_json as PerformanceResult | null;
  const title = getAnalysisListTitle(media, result);
  const subtitle = getAnalysisListSubtitle(media);

  return (
    <Link href={`/analyses/${analysis.id}`}>
      <Card className="hover:border-white/14">
        <CardContent className="flex items-center gap-4 py-4">
          {previewUrl ? (
            <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-white/08 bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/08 bg-muted/50">
              {media ? (
                <MediaTypeIcon type={media.type} />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground" aria-hidden />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {media && (
                <Badge variant="default" className="text-xs">
                  {getAnalysisMediaLabel(media)}
                </Badge>
              )}
              {result?.score != null && analysis.status === "done" && (
                <Badge variant="primary" className="tabular-nums text-xs">
                  Score {result.score}
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDatePtBr(analysis.created_at)}
              {subtitle ? ` · ${subtitle}` : ""}
            </p>
            {result?.resumo && analysis.status === "done" && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {result.resumo}
              </p>
            )}
          </div>

          <Badge
            variant={analysis.status === "done" ? "success" : "info"}
            className="shrink-0"
          >
            {analysis.status === "done" ? "Pronto" : analysis.status}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
