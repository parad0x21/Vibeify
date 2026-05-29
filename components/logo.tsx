import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-7 w-7 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)]">
        <span className="font-display text-[13px] font-semibold leading-none text-[var(--color-accent)]">
          V
        </span>
      </div>
      <span className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
        vibeify
      </span>
    </div>
  );
}
