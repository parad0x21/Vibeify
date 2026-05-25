import { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  return <AppShell appId={appId}>{children}</AppShell>;
}
