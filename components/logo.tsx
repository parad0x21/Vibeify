import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--color-accent)] text-[var(--color-accent-fg)]">
        <span className="font-display text-sm font-semibold">V</span>
      </div>
      <span className="font-display text-lg tracking-tight">vibeify</span>
    </div>
  );
}
