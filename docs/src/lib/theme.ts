import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const read = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** Current docs theme; re-renders when it changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "dark");
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem("docs-theme", t);
  } catch {
    /* storage blocked – theme just won't persist */
  }
}
