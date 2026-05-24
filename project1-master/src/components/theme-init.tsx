"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("halo-theme");
      const theme = saved === "dark" || saved === "light" ? saved : "dark";
      document.documentElement.setAttribute("data-theme", theme);
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return null;
}
