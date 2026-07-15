import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, GitCompareArrows, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OceanBackdrop } from "@/components/layout/ocean-backdrop";
import { getAuthUser } from "@/lib/supabase/server";

const HIGHLIGHTS = [
  {
    icon: Activity,
    label: "Feedback técnico de sessions",
  },
  {
    icon: Sparkles,
    label: "Ficha da prancha mágica",
  },
  {
    icon: GitCompareArrows,
    label: "Compatibilidade de prancha",
  },
];

function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-3 rounded-sm font-display text-lg font-bold focus-visible:outline-none focus-visible:glow-focus"
      aria-label="Surf AI Coach — início"
    >
      Surf AI Coach
    </Link>
  );
}

function HighlightRow() {
  return (
    <ul className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      {HIGHLIGHTS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-3 text-sm text-muted-foreground"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <OceanBackdrop />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="px-4 py-6 sm:px-10">
          <Brand />
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:px-10">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Evolução guiada por dados
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-balance md:text-6xl">
            Sua evolução no surf, analisada por IA
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Feedback técnico de sessions, ficha da prancha mágica e
            compatibilidade — tudo em um fluxo simples.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="sm:flex-none">
              <Link href="/signup">Começar grátis</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="sm:flex-none">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>

          <div className="mt-16">
            <HighlightRow />
          </div>
        </div>
      </div>
    </main>
  );
}
