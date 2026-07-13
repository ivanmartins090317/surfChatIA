import { AppShellClient } from "@/components/layout/app-shell-client";
import { requireAuthUser } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  const profile = await getProfile(user.id).catch(() => null);
  const email = user.email ?? "";
  const displayName = profile?.display_name?.trim() || email.split("@")[0] || "Surfista";

  return (
    <AppShellClient displayName={displayName} email={email}>
      {children}
    </AppShellClient>
  );
}
