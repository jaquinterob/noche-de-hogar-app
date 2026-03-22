"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getDirectorCues,
  type DirectorCue,
  type ScriptSegment,
} from "@/lib/session-steps";
import { useFamilyData } from "@/components/FamilyDataProvider";
import {
  assigneeNameForCueKey,
  emojiForMemberName,
} from "@/lib/member-emoji";
import {
  withAgendaCompleted,
  withCompletedStepsPatch,
  withSessionStartedIfNeeded,
} from "@/lib/agenda-step-updates";
import type {
  CompletedStepKey,
  CompletedSteps,
  FamilyHomeEvening,
  FamilyMember,
} from "@/lib/types/fhe";

function firstIncompleteIndex(
  cues: DirectorCue[],
  completed: CompletedSteps | undefined,
): number {
  const i = cues.findIndex((c) => !completed?.[c.key]);
  return i >= 0 ? i : 0;
}

const ASSIGNEE_LABEL: Partial<Record<CompletedStepKey, string>> = {
  preside: "Preside",
  conducts: "Dirige",
  welcome: "Bienvenida",
  openingPrayer: "Oración",
  spiritualThought: "Pensamiento",
  mainMessage: "Mensaje",
  activity: "Actividad",
  closingPrayer: "Oración final",
};

/** Línea bajo el título del paso: quién tiene a cargo (emoji en UI). No en “Dirige”: ya va en el header. */
function assigneeLineForSlide(
  key: CompletedStepKey,
  agenda: FamilyHomeEvening,
): { label: string; name: string } | null {
  if (key === "conducts") return null;
  const name = assigneeNameForCueKey(key, agenda);
  if (!name) return null;
  const short = ASSIGNEE_LABEL[key];
  if (!short) return null;
  return { label: `${short}:`, name };
}

