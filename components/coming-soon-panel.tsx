import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ComingSoonPanel({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-panel)] p-10 shadow-[var(--shadow-1)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(500px 240px at 30% 0%, rgba(99,102,241,0.10), transparent 70%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"
        />
        <div className="relative flex flex-col items-start gap-4">
          {eyebrow ? (
            <Badge tone="accent" size="sm" dot>
              {eyebrow}
            </Badge>
          ) : null}
          <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
            />
            {icon}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
              {description}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]">
            <Lock className="h-3 w-3" />
            Locked — coming soon
          </div>
        </div>
      </div>
    </section>
  );
}
