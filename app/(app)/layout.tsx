import { AppShellClient } from "@/components/layout/app-shell-client";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShellClient>{children}</AppShellClient>;
}
