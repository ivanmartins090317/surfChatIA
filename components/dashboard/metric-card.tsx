import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  iconSrc: string;
  valueClassName?: string;
}

export function MetricCard({
  label,
  value,
  iconSrc,
  valueClassName,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden p-4">
      {/* <div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-8 z-0 size-28 rounded-full bg-primary/25 blur-xl"
      /> */}
      <CardHeader className="relative z-10 flex-row items-start justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
        <Image
          src={iconSrc}
          alt=""
          aria-hidden
          width={80}
          height={80}
          className="size-30 shrink-0 object-contain absolute right-0 top-0"
        />
      </CardHeader>
      <CardContent className="relative z-10">
        <p
          className={cn(
            "font-display text-4xl font-bold tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
