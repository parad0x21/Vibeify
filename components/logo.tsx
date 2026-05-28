import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30"
        />
        <span className="font-display text-[13px] font-semibold leading-none">V</span>
      </div>
      <span className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
        vibeify
      </span>
    </div>
  );
}
