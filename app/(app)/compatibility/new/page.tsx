import Link from "next/link";
import { BoardMatchForm } from "@/components/board-spec/board-match-form";
import { MatchMagicGatePanel } from "@/components/board-spec/match-magic-gate-panel";
import {
  MATCH_GATE_KIND,
  resolveInitialReferenceBoardId,
  resolveMatchGate,
} from "@/components/board-spec/match-magic-gate";
import { CreditsSummary } from "@/components/credits/credits-summary";
import { Button } from "@/components/ui/button";
import { requireAuthUser } from "@/lib/supabase/server";
import { listMagicBoards } from "@/services/board-service";
import { getCreditsSnapshot } from "@/services/usage-service";

export const metadata = { title: "Compatibilidade de prancha" };

interface CompatibilityNewPageProps {
  searchParams: Promise<{ board?: string }>;
}

export default async function CompatibilityNewPage({
  searchParams,
}: CompatibilityNewPageProps) {
  const user = await requireAuthUser();
  const { board: preferredBoardId } = await searchParams;
  const [magicBoards, credits] = await Promise.all([
    listMagicBoards(user.id).catch(() => []),
    getCreditsSnapshot(user.id),
  ]);

  const gate = resolveMatchGate(magicBoards);
  const readyBoards = magicBoards.filter((board) => board.status === "ready");
  const initialReferenceBoardId = resolveInitialReferenceBoardId(
    readyBoards,
    preferredBoardId,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/compatibility">← Match</Link>
      </Button>
      <div>
        <h1 className="font-display text-3xl font-bold">Compatibilidade</h1>
        <p className="mt-1 text-muted-foreground">
          Compare uma prancha candidata com sua prancha mágica de referência.
        </p>
      </div>
      <CreditsSummary credits={credits} compact />

      {gate !== MATCH_GATE_KIND.unlocked ? (
        <MatchMagicGatePanel kind={gate} />
      ) : credits.remaining >= 1 ? (
        <BoardMatchForm
          magicBoards={readyBoards}
          initialReferenceBoardId={initialReferenceBoardId}
        />
      ) : null}
    </div>
  );
}
