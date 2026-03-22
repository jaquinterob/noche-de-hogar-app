"use client";

import { useEffect, useState } from "react";
import { applyStoredTheme, setTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    applyStoredTheme();
    setMode(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setTheme(next);
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={mode === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {mode === "dark" ? "Claro" : "Oscuro"}
    </button>
  );
}
