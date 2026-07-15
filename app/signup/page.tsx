import { AuthLayout } from "@/components/auth/auth-layout";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <AuthLayout
      eyebrow="Comece agora"
      title="Crie sua conta"
      description="Cadastre-se para analisar suas sessions e receber feedback técnico por IA."
    >
      <SignUpForm />
    </AuthLayout>
  );
}
