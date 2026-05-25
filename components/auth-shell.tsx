import { ReactNode } from "react";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Logo />
          <div>
            <h1 className="font-display text-2xl tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
          </div>
        </div>
        <div className="flex justify-center">{children}</div>
      </div>
    </main>
  );
}
