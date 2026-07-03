import Link from "next/link";
import { NewAnalysisForm } from "@/components/performance-analysis/new-analysis-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Nova análise" };

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/analyses">← Voltar</Link>
        </Button>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold">Nova análise</h1>
        <p className="mt-1 text-muted-foreground">
          Envie vídeo, imagem ou link da sua session.
        </p>
      </div>
      <NewAnalysisForm />
    </div>
  );
}
