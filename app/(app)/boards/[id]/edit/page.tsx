import Link from "next/link";
import { notFound } from "next/navigation";
import { MagicBoardForm } from "@/components/board-spec/magic-board-form";
import { Button } from "@/components/ui/button";
import { requireAuthUser } from "@/lib/supabase/server";
import { getBoard } from "@/services/board-service";

interface EditBoardPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar prancha" };

export default async function EditBoardPage({ params }: EditBoardPageProps) {
  const { id } = await params;
  const user = await requireAuthUser();
  const board = await getBoard(user.id, id);

  if (!board) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/boards/${board.id}`}>← Voltar à prancha</Link>
      </Button>
      <div>
        <h1 className="font-display text-3xl font-bold">Editar prancha</h1>
        <p className="mt-1 text-muted-foreground">
          Atualize medidas, sensações e fotos da sua prancha mágica.
        </p>
      </div>
      <MagicBoardForm board={board} />
    </div>
  );
}
