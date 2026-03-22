"use client";

import { useEffect, useState } from "react";
import { FamilyEmojiPicker } from "@/components/FamilyEmojiPicker";
import { useFamilyData } from "@/components/FamilyDataProvider";
import type { FamilyMember } from "@/lib/types/fhe";

export default function FamiliaPage() {
  const { members, lastName, updateFamily } = useFamilyData();
  const [name, setName] = useState("");
  const [newEmoji, setNewEmoji] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState<string | undefined>(undefined);
  const [familyLastName, setFamilyLastNameInput] = useState("");
  const [lastNameSavedMsg, setLastNameSavedMsg] = useState(false);
  const [lastNameError, setLastNameError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFamilyLastNameInput(lastName);
  }, [lastName]);

  async function persistMembers(next: FamilyMember[]) {
    setBusy(true);
    try {
      await updateFamily({ members: next });
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const next: FamilyMember[] = [
      ...members,
      {
        id: crypto.randomUUID(),
        name: n,
        ...(newEmoji ? { emoji: newEmoji } : {}),
      },
    ];
    await persistMembers(next);
    setName("");
    setNewEmoji(undefined);
  }

  function startEdit(m: FamilyMember) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditEmoji(m.emoji);
  }

  async function saveEdit() {
    if (!editingId) return;
    const n = editName.trim();
    if (!n) return;
    const next = members.map((m) => {
      if (m.id !== editingId) return m;
      const rest = { ...m };
      delete rest.emoji;
      return {
        ...rest,
        name: n,
        ...(editEmoji ? { emoji: editEmoji } : {}),
      };
    });
    await persistMembers(next);
    setEditingId(null);
  }

  async function remove(id: string) {
    if (members.length <= 1) {
      alert(
        "Debe haber al menos un integrante en la familia. Añade otro antes de borrar este.",
      );
      return;
    }
    if (!confirm("¿Eliminar este miembro de la lista?")) return;
    const next = members.filter((m) => m.id !== id);
    await persistMembers(next);
    if (editingId === id) setEditingId(null);
  }

  async function saveFamilyLastName(e: React.FormEvent) {
    e.preventDefault();
    const t = familyLastName.trim();
    if (!t) {
      setLastNameError("Los apellidos no pueden quedar vacíos.");
      return;
    }
    setLastNameError("");
    setBusy(true);
    try {
      await updateFamily({ lastName: t });
      setLastNameSavedMsg(true);
      setTimeout(() => setLastNameSavedMsg(false), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Familia</h1>
        <p className="mt-2 text-sm text-muted">
          Apellidos e integrantes se guardan en la base de datos, ligados a tu
          familia. Las agendas del histórico conservan los nombres tal como
          estaban al guardarlas. Debe haber{" "}
          <strong className="text-foreground">al menos un integrante</strong>.
        </p>
      </div>

      <form
        onSubmit={saveFamilyLastName}
        className="rounded-xl border border-border bg-card p-4"
      >
        <label
          htmlFor="familia-apellidos"
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          Apellidos de la familia
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="familia-apellidos"
            value={familyLastName}
            onChange={(e) => {
              setFamilyLastNameInput(e.target.value);
              setLastNameError("");
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2"
            placeholder="Ej. Pérez López"
            autoComplete="family-name"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
          >
            Guardar apellidos
          </button>
        </div>
        {lastNameError ? (
          <p className="mt-2 text-xs text-foreground">{lastNameError}</p>
        ) : null}
        {lastNameSavedMsg ? (
          <p className="mt-2 text-xs text-muted">Guardado.</p>
        ) : null}
      </form>

      <form
        onSubmit={add}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
          <label htmlFor="member-name" className="text-xs font-medium text-muted">
            Nombre
          </label>
          <input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="w-full rounded-lg border border-border bg-card px-3 py-2"
            disabled={busy}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">Emoji (opcional)</span>
          <FamilyEmojiPicker value={newEmoji} onChange={setNewEmoji} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      <ul className="space-y-2">
        {members.length === 0 ? (
          <li className="text-sm text-muted">Aún no hay miembros.</li>
        ) : (
          members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              {editingId === m.id ? (
                <>
                  <FamilyEmojiPicker
                    value={editEmoji}
                    onChange={setEditEmoji}
                    triggerLabel="Emoji"
                  />
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="min-w-[140px] flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    disabled={busy}
                    className="text-sm font-medium text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-sm text-muted"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  {m.emoji ? (
                    <span className="text-2xl leading-none" aria-hidden>
                      {`${m.emoji}\u00A0`}
                    </span>
                  ) : null}
                  <span className="flex-1 font-medium text-foreground">
                    {m.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    disabled={busy}
                    className="text-sm font-medium text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(m.id)}
                    disabled={busy}
                    className="text-sm text-muted underline decoration-neutral-400 underline-offset-2 hover:text-foreground dark:decoration-neutral-500"
                  >
                    Borrar
                  </button>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
