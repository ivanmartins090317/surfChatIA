import { BoardMatchForm } from "@/components/board-spec/board-match-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { requireAuthUser } from "@/lib/supabase/server";
import { listMagicBoards } from "@/services/board-service";

export const metadata = { title: "Compatibilidade de prancha" };

export default async function CompatibilityNewPage() {
  const user = await requireAuthUser();
  const magicBoards = await listMagicBoards(user.id).catch(() => []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/compatibility">← Match</Link>
      </Button>
      <div>
        <h1 className="font-display text-3xl font-bold">Compatibilidade</h1>
        <p className="mt-1 text-muted-foreground">
          Compare uma prancha candidata com seu perfil e prancha mágica.
        </p>
      </div>
      <BoardMatchForm magicBoards={magicBoards.filter((b) => b.status === "ready")} />
    </div>
  );
}
