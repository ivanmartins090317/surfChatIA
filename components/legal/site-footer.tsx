import Link from "next/link";
import { DATA_CONTROLLER } from "@/components/legal/controller-placeholder";
import { BRAND_NAME } from "@/lib/brand";

const LEGAL_LINKS = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/reembolso", label: "Reembolso" },
] as const;

interface SiteFooterProps {
  variant: "public" | "app";
}

export function SiteFooter({ variant }: SiteFooterProps) {
  const productLinks =
    variant === "app"
      ? ([
          { href: "/dashboard", label: "Painel" },
          { href: "/planos", label: "Planos" },
          { href: "/profile", label: "Perfil" },
        ] as const)
      : ([
          { href: "/signup", label: "Criar conta" },
          { href: "/login", label: "Entrar" },
          { href: "/planos", label: "Planos" },
        ] as const);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-display text-lg font-bold">{BRAND_NAME}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Feedback técnico de surf e especificação de pranchas com IA.
          </p>
          <p className="text-sm text-muted-foreground">
            Contato:{" "}
            <a
              href={`mailto:${DATA_CONTROLLER.contactEmail}`}
              className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:glow-focus"
            >
              {DATA_CONTROLLER.contactEmail}
            </a>
          </p>
        </div>

        <nav
          aria-label="Rodapé"
          className="grid grid-cols-2 gap-8 sm:grid-cols-2"
        >
          <FooterLinkGroup title="Produto" links={productLinks} />
          <FooterLinkGroup title="Legal" links={LEGAL_LINKS} />
        </nav>
      </div>
      <div className="border-t border-border/40 px-4 py-4 text-center text-xs text-muted-foreground sm:px-8">
        © {new Date().getFullYear()} {DATA_CONTROLLER.tradeName}.{" "}
        {DATA_CONTROLLER.legalName}.
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:glow-focus"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
