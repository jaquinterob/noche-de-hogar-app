"use client";

import { useCallback, useEffect, useState } from "react";
import { FamilyEmojiPicker } from "@/components/FamilyEmojiPicker";
import { getMembers, setMembers } from "@/lib/storage";
import type { FamilyMember } from "@/lib/types/fhe";

export default function FamiliaPage() {
  const [members, setMembersState] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [newEmoji, setNewEmoji] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    setMembersState(getMembers());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function add(e: React.FormEvent) {
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
    setMembers(next);
    setMembersState(next);
    setName("");
    setNewEmoji(undefined);
  }

  function startEdit(m: FamilyMember) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditEmoji(m.emoji);
  }

  function saveEdit() {
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
    setMembers(next);
    setMembersState(next);
    setEditingId(null);
  }

  function remove(id: string) {
    if (!confirm("¿Eliminar este miembro de la lista?")) return;
    const next = members.filter((m) => m.id !== id);
    setMembers(next);
    setMembersState(next);
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Familia</h1>
        <p className="mt-2 text-sm text-muted">
          Los miembros se guardan solo en este navegador. Las agendas ya
          creadas conservan los nombres tal como estaban al guardarlas.
        </p>
      </div>

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
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">Emoji (opcional)</span>
          <FamilyEmojiPicker value={newEmoji} onChange={setNewEmoji} />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
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
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
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
                    className="text-sm font-medium text-foreground underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
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
