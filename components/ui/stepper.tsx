import { cn } from "@/lib/utils";

export interface StepperProps {
  steps: ReadonlyArray<string>;
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, i) => {
        const isActive = i === current;
        const isComplete = i < current;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-[10px] font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-text)] text-[var(--color-accent-fg)]"
                    : isComplete
                      ? "bg-[var(--color-text)]/80 text-[var(--color-accent-fg)]"
                      : "bg-[var(--color-subtle)] text-[var(--color-muted)]",
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive
                    ? "text-[var(--color-text)]"
                    : isComplete
                      ? "text-[var(--color-text)]/70"
                      : "text-[var(--color-muted)]",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "h-px w-10 transition-colors",
                  isComplete ? "bg-[var(--color-text)]/40" : "bg-[var(--color-border)]",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
