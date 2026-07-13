import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getAuthUser } from "@/lib/supabase/server";

export const metadata = { title: "Nova senha" };

export default async function ResetPasswordPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            ← Voltar ao login
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold">Definir nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha uma senha nova para a conta{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
