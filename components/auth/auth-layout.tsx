import Link from "next/link";
import { Activity } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

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

function WaveMesh() {
  const waveLines = Array.from({ length: 18 }, (_, index) => index);

  return (
    <svg
      viewBox="0 0 760 620"
      className="absolute inset-x-0 bottom-0 h-[78%] w-full text-secondary"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="wave-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.48" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#wave-fade)" strokeWidth="1">
        {waveLines.map((line) => (
          <path
            key={line}
            d="M-80 350C70 175 165 530 320 350S570 180 840 380"
            transform={`translate(0 ${line * 14 - 105})`}
            opacity={0.22 + line * 0.012}
          />
        ))}
      </g>
    </svg>
  );
}

function OceanBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,hsl(var(--secondary)/0.16),transparent_34%),radial-gradient(circle_at_84%_82%,hsl(var(--primary)/0.12),transparent_32%)]" />
      <WaveMesh />
    </div>
  );
}

function VisualPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-white/10 bg-card p-12 lg:flex lg:flex-col">
      <OceanBackdrop />
      <div className="relative z-10">
        <Brand />
      </div>

      <div className="relative z-10 my-auto max-w-lg pb-14">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          Evolução guiada por dados
        </div>
        <p className="font-display text-5xl font-bold leading-[1.08] tracking-[-0.03em] text-balance">
          Sua evolução no surf, analisada por IA
        </p>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
          Transforme cada sessão em feedback técnico para surfar melhor e
          escolher a prancha certa.
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-primary">
          <Activity className="size-4" aria-hidden />
        </span>
        Feedback claro. Decisões mais inteligentes.
      </div>
    </aside>
  );
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background lg:grid lg:place-items-center lg:p-6">
      <OceanBackdrop />

      <section className="relative grid min-h-dvh w-full overflow-hidden lg:min-h-[calc(100dvh-48px)] lg:max-w-[1200px] lg:grid-cols-[1.08fr_0.92fr] lg:rounded-2xl lg:border lg:border-white/10 lg:bg-background lg:shadow-elev-3">
        <VisualPanel />

        <div className="relative flex flex-col justify-center px-4 py-8 sm:px-10 lg:bg-background/80 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-12 lg:hidden">
              <Brand />
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                {eyebrow}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
