"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  withAgendaCompleted,
  withCompletedStepsPatch,
  withSessionStartedIfNeeded,
} from "@/lib/agenda-step-updates";
import { clearFamilyDbId, getFamilyDbId, setFamilyDbId } from "@/lib/family-local-id";
import {
  clearFamilySnapshot,
  readFamilySnapshot,
  writeFamilySnapshot,
} from "@/lib/family-local-cache";
import {
  enqueueDeleteAgenda,
  enqueuePatchFamily,
  enqueueSaveAgenda,
  flushFamilySyncQueue,
  peekFamilySyncQueue,
} from "@/lib/family-sync-queue";
import {
  clearLegacyV1Storage,
  readLegacyFamilyBundle,
} from "@/lib/legacy-local-storage";
import { HymnsOfflineBootstrap } from "@/components/HymnsOfflineBootstrap";
import type {
  CompletedStepKey,
  FamilyHomeEvening,
  FamilyMember,
} from "@/lib/types/fhe";

export type FamilyDataContextValue = {
  familyId: string | null;
  lastName: string;
  members: FamilyMember[];
  agendas: FamilyHomeEvening[];
  loading: boolean;
  error: string | null;
  /** Datos cargados desde copia local (sin red o API no disponible). */
  usingCachedData: boolean;
  /** Hay cambios pendientes de subir a la base de datos. */
  syncPending: boolean;
  /** `silent`: no pone `loading` (evita reacciones en cadena en otras pantallas). */
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  createFamilyWithLastName: (lastName: string) => Promise<void>;
  setMembersAfterOnboarding: (members: FamilyMember[]) => Promise<void>;
  updateFamily: (p: {
    lastName?: string;
    members?: FamilyMember[];
  }) => Promise<void>;
  getAgendaById: (id: string) => FamilyHomeEvening | undefined;
  saveAgenda: (a: FamilyHomeEvening) => Promise<FamilyHomeEvening>;
  deleteAgenda: (id: string) => Promise<void>;
  markAgendaCompleted: (id: string) => Promise<FamilyHomeEvening | null>;
  ensureAgendaSessionStarted: (
    id: string,
  ) => Promise<FamilyHomeEvening | null>;
  updateAgendaCompletedSteps: (
    id: string,
    steps: Partial<Record<CompletedStepKey, boolean>>,
  ) => Promise<FamilyHomeEvening | null>;
};

const FamilyDataContext = createContext<FamilyDataContextValue | null>(null);

export function useFamilyData(): FamilyDataContextValue {
  const c = useContext(FamilyDataContext);
  if (!c) {
    throw new Error("useFamilyData debe usarse dentro de FamilyDataProvider");
  }
  return c;
}

function applySnapshotToState(
  snap: NonNullable<ReturnType<typeof readFamilySnapshot>>,
  setters: {
    setFamilyId: (v: string | null) => void;
    setLastName: (v: string) => void;
    setMembers: (v: FamilyMember[]) => void;
    setAgendas: (v: FamilyHomeEvening[]) => void;
  },
) {
  setters.setFamilyId(snap.familyId);
  setters.setLastName(snap.lastName);
  setters.setMembers(snap.members);
  setters.setAgendas(snap.agendas);
}

