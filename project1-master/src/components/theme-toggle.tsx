"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

type Mode = "light" | "dark";

function getInitial(): Mode {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.getAttribute("data-theme") as Mode) || "dark";
}

function subscribeToTheme(callback: () => void) {
  if (typeof MutationObserver === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const mode = useSyncExternalStore(subscribeToTheme, getInitial, () => "dark");

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("halo-theme", next);
    } catch {}
  }

  const dim =
    size === "md"
      ? "size-9 [&_svg]:size-4"
      : "size-7 [&_svg]:size-3.5";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition",
        dim,
        className,
      )}
    >
      {mode === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
