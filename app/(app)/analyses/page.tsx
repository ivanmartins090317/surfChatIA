import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDatePtBr } from "@/lib/utils";
import { requireAuthUser } from "@/lib/supabase/server";
import { listPerformanceAnalyses } from "@/services/analysis-service";

export const metadata = { title: "Análises" };

export default async function AnalysesPage() {
  const user = await requireAuthUser();
  const analyses = await listPerformanceAnalyses(user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Análises</h1>
          <p className="text-muted-foreground">Histórico de feedback de performance.</p>
        </div>
        <Button asChild>
          <Link href="/analyses/new">
            <Plus className="size-4" aria-hidden />
            Nova
          </Link>
        </Button>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma análise ainda.{" "}
            <Link href="/analyses/new" className="text-primary hover:underline">
              Enviar primeira session
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {analyses.map((analysis) => (
            <li key={analysis.id}>
              <Link href={`/analyses/${analysis.id}`}>
                <Card className="hover:border-white/14">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">Performance</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDatePtBr(analysis.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        analysis.status === "done" ? "success" : "info"
                      }
                    >
                      {analysis.status === "done" ? "Pronto" : analysis.status}
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
