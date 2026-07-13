"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:glow-focus"
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={isVisible}
      >
        {isVisible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