export function FHESessionView({ agenda }: { agenda: FamilyHomeEvening }) {
  const router = useRouter();
  const { members, saveAgenda } = useFamilyData();
  const [local, setLocal] = useState(agenda);

  /* Solo al cambiar de agenda (misma pantalla puede actualizar vía saveAgenda). */
  useEffect(() => {
    setLocal(agenda);
  }, [agenda.id]); // eslint-disable-line react-hooks/exhaustive-deps -- sincronizar solo por id

  const cues = useMemo(() => getDirectorCues(local), [local]);
  const planned = local.status === "planned";

  const sessionStartSynced = useRef(false);
  useEffect(() => {
    if (!planned || sessionStartSynced.current) return;
    sessionStartSynced.current = true;
    const next = withSessionStartedIfNeeded(agenda);
    if (next === agenda) return;
    void saveAgenda(next).then((saved) => setLocal(saved));
  }, [planned, agenda, saveAgenda]);

  const conductsEmoji = useMemo(
    () => emojiForMemberName(members, local.conducts),
    [members, local.conducts],
  );
  const conductsName = local.conducts.trim();

  const [currentIndex, setCurrentIndex] = useState(() =>
    firstIncompleteIndex(
      getDirectorCues(agenda),
      agenda.completedSteps,
    ),
  );

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (currentIndex >= cues.length) {
      setCurrentIndex(Math.max(0, cues.length - 1));
    }
  }, [cues.length, currentIndex]);

  const steps = useMemo(() => cues.map((c) => c.key), [cues]);
  const doneCount = steps.filter((k) => local.completedSteps?.[k]).length;
  const total = steps.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 && doneCount === total;

  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const mountedRef = useRef(false);
  const prevAllDoneRef = useRef(allDone);

  useEffect(() => {
    if (!planned) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevAllDoneRef.current = allDone;
      return;
    }
    if (allDone && !prevAllDoneRef.current) {
      setCelebrationOpen(true);
    }
    prevAllDoneRef.current = allDone;
  }, [planned, allDone]);

  const n = cues.length || 1;

  const setCompleted = useCallback(
    (key: CompletedStepKey, checked: boolean) => {
      if (!planned) return;
      let next: FamilyHomeEvening | undefined;
      setLocal((prev) => {
        next = withCompletedStepsPatch(prev, { [key]: checked });
        return next;
      });
      /* saveAgenda actualiza FamilyDataProvider: fuera del updater y tras el commit de este setState. */
      queueMicrotask(() => {
        if (next) void saveAgenda(next).then((saved) => setLocal(saved));
      });
    },
    [planned, saveAgenda],
  );

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, n - 1));
  }, [n]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const hechoAtIndex = useCallback(
    (slideIndex: number) => {
      if (!planned) return;
      const cue = cues[slideIndex];
      if (!cue) return;
      let next: FamilyHomeEvening | undefined;
      setLocal((prev) => {
        if (prev.completedSteps?.[cue.key]) return prev;
        next = withCompletedStepsPatch(prev, { [cue.key]: true });
        return next;
      });
      if (!next) return;
      const toSave = next;
      queueMicrotask(() => {
        void saveAgenda(toSave).then((saved) => setLocal(saved));
      });
      if (slideIndex < n - 1) {
        setCurrentIndex(slideIndex + 1);
      }
    },
    [planned, cues, n, saveAgenda],
  );

  const markReunionRealizada = useCallback(() => {
    void saveAgenda(withAgendaCompleted(local)).then((saved) => {
      setLocal(saved);
      setCelebrationOpen(false);
    });
    router.refresh();
  }, [local, saveAgenda, router]);

  function onFooterMarkClick() {
    if (allDone) {
      setCelebrationOpen(true);
      return;
    }
    if (
      !confirm(
        "Aún faltan momentos sin marcar como hechos. ¿Marcar esta Noche de Hogar como realizada de todos modos? No podrás editarla ni borrarla después.",
      )
    ) {
      return;
    }
    markReunionRealizada();
  }

  const dateShort = new Date(local.date).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const ringR = 15.5;
  const ringC = 2 * Math.PI * ringR;
  const ringDash = (pct / 100) * ringC;

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX;
    if (end == null) return;
    const dx = end - start;
    if (dx < -48) goNext();
    else if (dx > 48) goPrev();
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      <header
        className="sticky z-30 -mx-4 mb-4 space-y-3 border-b border-border bg-background/90 px-4 pt-1 pb-3 backdrop-blur-md dark:bg-background/90"
        style={{ top: "var(--header-sticky-offset)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              Guion del director
            </p>
            <h1 className="mt-0.5 text-lg font-semibold leading-tight tracking-tight text-foreground md:text-xl">
              Noche de Hogar
            </h1>
            <p className="mt-1 text-xs text-muted">{dateShort}</p>
            {conductsName ? (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Dirige
                </span>
                {conductsEmoji ? (
                  <span
                    className="text-lg leading-none"
                    title={conductsName}
                    aria-hidden
                  >
                    {conductsEmoji}
                  </span>
                ) : null}
                <span className="font-medium text-foreground">{conductsName}</span>
              </p>
            ) : null}
          </div>
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center"
            aria-hidden
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle
                cx="18"
                cy="18"
                r={ringR}
                fill="none"
                className="stroke-border"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r={ringR}
                fill="none"
                className="stroke-foreground transition-[stroke-dasharray] duration-700 ease-out dark:stroke-neutral-200"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringC}`}
              />
            </svg>
            <span className="relative text-[11px] font-semibold tabular-nums text-foreground">
              {pct}%
            </span>
          </div>
        </div>

        <div className="relative h-1 overflow-hidden rounded-full bg-border">
          <div
            className="relative h-full overflow-hidden rounded-full"
            style={{ width: `${pct}%` }}
          >
            <div className="h-full w-full rounded-full bg-foreground transition-[width] duration-700 ease-out dark:bg-neutral-200" />
            {pct > 0 && pct < 100 && (
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-white/35 to-transparent dark:via-white/20 animate-seg-bar-shine" />
            )}
          </div>
        </div>
        <p className="text-center text-[11px] tabular-nums text-muted">
          Paso {currentIndex + 1} de {total} · {doneCount} hechos
        </p>
      </header>

      <p className="mb-3 text-center text-[11px] leading-relaxed text-muted">
        Desliza la tarjeta a los lados o usa las flechas para leer cada momento.
        Para marcarlo listo,{" "}
        <span className="font-medium text-foreground">arrastra el control</span>{" "}
        hasta el final.
      </p>

      {/* Carrusel horizontal: una tarjeta visible */}
      <div
        className="relative touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              width: `${n * 100}%`,
              transform: `translateX(-${(100 / n) * currentIndex}%)`,
            }}
          >
            {cues.map((cue, slideIndex) => (
              <div
                key={cue.key}
                className={`box-border shrink-0 px-3 py-4 sm:px-4 sm:py-5 ${
                  slideIndex !== currentIndex
                    ? "pointer-events-none select-none"
                    : ""
                }`}
                style={{ width: `${100 / n}%` }}
                aria-hidden={slideIndex !== currentIndex}
              >
                <DirectorSlide
                  cue={cue}
                  agenda={local}
                  members={members}
                  planned={planned}
                  checked={!!local.completedSteps?.[cue.key]}
                  onToggleIncomplete={() => setCompleted(cue.key, false)}
                  isLast={slideIndex >= n - 1}
                  onHechoYSiguiente={() => hechoAtIndex(slideIndex)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-30"
            aria-label="Momento anterior"
          >
            ←
          </button>

          <div className="flex max-w-[60%] flex-wrap justify-center gap-1.5">
            {cues.map((cue, i) => (
              <button
                key={cue.key}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-6 bg-foreground dark:bg-neutral-200"
                    : local.completedSteps?.[cue.key]
                      ? "bg-foreground/40 dark:bg-neutral-500"
                      : "bg-border"
                }`}
                aria-label={`Ir al momento ${i + 1}: ${cue.phaseLabel}`}
                aria-current={i === currentIndex ? "step" : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= n - 1}
            className="min-h-11 min-w-11 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-30"
            aria-label="Siguiente momento"
          >
            →
          </button>
        </div>
      </div>

      <footer className="mt-8 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/agenda/${local.id}`}
          className="text-center text-xs text-muted transition-colors hover:text-foreground sm:text-left"
        >
          ← Agenda
        </Link>
        {planned ? (
          <button
            type="button"
            onClick={onFooterMarkClick}
            className="rounded-md border border-foreground bg-foreground px-4 py-2 text-xs font-medium text-background transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-950"
          >
            Marcar reunión realizada
          </button>
        ) : (
          <p className="text-center text-xs text-muted sm:text-right">
            Solo lectura
          </p>
        )}
      </footer>

      {celebrationOpen && planned && (
        <NocheCompletadaModal
          onMarkRealizada={markReunionRealizada}
          onContinueGuion={() => setCelebrationOpen(false)}
        />
      )}
    </div>
  );
}

