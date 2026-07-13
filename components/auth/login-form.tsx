"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInAction } from "@/actions/auth-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const authCallbackError = searchParams.get("error") === "auth_callback";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (result && !result.success) {
        setError(result.error ?? "Erro ao entrar.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {resetSuccess && (
        <Alert variant="success">
          <AlertDescription>
            Senha atualizada com sucesso. Faça login com a nova senha.
          </AlertDescription>
        </Alert>
      )}
      {authCallbackError && (
        <Alert variant="destructive">
          <AlertDescription>
            Link inválido ou expirado. Solicite um novo link em &quot;Esqueci minha
            senha&quot;.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@email.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Esqueci minha senha
        </Link>
        {" · "}
        <Link href="/signup" className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
