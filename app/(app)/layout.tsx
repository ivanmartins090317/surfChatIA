import { AppShellClient } from "@/components/layout/app-shell-client";
import { toCreditsSnapshot } from "@/lib/domain/credits";
import { requireAuthUser } from "@/lib/supabase/server";
import { getProfile } from "@/services/profile-service";
import { getCreditsSnapshot } from "@/services/usage-service";

/** Análises IA + ffmpeg podem levar até ~60s — requer Vercel Pro. */
export const maxDuration = 60;

const EMPTY_CREDITS = toCreditsSnapshot({
  plan: "free",
  freeQuotaGranted: false,
  creditsPeriodUsed: 0,
  creditsBalance: 0,
});

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuthUser();
  const [profile, credits] = await Promise.all([
    getProfile(user.id).catch(() => null),
    getCreditsSnapshot(user.id).catch(() => EMPTY_CREDITS),
  ]);
  const email = user.email ?? "";
  const displayName =
    profile?.display_name?.trim() || email.split("@")[0] || "Surfista";

  return (
    <AppShellClient
      displayName={displayName}
      email={email}
      creditsRemaining={credits.remaining}
    >
      {children}
    </AppShellClient>
  );
}
