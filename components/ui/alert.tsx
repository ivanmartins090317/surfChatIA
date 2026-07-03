import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = {
  default: "border-border bg-card text-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
} as const;

const alertIcons = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  info: Info,
} as const;

interface AlertProps extends React.ComponentProps<"div"> {
  variant?: keyof typeof alertVariants;
}

function Alert({ className, variant = "default", children, ...props }: AlertProps) {
  const Icon = alertIcons[variant];
  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 rounded-lg border p-4 text-sm",
        alertVariants[variant],
        className,
      )}
      {...props}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
