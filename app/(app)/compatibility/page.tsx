import Link from "next/link";
import { Plus } from "lucide-react";
import { BoardMatchListCard } from "@/components/board-spec/board-match-list-card";
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
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthUser } from "@/lib/supabase/server";
import { listBoardMatchAnalyses } from "@/services/board-match-service";
import { listMagicBoards } from "@/services/board-service";

export const metadata = { title: "Match — Compatibilidade" };

export default async function CompatibilityPage() {
  const user = await requireAuthUser();
  const [matches, boards] = await Promise.all([
    listBoardMatchAnalyses(user.id).catch(() => []),
    listMagicBoards(user.id).catch(() => []),
  ]);
  const gate = resolveMatchGate(boards);
  const canCreateMatch = gate === MATCH_GATE_KIND.unlocked;
  const gateCta = getMatchGateCta(gate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Match</h1>
          <p className="text-muted-foreground">
            Histórico de compatibilidade de pranchas — consulte análises
            anteriores a qualquer momento.
          </p>
        </div>
        {canCreateMatch ? (
          <Button asChild className="min-h-[44px]">
            <Link href={buildNewMatchHref()}>
              <Plus className="size-4" aria-hidden />
              Nova
            </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary" className="min-h-[44px]">
            <Link href={gateCta.href}>{gateCta.label}</Link>
          </Button>
        )}
      </div>

      {!canCreateMatch ? (
        <Alert variant="warning">
          <AlertDescription>{getMatchGateMessage(gate)}</AlertDescription>
        </Alert>
      ) : null}

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
            <p>
              {canCreateMatch
                ? MATCH_GATE_COPY.readyNoMatches
                : "Nenhuma análise de compatibilidade ainda."}
            </p>
            {canCreateMatch ? (
              <Button asChild className="min-h-[44px]">
                <Link href={buildNewMatchHref()}>Comparar uma prancha</Link>
              </Button>
            ) : (
              <Button asChild className="min-h-[44px]">
                <Link href={gateCta.href}>{gateCta.label}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {matches.map((item) => (
            <li key={item.analysis.id}>
              <BoardMatchListCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