function NocheCompletadaModal({
  onMarkRealizada,
  onContinueGuion,
}: {
  onMarkRealizada: () => void;
  onContinueGuion: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onContinueGuion();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinueGuion]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] dark:bg-black/65"
        aria-label="Cerrar"
        onClick={onContinueGuion}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fhe-celebration-title"
        aria-describedby="fhe-celebration-desc"
        className="animate-seg-complete-banner relative z-10 w-full max-w-md rounded-2xl border-2 border-border bg-card p-5 shadow-xl sm:p-6"
      >
        <h2
          id="fhe-celebration-title"
          className="text-center text-lg font-bold tracking-tight text-foreground sm:text-xl"
        >
          ¡Noche de Hogar completa!
        </h2>
        <p
          id="fhe-celebration-desc"
          className="mt-3 text-center text-sm leading-relaxed text-muted"
        >
          Completaste <span className="font-medium text-foreground">todos</span>{" "}
          los momentos del guion. ¿Quieres{" "}
          <span className="font-medium text-foreground">
            marcar esta reunión como realizada
          </span>{" "}
          en la app? Quedará en tu historial y ya no podrás editarla ni borrarla.
        </p>
        <p className="mt-2 text-center text-xs leading-relaxed text-muted">
          Si aún van a seguir compartiendo, orando o charlando juntos, puedes
          elegir seguir aquí y marcarla como realizada cuando terminen. El guion
          sigue disponible para leer.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={onMarkRealizada}
            className="min-h-11 w-full rounded-xl border-2 border-foreground bg-foreground px-4 py-2.5 text-sm font-semibold text-background sm:min-w-[200px] dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-950"
          >
            Sí, marcar como realizada
          </button>
          <button
            type="button"
            onClick={onContinueGuion}
            className="min-h-11 w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground sm:min-w-[180px]"
          >
            Seguir con la noche / revisar guion
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted">
          Puedes usar &quot;Marcar reunión realizada&quot; en la parte inferior
          cuando quieras.
        </p>
      </div>
    </div>
  );
}

