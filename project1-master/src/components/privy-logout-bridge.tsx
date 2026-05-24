"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export function PrivyLogoutBridge() {
  const { logout, ready } = usePrivy();
  useEffect(() => {
    if (!ready) return;
    function handler() {
      logout();
    }
    window.addEventListener("halo:privy-logout", handler);
    return () => window.removeEventListener("halo:privy-logout", handler);
  }, [logout, ready]);
  return null;
}
