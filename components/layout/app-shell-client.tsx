"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";

interface AppShellClientProps {
  children: React.ReactNode;
  displayName: string;
  email: string;
}

export function AppShellClient({
  children,
  displayName,
  email,
}: AppShellClientProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background lg:pl-64">
      <AppNav pathname={pathname} />
      <header className="sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
        <FeedbackDialog />
        <ProfileMenu displayName={displayName} email={email} />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