const SLIDE_KNOB = 52;
const SLIDE_PAD = 6;
const SLIDE_THRESHOLD = 0.72;

function SlideToHecho({
  onComplete,
  isLast,
}: {
  onComplete: () => void;
  isLast: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const maxXRef = useRef(0);
  const xRef = useRef(0);
  const draggingRef = useRef(false);
  const dragOriginX = useRef(0);
  const dragOriginOffset = useRef(0);

  const [maxX, setMaxX] = useState(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const m = Math.max(0, w - SLIDE_KNOB - SLIDE_PAD * 2);
    maxXRef.current = m;
    setMaxX(m);
    if (xRef.current > m) {
      xRef.current = m;
      setX(m);
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const progress = maxX > 0 ? x / maxX : 0;

  function endDrag() {
    draggingRef.current = false;
    setDragging(false);
    const m = maxXRef.current;
    const cx = xRef.current;
    if (m > 0 && cx >= m * SLIDE_THRESHOLD) {
      onComplete();
    }
    xRef.current = 0;
    setX(0);
  }

  return (
    <div className="space-y-1">
      <div
        ref={trackRef}
        className="relative h-[3.4rem] w-full touch-none select-none overflow-hidden rounded-full border-2 border-border bg-linear-to-r from-card via-card to-muted/25 dark:to-muted/15"
      >
        <div
          className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-foreground/10 transition-[width] dark:bg-white/10"
          style={{
            width: Math.max(0, SLIDE_PAD + x + SLIDE_KNOB * 0.4),
            transitionDuration: dragging ? "0ms" : "200ms",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center pr-16"
          aria-hidden
        >
          <span
            className={`text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted transition-opacity duration-200 ${
              progress > 0.2 ? "opacity-20" : "opacity-100"
            }`}
          >
            {isLast ? "Desliza → listo" : "Desliza → hecho"}
          </span>
        </div>
        <button
          type="button"
          className={`absolute top-1 bottom-1 flex w-[52px] items-center justify-center rounded-full border-2 border-foreground/25 bg-background text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/30 dark:shadow-[0_4px_18px_rgba(0,0,0,0.45)] ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          } ${!dragging ? "motion-safe:animate-seg-slide-glow" : ""}`}
          style={{
            left: SLIDE_PAD,
            transform: `translateX(${x}px)`,
            transition: dragging
              ? "none"
              : "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          aria-label={
            isLast
              ? "Arrastra hasta el final para marcar este último momento como hecho"
              : "Arrastra hasta el final para marcar hecho y pasar al siguiente. También puedes pulsar Intro o Espacio."
          }
          onPointerDown={(e) => {
            e.preventDefault();
            draggingRef.current = true;
            setDragging(true);
            dragOriginX.current = e.clientX;
            dragOriginOffset.current = xRef.current;
            (e.currentTarget as HTMLButtonElement).setPointerCapture(
              e.pointerId,
            );
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current) return;
            const dx = e.clientX - dragOriginX.current;
            const next = Math.max(
              0,
              Math.min(maxXRef.current, dragOriginOffset.current + dx),
            );
            xRef.current = next;
            setX(next);
          }}
          onPointerUp={(e) => {
            try {
              (e.currentTarget as HTMLButtonElement).releasePointerCapture(
                e.pointerId,
              );
            } catch {
              /* ignore */
            }
            endDrag();
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
            setDragging(false);
            xRef.current = 0;
            setX(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onComplete();
            }
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-muted">
        Mantén pulsado el círculo y deslízalo hasta el extremo derecho.
      </p>
    </div>
  );
}

function HechoCheckboxRow({
  isLast,
  onContinue,
}: {
  isLast: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-linear-to-br from-card to-muted/20 px-3 py-3 dark:to-muted/10 sm:gap-4 sm:px-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-foreground bg-foreground text-background motion-safe:animate-seg-check-pop dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-950"
        aria-hidden
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Listo</p>
        <p className="text-xs text-muted">
          {isLast
            ? "Último momento de la noche."
            : "Pasa al siguiente cuando quieras."}
        </p>
      </div>
      {!isLast ? (
        <button
          type="button"
          onClick={onContinue}
          className="shrink-0 rounded-full border-2 border-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] dark:border-neutral-200 dark:text-neutral-100"
        >
          Siguiente
        </button>
      ) : (
        <span className="shrink-0 text-xs font-medium text-muted">Fin</span>
      )}
    </div>
  );
}

function ScriptParagraph({
  cueId,
  segments,
  members,
  /** Si ya mostramos emoji+nombre arriba (línea a cargo), no repetir en el guion. */
  omitEmojiForName,
}: {
  cueId: string;
  segments: ScriptSegment[];
  members: FamilyMember[];
  omitEmojiForName?: string | null;
}) {
  const omit = omitEmojiForName?.trim() ?? "";
  return (
    <p
      id={`script-${cueId}`}
      className="text-balance text-left text-base leading-relaxed sm:text-[1.05rem]"
    >
      {segments.map((seg, i) => {
        const t = seg.text.trim();
        const skipEmoji =
          !!omit && !!t && t === omit;
        const memberEmoji =
          seg.emphasize && t && !skipEmoji
            ? emojiForMemberName(members, seg.text)
            : undefined;
        return (
          <span
            key={i}
            className={
              seg.emphasize
                ? "font-semibold text-foreground underline decoration-neutral-400/70 decoration-1 underline-offset-[3px] dark:decoration-neutral-500"
                : "text-foreground/85"
            }
          >
            {memberEmoji ? (
              <span
                className="mr-1 inline-block align-text-bottom text-[1.2em] leading-none"
                aria-hidden
              >
                {memberEmoji}
              </span>
            ) : null}
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

function DirectorSlide({
  cue,
  agenda,
  members,
  planned,
  checked,
  onToggleIncomplete,
  isLast,
  onHechoYSiguiente,
}: {
  cue: DirectorCue;
  agenda: FamilyHomeEvening;
  members: FamilyMember[];
  planned: boolean;
  checked: boolean;
  onToggleIncomplete: () => void;
  isLast: boolean;
  onHechoYSiguiente: () => void;
}) {
  const assignee = assigneeLineForSlide(cue.key, agenda);
  const assigneeEmoji = assignee
    ? emojiForMemberName(members, assignee.name)
    : undefined;

  return (
    <article
      className="mx-auto flex max-h-[min(68vh,540px)] min-h-0 max-w-md flex-col"
      aria-labelledby={`script-${cue.key}`}
    >
      <p className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
        {cue.phaseLabel}
      </p>
      {assignee ? (
        <p className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
          <span className="text-muted">{assignee.label}</span>
          {assigneeEmoji ? (
            <span className="text-xl leading-none" aria-hidden>
              {assigneeEmoji}
            </span>
          ) : null}
          <span className="font-semibold text-foreground">{assignee.name}</span>
        </p>
      ) : null}

      <div className="mt-2 min-h-0 max-h-[min(36vh,260px)] shrink overflow-y-auto overscroll-y-contain pr-1 [scrollbar-gutter:stable]">
        <ScriptParagraph
          cueId={cue.key}
          segments={cue.segments}
          members={members}
          omitEmojiForName={assignee ? assignee.name : null}
        />
      </div>

      <div className="mt-3 shrink-0 space-y-3 border-t border-border pt-3">
        {cue.hymnUrl ? (
          <a
            href={cue.hymnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30 sm:text-sm"
          >
            Abrir himno ↗
          </a>
        ) : null}

        {planned ? (
          <div className="flex flex-col gap-3">
            {checked ? (
              <HechoCheckboxRow
                isLast={isLast}
                onContinue={onHechoYSiguiente}
              />
            ) : (
              <SlideToHecho onComplete={onHechoYSiguiente} isLast={isLast} />
            )}
            {checked ? (
              <button
                type="button"
                onClick={onToggleIncomplete}
                className="text-center text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                Deshacer este paso
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
