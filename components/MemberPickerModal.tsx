"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { FamilyMember } from "@/lib/types/fhe";

type Props = {
  members: FamilyMember[];
  value: string;
  onChange: (name: string) => void;
  /** Título del modal (suele coincidir con la pregunta del paso). */
  title: string;
  placeholder?: string;
};

export function MemberPickerModal({
  members,
  value,
  onChange,
  title,
  placeholder = "Elegir miembro de la familia",
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();
  const selected = members.find((m) => m.name.trim() === value.trim());

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full min-h-[3.35rem] items-center gap-3 rounded-xl border-2 border-border bg-background px-4 py-3 text-left transition-colors hover:border-foreground/25 hover:bg-muted/25"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-2xl leading-none shadow-sm"
          aria-hidden
        >
          {selected?.emoji ?? "·"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">
            {value.trim() ? value : placeholder}
          </span>
          <span className="text-xs text-muted">
            {value.trim() ? "Toca para cambiar" : "Abrir lista de la familia"}
          </span>
        </span>
        <svg
          className="h-5 w-5 shrink-0 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-90 bg-black/45 backdrop-blur-[1px] dark:bg-black/65"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="fixed inset-x-3 top-1/2 z-100 flex max-h-[min(78vh,520px)] -translate-y-1/2 flex-col rounded-2xl border-2 border-border bg-card shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[min(100vw-2rem,420px)] sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 id={titleId} className="text-lg font-bold text-foreground">
                {title}
              </h2>
              <p id={descId} className="mt-1 text-xs text-muted">
                Miembros guardados en Familia. Un toque para elegir.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {members.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-muted">
                  No hay miembros.{" "}
                  <Link
                    href="/familia"
                    className="font-medium text-foreground underline underline-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    Añádelos en Familia
                  </Link>
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {members.map((m) => {
                    const active = m.name === value;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onChange(m.name);
                          setOpen(false);
                        }}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                          active
                            ? "border-foreground bg-foreground/5 ring-2 ring-foreground/20 dark:ring-neutral-400/30"
                            : "border-border hover:border-foreground/35 hover:bg-muted/30 active:scale-[0.98]"
                        }`}
                      >
                        <span className="text-[2.35rem] leading-none" aria-hidden>
                          {m.emoji ?? "👤"}
                        </span>
                        <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
              <Link
                href="/familia"
                className="text-sm font-medium text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
                onClick={() => setOpen(false)}
              >
                Editar familia
              </Link>
              <button
                type="button"
                className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
