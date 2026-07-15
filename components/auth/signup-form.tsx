"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { signUpAction } from "@/actions/auth-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (!result.success) {
        setError(result.error ?? "Erro ao criar conta.");
        return;
      }
      setSuccess(
        "Conta criada! Verifique seu e-mail (se confirmado no Supabase) e faça login.",
      );
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6" aria-busy={isPending}>
      {error && (
        <Alert id="signup-error" variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-3">
        <Label htmlFor="display_name" className="text-foreground">
          Nome <span className="text-primary" aria-hidden>*</span>
        </Label>
        <Input
          id="display_name"
          name="display_name"
          required
          minLength={2}
          autoComplete="name"
          placeholder="Seu nome"
          className="h-12"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signup-error" : undefined}
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="email" className="text-foreground">
          E-mail <span className="text-primary" aria-hidden>*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          className="h-12"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signup-error" : undefined}
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="password" className="text-foreground">
          Senha <span className="text-primary" aria-hidden>*</span>
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-12"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signup-error" : undefined}
        />
        <p className="text-sm text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Criando…
          </>
        ) : (
          "Criar conta"
        )}
      </Button>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:glow-focus"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
