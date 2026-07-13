import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="grad-ocean grad-surface-glow hidden flex-col justify-center p-12 lg:flex">
        <Link href="/" className="font-display text-2xl font-bold">
          Surf AI Coach
        </Link>
        <h1 className="mt-12 font-display text-4xl font-bold">
          Sua evolução no surf, analisada por IA
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Entre para analisar sessions, cadastrar sua prancha mágica e comparar
          novas opções.
        </p>
      </div>
      <div className="flex flex-col justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <Link href="/" className="font-display text-xl font-bold">
              Surf AI Coach
            </Link>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse sua conta para continuar.
            </p>
          </div>
          <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
