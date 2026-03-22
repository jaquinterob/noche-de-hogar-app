"use client";

import { useId, useState } from "react";
import { FAMILY_EMOJI_GROUPS } from "@/lib/family-emojis";

type Props = {
  value: string | undefined;
  onChange: (emoji: string | undefined) => void;
  /** Texto del botón cuando no hay panel abierto */
  triggerLabel?: string;
};

export function FamilyEmojiPicker({
  value,
  onChange,
  triggerLabel = "Elegir emoji",
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xl leading-none" aria-hidden>
          {value || "·"}
        </span>
        <span>{triggerLabel}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-90 cursor-default bg-black/20 dark:bg-black/40"
            aria-label="Cerrar selector de emoji"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            className="absolute left-0 z-100 mt-2 max-h-[min(70vh,420px)] w-[min(100vw-2rem,320px)] overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-lg"
            role="listbox"
            aria-label="Emojis de familia"
          >
            <div className="mb-2 flex flex-wrap gap-2 border-b border-border pb-2">
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-muted/50 hover:text-foreground"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                Sin emoji
              </button>
            </div>
            {FAMILY_EMOJI_GROUPS.map((group, rowIndex) => (
              <div
                key={rowIndex}
                className="mb-3 border-b border-border/60 pb-3 last:mb-0 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap gap-1">
                  {group.emojis.map((emoji) => {
                    const selected = value === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-2xl leading-none transition-colors hover:bg-muted/60 ${
                          selected
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-card"
                            : ""
                        }`}
                        title={emoji}
                        onClick={() => {
                          onChange(emoji);
                          setOpen(false);
                        }}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
