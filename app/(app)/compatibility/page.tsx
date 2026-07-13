import Link from "next/link";
import { Plus } from "lucide-react";
import { BoardMatchListCard } from "@/components/board-spec/board-match-list-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthUser } from "@/lib/supabase/server";
import { listBoardMatchAnalyses } from "@/services/board-match-service";

export const metadata = { title: "Match — Compatibilidade" };

export default async function CompatibilityPage() {
  const user = await requireAuthUser();
  const matches = await listBoardMatchAnalyses(user.id).catch(() => []);

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
        <Button asChild>
          <Link href="/compatibility/new">
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        </Button>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma análise de compatibilidade ainda.{" "}
            <Link
              href="/compatibility/new"
              className="text-primary hover:underline"
            >
              Comparar uma prancha
            </Link>
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
