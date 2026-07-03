import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/utils";
import { requireAuthUser } from "@/lib/supabase/server";
import { BOARD_STATUS } from "@/lib/domain/types";
import { listMagicBoards } from "@/services/board-service";

export const metadata = { title: "Pranchas" };

export default async function BoardsPage() {
  const user = await requireAuthUser();
  const boards = await listMagicBoards(user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Prancha mágica</h1>
          <p className="text-muted-foreground">
            Suas pranchas de referência com ficha técnica por IA.
          </p>
        </div>
        <Button asChild>
          <Link href="/boards/new">
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        </Button>
      </div>

      {boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-10 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">
              Cadastre a prancha que funciona melhor para você.
            </p>
            <Button asChild>
              <Link href="/boards/new">Cadastrar prancha mágica</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {boards.map((board) => (
            <li key={board.id}>
              <Link href={`/boards/${board.id}`}>
                <Card className="hover:border-white/14">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">
                        {board.name ?? "Prancha mágica"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDatePtBr(board.created_at)}
                        {board.length_in != null &&
                          ` · ${board.length_in}"`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        board.status === "ready" ? "success" : "info"
                      }
                    >
                      {BOARD_STATUS[board.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
