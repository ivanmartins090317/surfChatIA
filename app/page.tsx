import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/supabase/server";

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="grad-ocean grad-surface-glow absolute inset-0" aria-hidden />
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Surf Performance & Board AI
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
          Sua evolução no surf, analisada por IA
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Feedback técnico de sessions, ficha da prancha mágica e compatibilidade
          — tudo em um fluxo simples.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="flex-1">
            <Link href="/signup">Começar grátis</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="flex-1">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
