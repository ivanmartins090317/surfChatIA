"use client";

import { usePathname } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";

interface AppNavClientProps {
  children: React.ReactNode;
}

export function AppShellClient({ children }: AppNavClientProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <AppNav pathname={pathname} />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:ml-64 lg:pb-8 lg:pt-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
