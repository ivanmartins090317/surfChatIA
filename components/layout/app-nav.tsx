import Link from "next/link";
import {
  Activity,
  GitCompareArrows,
  Home,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/analyses", label: "Análises", icon: Activity },
  { href: "/boards", label: "Pranchas", icon: Sparkles },
  { href: "/compatibility/new", label: "Match", icon: GitCompareArrows },
  { href: "/profile", label: "Perfil", icon: User },
] as const;

interface AppNavProps {
  pathname: string;
}

export function AppNav({ pathname }: AppNavProps) {
  return (
    <>
      <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card lg:p-6">
        <Link href="/dashboard" className="mb-8 font-display text-xl font-bold">
          Surf AI Coach
        </Link>
        <div className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-2 border-primary bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav
        className="glass fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-lg items-center justify-around rounded-full px-2 py-2 shadow-elev-3 lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Navegação principal"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2 text-[10px] font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
