"use client";

import { useState } from "react";
import { FamilyEmojiPicker } from "@/components/FamilyEmojiPicker";
import { useFamilyData } from "@/components/FamilyDataProvider";
import { Header } from "@/components/Header";
import { OfflineStatusBanner } from "@/components/OfflineStatusBanner";
import type { FamilyMember } from "@/lib/types/fhe";

export function FamilyOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    loading,
    familyId,
    lastName,
    members,
    createFamilyWithLastName,
    setMembersAfterOnboarding,
    error,
  } = useFamilyData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted">
        Cargando…
      </div>
    );
  }

  const blockingNoFamily = !familyId;
  const blockingNoMembers = Boolean(familyId && members.length === 0);

  if (blockingNoFamily) {
    return (
      <LastNameScreen
        errorBanner={error}
        onSaved={async (ln) => {
          await createFamilyWithLastName(ln);
        }}
      />
    );
  }

  if (blockingNoMembers) {
    return (
      <FirstMemberScreen
        familyLastName={lastName.trim()}
        errorBanner={error}
        onSaved={async (m) => {
          await setMembersAfterOnboarding([m]);
        }}
      />
    );
  }

  return (
    <>
      <OfflineStatusBanner />
      {error ? (
        <p className="mx-auto max-w-2xl px-4 pt-4 text-center text-sm text-amber-800 dark:text-amber-200">
          {error}
        </p>
      ) : null}
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </>
  );
}

function LastNameScreen({
  onSaved,
  errorBanner,
}: {
  onSaved: (lastName: string) => Promise<void>;
  errorBanner: string | null;
}) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t) {
      setErr("Escribe los apellidos de tu familia.");
      return;
    }
    setErr("");
    setPending(true);
    try {
      await onSaved(t);
    } catch {
      setErr("No se pudo guardar. Comprueba que MongoDB esté configurado (MONGODB_URI).");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted">
            Noche de Hogar
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Antes de empezar
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Indica los <strong className="text-foreground">apellidos de tu familia</strong>{" "}
            (identificador del hogar). Los datos se guardan en la base de datos
            enlazados a tu familia.
          </p>
        </div>

        {errorBanner ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            {errorBanner}
          </p>
        ) : null}

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border-2 border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="family-lastname"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Apellidos de la familia
            </label>
            <input
              id="family-lastname"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setErr("");
              }}
              placeholder="Ej. Pérez, García López…"
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground"
              autoComplete="family-name"
              autoFocus
            />
            {err ? (
              <p className="mt-2 text-sm text-foreground">{err}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FirstMemberScreen({
  familyLastName,
  onSaved,
  errorBanner,
}: {
  familyLastName: string;
  onSaved: (member: FamilyMember) => Promise<void>;
  errorBanner: string | null;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setErr("Añade al menos un integrante con nombre.");
      return;
    }
    setErr("");
    const member: FamilyMember = {
      id: crypto.randomUUID(),
      name: n,
      ...(emoji ? { emoji } : {}),
    };
    setPending(true);
    try {
      await onSaved(member);
    } catch {
      setErr("No se pudo guardar. Revisa la conexión y MongoDB.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted">
            Familia {familyLastName}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            Primer integrante
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Necesitas <strong className="text-foreground">al menos una persona</strong>{" "}
            en la lista para planificar roles. Luego podrás añadir más en{" "}
            <strong className="text-foreground">Familia</strong>.
          </p>
        </div>

        {errorBanner ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            {errorBanner}
          </p>
        ) : null}

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border-2 border-border bg-card p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="first-member-name"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Nombre
            </label>
            <input
              id="first-member-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              placeholder="Ej. Mamá, Papá, Ana…"
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground"
              autoComplete="name"
              autoFocus
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">
              Emoji (opcional)
            </span>
            <FamilyEmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          {err ? (
            <p className="text-sm text-foreground">{err}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
