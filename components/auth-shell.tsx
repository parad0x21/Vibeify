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
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 50% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(700px 500px at 80% 110%, rgba(139,92,246,0.10), transparent 60%)",
        }}
      />
      {/* Grid hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 30%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 30%, black 0%, transparent 80%)",
        }}
      />

      <div className="relative grid min-h-screen place-items-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex flex-col items-center gap-5 text-center">
            <Logo />
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">{subtitle}</p>
            </div>
          </div>
          <div className="flex justify-center">{children}</div>
        </div>
      </div>
    </main>
  );
}
