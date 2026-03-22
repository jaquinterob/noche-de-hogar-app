"use client";

import { useEffect } from "react";

const THEME_KEY = "noche-de-hogar:v1:theme";

export function applyStoredTheme() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(THEME_KEY);
  const systemDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  let mode: "light" | "dark" = systemDark ? "dark" : "light";
  if (stored === "dark" || stored === "light") mode = stored;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function setTheme(mode: "light" | "dark" | "system") {
  if (mode === "system") {
    localStorage.removeItem(THEME_KEY);
    applyStoredTheme();
    return;
  }
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyStoredTheme();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored !== "dark" && stored !== "light") applyStoredTheme();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return <>{children}</>;
}
