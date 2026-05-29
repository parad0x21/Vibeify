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
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] p-10 shadow-[var(--shadow-1)]">
        <div className="relative flex flex-col items-start gap-4">
          {eyebrow ? (
            <Badge tone="accent" size="sm" dot>
              {eyebrow}
            </Badge>
          ) : null}
          <div className="relative grid h-11 w-11 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] text-[var(--color-accent)]">
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
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]">
            <Lock className="h-3 w-3" />
            Locked — coming soon
          </div>
        </div>
      </div>
    </section>
  );
}
