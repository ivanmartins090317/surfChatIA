import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthUser } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await requireAuthUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    return (
      <p className="text-muted-foreground">
        Perfil não encontrado. Tente sair e entrar novamente.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Seu perfil</h1>
        <p className="mt-1 text-muted-foreground">
          Dados usados nas análises de performance e prancha.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do surfista</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
