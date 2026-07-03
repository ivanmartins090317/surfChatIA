import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            ← Voltar ao login
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold">
            Recuperar senha
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enviaremos um link para redefinir sua senha.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
