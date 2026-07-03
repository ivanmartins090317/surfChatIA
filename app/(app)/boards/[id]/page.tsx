import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoardSpecResult, BoardSensation } from "@/lib/domain/types";
import { BOARD_STATUS } from "@/lib/domain/types";
import { requireAuthUser } from "@/lib/supabase/server";
import { getBoard } from "@/services/board-service";

interface BoardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { id } = await params;
  const user = await requireAuthUser();
  const board = await getBoard(user.id, id);

  if (!board) {
    notFound();
  }

  const spec = board.spec_json as BoardSpecResult | null;
  const sensation = board.sensation_json as BoardSensation | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/boards">← Pranchas</Link>
        </Button>
        <Badge variant={board.status === "ready" ? "success" : "info"}>
          {BOARD_STATUS[board.status]}
        </Badge>
      </div>

      <h1 className="font-display text-3xl font-bold">
        {board.name ?? "Prancha mágica"}
      </h1>

      {board.status === "processing" && (
        <Alert variant="info">
          <AlertDescription>Gerando ficha técnica…</AlertDescription>
        </Alert>
      )}

      {board.ai_summary && (
        <Card className="grad-surface-glow">
          <CardHeader>
            <CardTitle>Por que funciona para você</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{board.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {spec && (
        <Card>
          <CardHeader>
            <CardTitle>Ficha técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Shape", spec.shape],
                  ["Rails", spec.rails],
                  ["Fundo", spec.bottom],
                  ["Rabeta", spec.tail],
                  ["Rocker", spec.rocker],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {(board.length_in || board.volume_l) && (
        <Card>
          <CardHeader>
            <CardTitle>Medidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 tabular-nums">
            {board.length_in != null && <span>{board.length_in}&quot; comprimento</span>}
            {board.width_in != null && <span>{board.width_in}&quot; largura</span>}
            {board.thickness_in != null && (
              <span>{board.thickness_in}&quot; espessura</span>
            )}
            {board.volume_l != null && <span>{board.volume_l} L</span>}
          </CardContent>
        </Card>
      )}

      {sensation && (
        <Card>
          <CardHeader>
            <CardTitle>Sensação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            {sensation.mar_pequeno && <p>Mar pequeno: {sensation.mar_pequeno}</p>}
            {sensation.mar_grande && <p>Mar grande: {sensation.mar_grande}</p>}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        {board.photo_paths.length} foto(s) enviada(s)
      </p>
    </div>
  );
}
