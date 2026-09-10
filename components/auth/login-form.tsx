"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { signInAction } from "@/actions/auth-actions";
import { BRAND_NAME } from "@/lib/brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  SignupLoginState,
  parseSignupLoginState,
} from "@/lib/auth/signup-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const authCallbackError = searchParams.get("error") === "auth_callback";
  const signupState = parseSignupLoginState(searchParams.get("signup"));
  const prefilledEmail = searchParams.get("email")?.trim() ?? "";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (!result.success || !result.data) {
        setError(result.error ?? "Erro ao entrar.");
        return;
      }
      router.push(result.data.redirectTo);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6" aria-busy={isPending}>
      {signupState === SignupLoginState.CHECK_EMAIL && (
        <Alert variant="info">
          <AlertTitle>Conta criada</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Enviamos um e-mail de confirmação para{" "}
              <strong className="font-semibold text-foreground">
                {prefilledEmail || "o endereço informado no cadastro"}
              </strong>
              . Siga os passos:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Abra a caixa de entrada (e a pasta de <strong>spam</strong> ou{" "}
                <strong>lixo eletrônico</strong>).
              </li>
              <li>
                Clique em <strong>Confirmar e-mail</strong> no e-mail da {BRAND_NAME}.
              </li>
              <li>Voltar à tela de login e entrar com a senha criada no cadastro.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              Não recebeu? Aguarde alguns minutos ou confira se digitou o e-mail certo.
            </p>
          </AlertDescription>
        </Alert>
      )}
      {signupState === SignupLoginState.CONFIRMED && (
        <Alert variant="success">
          <AlertDescription>
            E-mail confirmado. Faça login com a senha que você criou.
          </AlertDescription>
        </Alert>
      )}
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
        <Alert id="login-error" variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
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
          defaultValue={prefilledEmail}
          placeholder="seu@email.com"
          className="h-12"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="password" className="text-foreground">
            Senha <span className="text-primary" aria-hidden>*</span>
          </Label>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center rounded-xs text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:glow-focus"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="h-12"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        Ainda não tem uma conta?{" "}
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center rounded-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:glow-focus"
        >
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
