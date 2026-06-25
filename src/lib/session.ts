import type { SelectionSummary } from "./scoring";

const KEY = "hotpot:session";

export function loadSession(): Partial<SelectionSummary> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveSession(s: Partial<SelectionSummary>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(s));
}
