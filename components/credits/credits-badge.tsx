import Link from "next/link";
import { Coins } from "lucide-react";
import { formatCreditsLabel } from "@/lib/domain/credits";
import { cn } from "@/lib/utils";

interface CreditsBadgeProps {
  remaining: number;
}

export function CreditsBadge({ remaining }: CreditsBadgeProps) {
  const isEmpty = remaining < 1;

  return (
    <Link
      href={isEmpty ? "/planos" : "/dashboard"}
      aria-label={`${formatCreditsLabel(remaining)} restantes`}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
        isEmpty
          ? "bg-destructive/12 text-destructive hover:bg-destructive/20"
          : "bg-primary/12 text-primary hover:bg-primary/20",
      )}
    >
      <Coins className="size-3.5" aria-hidden />
      {formatCreditsLabel(remaining)}
    </Link>
  );
}
