"use client";

import { useEffect, useState } from "react";
import { useFamilyData } from "@/components/FamilyDataProvider";

export function OfflineStatusBanner() {
  const { usingCachedData, syncPending, familyId } = useFamilyData();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!familyId) return null;

  const show =
    !online || usingCachedData || syncPending;

  if (!show) return null;

  let msg = "";
  if (!online) {
    msg =
      "Sin conexión: estás usando datos guardados en este dispositivo. Los cambios se sincronizarán al volver la red.";
  } else if (syncPending) {
    msg =
      "Hay cambios pendientes de subir al servidor. Se enviarán automáticamente cuando la conexión sea estable.";
  } else if (usingCachedData) {
    msg =
      "Mostrando copia local; cuando haya conexión se actualizará desde la base de datos.";
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100">
      {msg}
    </div>
  );
}
