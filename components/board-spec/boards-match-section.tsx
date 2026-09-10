import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import {
  MATCH_GATE_COPY,
  MATCH_GATE_KIND,
  buildNewMatchHref,
  getMatchGateCta,
  getMatchGateMessage,
  resolveMatchGate,
} from "@/components/board-spec/match-magic-gate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BoardsMatchSectionProps {
  boards: Array<{ id: string; status: string }>;
  hasMatches?: boolean;
}

export function BoardsMatchSection({
  boards,
  hasMatches = false,
}: BoardsMatchSectionProps) {
  const gate = resolveMatchGate(boards);
  const cta = getMatchGateCta(gate);

  if (gate === MATCH_GATE_KIND.unlocked) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitCompareArrows className="size-5" aria-hidden />
            Match
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasMatches
              ? "Compare outra prancha candidata com a sua mágica."
              : MATCH_GATE_COPY.readyNoMatches}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="min-h-[44px]">
              <Link href={buildNewMatchHref()}>
                {hasMatches ? "Comparar outra prancha" : "Fazer Match"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/compatibility">Ver histórico</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompareArrows className="size-5" aria-hidden />
          Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertDescription>{getMatchGateMessage(gate)}</AlertDescription>
        </Alert>
        <Button asChild className="min-h-[44px]">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
