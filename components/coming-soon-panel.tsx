import { ReactNode } from "react";

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
      <div className="card flex flex-col items-start gap-4 p-10">
        {eyebrow ? (
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1 text-xs text-[var(--color-muted)]">
            {eyebrow}
          </span>
        ) : null}
        <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-text)]">
          {icon}
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">{description}</p>
        </div>
      </div>
    </section>
  );
}
