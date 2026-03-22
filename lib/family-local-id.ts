const KEY = "noche-de-hogar:v2:family-mongo-id";

export function getFamilyDbId(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY)?.trim();
  return raw || null;
}

export function setFamilyDbId(id: string): void {
  localStorage.setItem(KEY, id.trim());
}

export function clearFamilyDbId(): void {
  localStorage.removeItem(KEY);
}
