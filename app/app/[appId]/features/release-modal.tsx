"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const EMOJI_PRESETS = ["🚀", "✨", "🎯", "🎨", "📦", "🔥", "🌟", "💎", "🏁", "🎁", "🛠️", "🧪"];

export function ReleaseModal({
  appId,
  open,
  onClose,
}: {
  appId: Id<"apps">;
  open: boolean;
  onClose: () => void;
}) {
  const create = useMutation(api.releases.create);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [submitting, setSubmitting] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setEmoji(EMOJI_PRESETS[0]);
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await create({ appId, name: name.trim(), emoji });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create release");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New release"
      description="Group features by milestone, version, or theme."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
            {submitting ? "Creating…" : "Create release"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="release-name"
            className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]"
          >
            Name
          </label>
          <Input
            id="release-name"
            placeholder="e.g. v0.1, Public beta, Q3 launch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            autoFocus
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Emoji
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border text-base transition-all duration-150",
                  emoji === e
                    ? "border-[var(--color-accent)] bg-[color:var(--color-accent-soft)] shadow-[0_0_0_1px_var(--color-accent-soft)_inset]"
                    : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-subtle)]",
                )}
              >
                {e}
              </button>
            ))}
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={12}
              aria-label="Custom emoji"
              className="h-9 w-16 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[#0d0d0d] text-center text-base text-[var(--color-text)] outline-none transition-colors hover:border-[var(--color-border-strong)] focus-visible:border-[var(--color-accent)]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
