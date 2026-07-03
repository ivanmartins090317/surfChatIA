import Link from "next/link";
import { Activity, Sparkles, UploadCloud } from "lucide-react";
import { signOutAction } from "@/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/utils";
import { requireAuthUser } from "@/lib/supabase/server";
import type { Analysis, PerformanceResult } from "@/lib/domain/types";
import { listPerformanceAnalyses } from "@/services/analysis-service";
import { listMagicBoards } from "@/services/board-service";
import { getProfile, isProfileComplete } from "@/services/profile-service";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAuthUser();
  const [profile, analyses, boards] = await Promise.all([
    getProfile(user.id),
    listPerformanceAnalyses(user.id).catch(() => [] as Analysis[]),
    listMagicBoards(user.id).catch(() => []),
  ]);

  const displayName = profile?.display_name ?? "Surfista";
  const profileComplete = isProfileComplete(profile);
  const doneAnalyses = analyses.filter((a) => a.status === "done");
  const avgScore =
    doneAnalyses.length > 0
      ? Math.round(
          doneAnalyses.reduce((acc, a) => {
            const result = a.result_json as PerformanceResult | null;
            return acc + (result?.score ?? 0);
          }, 0) / doneAnalyses.filter((a) => (a.result_json as PerformanceResult)?.score).length || 1,
        )
      : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo,</p>
          <h1 className="font-display text-3xl font-bold">{displayName}</h1>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      {!profileComplete && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Complete seu perfil para análises de prancha mais precisas.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/profile">Completar perfil</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold tabular-nums">
              {analyses.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Score médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold tabular-nums text-primary">
              {avgScore ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Pranchas mágicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold tabular-nums">
              {boards.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button asChild size="lg" className="h-auto flex-col gap-2 py-6">
          <Link href="/analyses/new">
            <UploadCloud className="size-6" aria-hidden />
            Nova análise de performance
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-auto flex-col gap-2 py-6">
          <Link href="/boards/new">
            <Sparkles className="size-6" aria-hidden />
            Cadastrar prancha mágica
          </Link>
        </Button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-medium">Análises recentes</h2>
          <Link href="/analyses" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        {analyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Activity className="size-10 text-muted-foreground" aria-hidden />
              <p className="text-muted-foreground">
                Nenhuma análise ainda. Envie sua primeira session para receber
                feedback.
              </p>
              <Button asChild>
                <Link href="/analyses/new">Analisar session</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {analyses.slice(0, 5).map((analysis) => (
              <li key={analysis.id}>
                <Link href={`/analyses/${analysis.id}`}>
                  <Card className="transition-colors hover:border-white/14">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">Análise de performance</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDatePtBr(analysis.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          analysis.status === "done"
                            ? "success"
                            : analysis.status === "error"
                              ? "destructive"
                              : "info"
                        }
                      >
                        {analysis.status === "done"
                          ? "Pronto"
                          : analysis.status === "error"
                            ? "Falhou"
                            : "Processando"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
