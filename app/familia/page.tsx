"use client";

import { useCallback, useEffect, useState } from "react";
import { getMembers, setMembers } from "@/lib/storage";
import type { FamilyMember } from "@/lib/types/fhe";

export default function FamiliaPage() {
  const [members, setMembersState] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
      { id: crypto.randomUUID(), name: n },
    ];
    setMembers(next);
    setMembersState(next);
    setName("");
  }

  function startEdit(m: FamilyMember) {
    setEditingId(m.id);
    setEditName(m.name);
  }

  function saveEdit() {
    if (!editingId) return;
    const n = editName.trim();
    if (!n) return;
    const next = members.map((m) =>
      m.id === editingId ? { ...m, name: n } : m,
    );
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

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-card px-3 py-2"
        />
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
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
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
