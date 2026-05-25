"use client";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  STACK_CATEGORY_LABELS,
  STACK_MULTI_SELECT,
  STACK_OPTIONS,
  StackCategory,
  StackSelection,
} from "@/lib/stack-options";

export interface StackPickerProps {
  value: StackSelection;
  onChange: (next: StackSelection) => void;
  highlight?: Partial<Record<StackCategory, string[]>>;
  className?: string;
}

/**
 * Editable chip grid for all 6 stack categories. Builder is single-select
 * (clicking the selected option clears it); everything else is multi-select.
 *
 * `highlight` lets the Stack page render newly-suggested options with a
 * different accent so the user can see what Claude proposed at a glance.
 */
export function StackPicker({ value, onChange, highlight, className }: StackPickerProps) {
  function toggle(category: StackCategory, option: string) {
    if (!STACK_MULTI_SELECT[category]) {
      onChange({
        ...value,
        builder: value.builder === option ? undefined : option,
      });
      return;
    }
    const current = value[category] as string[];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onChange({ ...value, [category]: next });
  }

  function isSelected(category: StackCategory, option: string): boolean {
    if (!STACK_MULTI_SELECT[category]) return value.builder === option;
    return (value[category] as string[]).includes(option);
  }

  function isHighlighted(category: StackCategory, option: string): boolean {
    return highlight?.[category]?.includes(option) ?? false;
  }

  return (
    <div className={cn("space-y-7", className)}>
      {(Object.keys(STACK_OPTIONS) as StackCategory[]).map((cat) => (
        <div key={cat} className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-medium">{STACK_CATEGORY_LABELS[cat]}</div>
            <div className="text-[11px] text-[var(--color-muted)]">
              {STACK_MULTI_SELECT[cat] ? "Pick any" : "Pick one"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK_OPTIONS[cat].map((opt) => (
              <Chip
                key={opt}
                selected={isSelected(cat, opt)}
                onClick={() => toggle(cat, opt)}
                className={cn(
                  isHighlighted(cat, opt) &&
                    !isSelected(cat, opt) &&
                    "border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100",
                )}
              >
                {opt}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
