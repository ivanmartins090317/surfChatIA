import Link from "next/link";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="font-display text-xl font-bold">
            Surf AI Coach
          </Link>
          <h1 className="mt-8 font-display text-2xl font-bold">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece a analisar suas sessions em minutos.
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
