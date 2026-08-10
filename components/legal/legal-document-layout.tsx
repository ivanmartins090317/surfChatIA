import Link from "next/link";
import { OceanBackdrop } from "@/components/layout/ocean-backdrop";
import { SiteFooter } from "@/components/legal/site-footer";
import { LEGAL_LAST_UPDATED } from "@/components/legal/controller-placeholder";

interface LegalDocumentLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function LegalDocumentLayout({
  title,
  description,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <OceanBackdrop />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="border-b border-border/60 px-4 py-6 sm:px-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-sm font-display text-lg font-bold focus-visible:outline-none focus-visible:glow-focus"
          >
            Surf AI Coach
          </Link>
        </header>

        <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-10">
          <p className="text-sm text-muted-foreground">
            Atualizado em {LEGAL_LAST_UPDATED}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">{description}</p>
          <div className="prose-legal mt-10 space-y-8 text-base leading-relaxed text-foreground/90">
            {children}
          </div>
        </article>

        <SiteFooter variant="public" />
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground/90 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
