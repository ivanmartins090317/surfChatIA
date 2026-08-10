"use client";

import { usePathname } from "next/navigation";
import { CreditsBadge } from "@/components/credits/credits-badge";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { SiteFooter } from "@/components/legal/site-footer";
import { AppNav } from "@/components/layout/app-nav";
import { ProfileMenu } from "@/components/layout/profile-menu";

interface AppShellClientProps {
  children: React.ReactNode;
  displayName: string;
  email: string;
  creditsRemaining: number;
}

export function AppShellClient({
  children,
  displayName,
  email,
  creditsRemaining,
}: AppShellClientProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <AppNav pathname={pathname} />
      <header className="sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
        <CreditsBadge remaining={creditsRemaining} />
        <FeedbackDialog />
        <ProfileMenu displayName={displayName} email={email} />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-6 lg:px-8 lg:pt-8">
        {children}
      </main>
      <div className="pb-24 lg:pb-0">
        <SiteFooter variant="app" />
      </div>
    </div>
  );
}