export function FamilyDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [lastName, setLastName] = useState("");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [agendas, setAgendas] = useState<FamilyHomeEvening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [syncPending, setSyncPending] = useState(false);

  const familyIdRef = useRef<string | null>(null);
  const agendasRef = useRef<FamilyHomeEvening[]>([]);
  const lastNameRef = useRef("");
  const membersRef = useRef<FamilyMember[]>([]);

  useEffect(() => {
    familyIdRef.current = familyId;
  }, [familyId]);
  useEffect(() => {
    agendasRef.current = agendas;
  }, [agendas]);
  useEffect(() => {
    lastNameRef.current = lastName;
  }, [lastName]);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const bumpSyncPending = useCallback(() => {
    setSyncPending(peekFamilySyncQueue().length > 0);
  }, []);

  const persistSnapshot = useCallback(
    (fid: string, ln: string, mem: FamilyMember[], ag: FamilyHomeEvening[]) => {
      writeFamilySnapshot({
        familyId: fid,
        lastName: ln,
        members: mem,
        agendas: ag,
      });
    },
    [],
  );

  const loadFamily = useCallback(
    async (fid: string): Promise<"remote" | "cache" | "fail"> => {
      try {
        const [fr, ar] = await Promise.all([
          fetch(`/api/family/${fid}`),
          fetch(`/api/family/${fid}/agendas`),
        ]);
        if (fr.status === 404) {
          clearFamilyDbId();
          clearFamilySnapshot();
          setFamilyId(null);
          setLastName("");
          setMembers([]);
          setAgendas([]);
          setUsingCachedData(false);
          return "fail";
        }
        if (!fr.ok || !ar.ok) {
          const snap = readFamilySnapshot();
          if (snap?.familyId === fid) {
            applySnapshotToState(snap, {
              setFamilyId,
              setLastName,
              setMembers,
              setAgendas,
            });
            setError(null);
            setUsingCachedData(true);
            return "cache";
          }
          setError(
            "No se pudo cargar la familia. Revisa la conexión y MONGODB_URI.",
          );
          setUsingCachedData(false);
          return "fail";
        }
        const f = (await fr.json()) as {
          lastName?: string;
          members?: FamilyMember[];
        };
        const arBody = (await ar.json()) as { agendas?: FamilyHomeEvening[] };
        const ln = f.lastName ?? "";
        const mem = Array.isArray(f.members) ? f.members : [];
        const ag = Array.isArray(arBody.agendas) ? arBody.agendas : [];
        setFamilyId(fid);
        setLastName(ln);
        setMembers(mem);
        setAgendas(ag);
        setError(null);
        setUsingCachedData(false);
        persistSnapshot(fid, ln, mem, ag);
        return "remote";
      } catch {
        const snap = readFamilySnapshot();
        if (snap?.familyId === fid) {
          applySnapshotToState(snap, {
            setFamilyId,
            setLastName,
            setMembers,
            setAgendas,
          });
          setError(null);
          setUsingCachedData(true);
          return "cache";
        }
        setError(
          "Sin conexión y sin copia local reciente. Conéctate al menos una vez.",
        );
        setUsingCachedData(false);
        return "fail";
      }
    },
    [persistSnapshot],
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      let fid = getFamilyDbId();
      if (!fid) {
        const legacy = readLegacyFamilyBundle();
        if (
          legacy.lastName.trim() ||
          legacy.members.length > 0 ||
          legacy.agendas.length > 0
        ) {
          try {
            const res = await fetch("/api/family/migrate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(legacy),
            });
            if (res.ok) {
              const data = (await res.json()) as { id?: string };
              if (data.id) {
                setFamilyDbId(data.id);
                clearLegacyV1Storage();
                fid = data.id;
              }
            } else if (!navigator.onLine) {
              setError(
                "Sin conexión: no se pudo migrar datos antiguos. Vuelve cuando tengas red.",
              );
            } else {
              setError(
                "No se pudo migrar datos antiguos del navegador. Comprueba MongoDB.",
              );
            }
          } catch {
            if (!navigator.onLine) {
              setError(
                "Sin conexión: no se pudo migrar. Conéctate e inténtalo de nuevo.",
              );
            } else {
              setError("Error de red al migrar datos.");
            }
          }
        }
      }
      if (cancelled) return;
      if (!fid) {
        setFamilyId(null);
        setLastName("");
        setMembers([]);
        setAgendas([]);
        setLoading(false);
        setUsingCachedData(false);
        bumpSyncPending();
        return;
      }
      const src = await loadFamily(fid);
      if (cancelled) return;
      if (src === "remote") {
        await flushFamilySyncQueue();
      }
      bumpSyncPending();
      setLoading(false);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [loadFamily, bumpSyncPending]);

  useEffect(() => {
    function onOnline() {
      void (async () => {
        await flushFamilySyncQueue();
        bumpSyncPending();
        const fid = familyIdRef.current ?? getFamilyDbId();
        if (fid) {
          await loadFamily(fid);
          setUsingCachedData(false);
        }
      })();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [loadFamily, bumpSyncPending]);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      const fid = familyIdRef.current ?? getFamilyDbId();
      if (!fid) return;
      const silent = opts?.silent === true;
      if (!silent) setLoading(true);
      try {
        await loadFamily(fid);
        await flushFamilySyncQueue();
        bumpSyncPending();
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [loadFamily, bumpSyncPending],
  );

  const createFamilyWithLastName = useCallback(async (ln: string) => {
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastName: ln.trim() }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "No se pudo crear la familia");
    }
    const data = (await res.json()) as {
      id: string;
      lastName?: string;
      members?: FamilyMember[];
    };
    setFamilyDbId(data.id);
    setFamilyId(data.id);
    setLastName(data.lastName ?? "");
    setMembers(Array.isArray(data.members) ? data.members : []);
    setAgendas([]);
    setError(null);
    setUsingCachedData(false);
    persistSnapshot(
      data.id,
      data.lastName ?? "",
      Array.isArray(data.members) ? data.members : [],
      [],
    );
  }, [persistSnapshot]);

  const setMembersAfterOnboarding = useCallback(
    async (m: FamilyMember[]) => {
      const fid = familyIdRef.current ?? getFamilyDbId();
      if (!fid) throw new Error("Sin familia");
      setMembers(m);
      persistSnapshot(fid, lastNameRef.current, m, agendasRef.current);
      try {
        const res = await fetch(`/api/family/${fid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: m }),
        });
        if (!res.ok) throw new Error("api");
        const data = (await res.json()) as { members?: FamilyMember[] };
        setMembers(Array.isArray(data.members) ? data.members : []);
        persistSnapshot(
          fid,
          lastNameRef.current,
          Array.isArray(data.members) ? data.members : [],
          agendasRef.current,
        );
      } catch {
        enqueuePatchFamily(fid, { members: m });
        bumpSyncPending();
      }
    },
    [persistSnapshot, bumpSyncPending],
  );

  const updateFamily = useCallback(
    async (p: { lastName?: string; members?: FamilyMember[] }) => {
      const fid = familyIdRef.current ?? getFamilyDbId();
      if (!fid) throw new Error("Sin familia");
      const nextLast =
        typeof p.lastName === "string" ? p.lastName : lastNameRef.current;
      const nextMem = p.members ?? membersRef.current;
      if (typeof p.lastName === "string") setLastName(p.lastName);
      if (p.members) setMembers(p.members);
      persistSnapshot(fid, nextLast, nextMem, agendasRef.current);
      try {
        const res = await fetch(`/api/family/${fid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
        if (!res.ok) throw new Error("api");
        const data = (await res.json()) as {
          lastName?: string;
          members?: FamilyMember[];
        };
        if (typeof data.lastName === "string") setLastName(data.lastName);
        setMembers(Array.isArray(data.members) ? data.members : []);
        persistSnapshot(
          fid,
          typeof data.lastName === "string"
            ? data.lastName
            : lastNameRef.current,
          Array.isArray(data.members) ? data.members : membersRef.current,
          agendasRef.current,
        );
      } catch {
        enqueuePatchFamily(fid, p);
        bumpSyncPending();
      }
    },
    [persistSnapshot, bumpSyncPending],
  );

  const getAgendaById = useCallback(
    (id: string) => agendas.find((a) => a.id === id),
    [agendas],
  );

  const saveAgenda = useCallback(
    async (a: FamilyHomeEvening) => {
      const fid = familyIdRef.current ?? getFamilyDbId();
      if (!fid) throw new Error("Sin familia");

      setAgendas((prev) => {
        const i = prev.findIndex((x) => x.id === a.id);
        const nextList =
          i >= 0
            ? (() => {
                const n = [...prev];
                n[i] = a;
                return n;
              })()
            : [...prev, a];
        persistSnapshot(
          fid,
          lastNameRef.current,
          membersRef.current,
          nextList,
        );
        return nextList;
      });

      try {
        const res = await fetch(`/api/family/${fid}/agendas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(a),
        });
        if (!res.ok) throw new Error("api");
        const saved = (await res.json()) as FamilyHomeEvening;
        setAgendas((prev) => {
          const i = prev.findIndex((x) => x.id === saved.id);
          const merged =
            i >= 0
              ? (() => {
                  const n = [...prev];
                  n[i] = saved;
                  return n;
                })()
              : [...prev, saved];
          persistSnapshot(
            fid,
            lastNameRef.current,
            membersRef.current,
            merged,
          );
          return merged;
        });
        await flushFamilySyncQueue();
        bumpSyncPending();
        return saved;
      } catch {
        enqueueSaveAgenda(fid, a);
        bumpSyncPending();
        return a;
      }
    },
    [persistSnapshot, bumpSyncPending],
  );

  const deleteAgenda = useCallback(
    async (id: string) => {
      const fid = familyIdRef.current ?? getFamilyDbId();
      if (!fid) throw new Error("Sin familia");
      setAgendas((prev) => {
        const nextList = prev.filter((x) => x.id !== id);
        persistSnapshot(
          fid,
          lastNameRef.current,
          membersRef.current,
          nextList,
        );
        return nextList;
      });
      try {
        const res = await fetch(
          `/api/family/${fid}/agendas/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error("api");
        await flushFamilySyncQueue();
        bumpSyncPending();
      } catch {
        enqueueDeleteAgenda(fid, id);
        bumpSyncPending();
      }
    },
    [persistSnapshot, bumpSyncPending],
  );

  const markAgendaCompleted = useCallback(
    async (id: string) => {
      const current = agendasRef.current.find((x) => x.id === id);
      if (!current) return null;
      return saveAgenda(withAgendaCompleted(current));
    },
    [saveAgenda],
  );

  const ensureAgendaSessionStarted = useCallback(
    async (id: string) => {
      const current = agendasRef.current.find((x) => x.id === id);
      if (!current) return null;
      if (current.status !== "planned" || current.sessionStartedAt) {
        return current;
      }
      return saveAgenda(withSessionStartedIfNeeded(current));
    },
    [saveAgenda],
  );

  const updateAgendaCompletedSteps = useCallback(
    async (id: string, steps: Partial<Record<CompletedStepKey, boolean>>) => {
      const current = agendasRef.current.find((x) => x.id === id);
      if (!current || current.status === "completed") return null;
      return saveAgenda(withCompletedStepsPatch(current, steps));
    },
    [saveAgenda],
  );

  const value: FamilyDataContextValue = {
    familyId,
    lastName,
    members,
    agendas,
    loading,
    error,
    usingCachedData,
    syncPending,
    refresh,
    createFamilyWithLastName,
    setMembersAfterOnboarding,
    updateFamily,
    getAgendaById,
    saveAgenda,
    deleteAgenda,
    markAgendaCompleted,
    ensureAgendaSessionStarted,
    updateAgendaCompletedSteps,
  };

  return (
    <FamilyDataContext.Provider value={value}>
      <HymnsOfflineBootstrap />
      {children}
    </FamilyDataContext.Provider>
  );
}

/** Carga una agenda por id desde la API o copia local. */
export async function fetchAgendaByIdRemote(
  familyId: string,
  agendaId: string,
): Promise<FamilyHomeEvening | null> {
  try {
    const res = await fetch(
      `/api/family/${familyId}/agendas/${encodeURIComponent(agendaId)}`,
    );
    if (!res.ok) return null;
    return res.json() as Promise<FamilyHomeEvening>;
  } catch {
    const snap = readFamilySnapshot();
    if (snap?.familyId === familyId) {
      return snap.agendas.find((a) => a.id === agendaId) ?? null;
    }
    return null;
  }
}
