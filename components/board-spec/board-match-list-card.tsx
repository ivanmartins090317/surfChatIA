import { GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BoardMatchResult } from "@/lib/domain/types";
import {
  ANALYSIS_STATUS,
  BOARD_MATCH_VERDICT_LABELS,
} from "@/lib/domain/types";
import { formatDatePtBr } from "@/lib/utils";
import type { BoardMatchListItem } from "@/services/board-match-service";

interface BoardMatchListCardProps {
  item: BoardMatchListItem;
}

function verdictBadgeVariant(
  veredito: BoardMatchResult["veredito"],
): "success" | "warning" | "destructive" {
  if (veredito === "match") return "success";
  if (veredito === "partial") return "warning";
  return "destructive";
}

export function BoardMatchListCard({ item }: BoardMatchListCardProps) {
  const { analysis, referenceBoardName } = item;
  const result = analysis.result_json as BoardMatchResult | null;
  const photoCount = analysis.board_candidate_photos?.length ?? 0;

  return (
    <Link href={`/compatibility/${analysis.id}`}>
      <Card className="hover:border-white/14">
        <CardContent className="flex items-start gap-4 p-4 md:items-center md:gap-5 md:p-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/08 bg-muted/50">
            <GitCompareArrows
              className="size-5 text-muted-foreground"
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs">
                Compatibilidade
              </Badge>
              {result?.veredito && analysis.status === "done" && (
                <Badge
                  variant={verdictBadgeVariant(result.veredito)}
                  className="text-xs"
                >
                  {BOARD_MATCH_VERDICT_LABELS[result.veredito]}
                </Badge>
              )}
            </div>
            <p className="font-medium">
              {referenceBoardName
                ? `vs. ${referenceBoardName}`
                : "Análise por perfil"}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDatePtBr(analysis.created_at)}
              {photoCount > 0
                ? ` · ${photoCount} foto${photoCount !== 1 ? "s" : ""}`
                : ""}
            </p>
            {result?.pros[0] && analysis.status === "done" && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {result.pros[0]}
              </p>
            )}
          </div>

          <Badge
            variant={
              analysis.status === "done"
                ? "success"
                : analysis.status === "error"
                  ? "destructive"
                  : "info"
            }
            className="shrink-0 self-center"
          >
            {ANALYSIS_STATUS[analysis.status]}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
