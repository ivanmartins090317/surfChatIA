import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Bem-vindo de volta"
      title="Entre na sua conta"
      description="Continue acompanhando sua evolução dentro e fora d'água."
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-xl bg-muted/50 motion-reduce:animate-none" />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
