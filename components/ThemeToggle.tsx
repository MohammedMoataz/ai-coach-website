"use client";

import { useSyncExternalStore } from "react";
import { Button } from "primereact/button";

// The theme lives on <html data-theme> (set before paint in app/layout.tsx); this reads and flips it.
const read = () => document.documentElement.dataset.theme ?? "light";
const subscribe = (fn: () => void) => {
  const obs = new MutationObserver(fn);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
};

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light");
  const next = theme === "dark" ? "light" : "dark";

  const flip = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <Button
      text
      rounded
      size="small"
      icon={theme === "dark" ? "pi pi-sun" : "pi pi-moon"}
      aria-label={`Switch to ${next} theme`}
      onClick={flip}
    />
  );
}
