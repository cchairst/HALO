"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronsUpDown, LogOut, Stethoscope, Users, Shield, Check } from "lucide-react";
import { switchToUser, signOut } from "@/app/actions";
import { cn } from "@/lib/cn";

export type DirectoryUser = {
  id: string;
  name: string;
  role: "caregiver" | "family" | "aps" | string;
};

const ROLE_GROUPS: { role: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { role: "caregiver", label: "Nurses / Care Team", Icon: Stethoscope },
  { role: "family", label: "Patients / Family", Icon: Users },
  { role: "aps", label: "Social & Protective Services", Icon: Shield },
];

export function RoleSwitcher({
  current,
  users,
  variant = "pod",
  demoMode = false,
}: {
  current: { id: string; name: string; role: string };
  users: DirectoryUser[];
  variant?: "pod" | "compact";
  demoMode?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function pick(uid: string) {
    if (uid === current.id) return setOpen(false);
    start(async () => {
      await switchToUser(uid);
      setOpen(false);
    });
  }

  function logout() {
    start(async () => {
      // Privy logout is fired separately by SignOutButton when it's mounted.
      window.dispatchEvent(new CustomEvent("halo:privy-logout"));
      await signOut();
    });
  }

  return (
    <div ref={ref} className="relative">
      {variant === "pod" ? (
        <button
          type="button"
          onClick={() => (demoMode ? setOpen((v) => !v) : logout())}
          aria-label={demoMode ? "Switch identity" : "Sign out"}
          className="size-7 rounded-md hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink-2)] flex items-center justify-center transition"
          title={demoMode ? "Switch identity (demo)" : "Sign out"}
          disabled={pending}
        >
          {demoMode ? <ChevronsUpDown className="size-3.5" /> : <LogOut className="size-3.5" />}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => (demoMode ? setOpen((v) => !v) : logout())}
          className="flex max-w-[132px] items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]/80 px-2.5 py-1.5 text-[12px] font-semibold tracking-[-0.02em] text-[var(--ink-2)] hover:bg-[var(--surface)]"
          aria-label={demoMode ? "Switch identity" : "Sign out"}
          disabled={pending}
        >
          <span className="min-w-0 truncate">{current.name.split(" ")[0]}</span>
          {demoMode ? (
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <LogOut className="size-3.5 shrink-0 opacity-70" />
          )}
        </button>
      )}

      {demoMode && open && (
        <div
          className="absolute z-50 right-0 bottom-full mb-2 w-72 rounded-xl glass-strong p-1.5"
          role="menu"
        >
          <div className="px-2.5 py-2 flex items-center justify-between border-b border-[var(--border)] mb-1">
            <div className="text-[11px] tracking-[-0.01em] text-[var(--muted)] font-medium">
              Switch identity
            </div>
            <span className="text-[10px] text-[var(--muted)]">demo</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {ROLE_GROUPS.map(({ role, label, Icon }) => {
              const group = users.filter((u) => u.role === role);
              if (group.length === 0) return null;
              return (
                <div key={role} className="mb-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] tracking-[-0.01em] text-[var(--muted)] font-medium">
                    <Icon className="size-3" />
                    {label}
                  </div>
                  <ul>
                    {group.map((u) => {
                      const active = u.id === current.id;
                      const initials = u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("");
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => pick(u.id)}
                            disabled={pending}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-sm transition disabled:opacity-50",
                              active
                                ? "bg-[var(--surface-2)] text-[var(--ink)]"
                                : "hover:bg-[var(--surface-2)] text-[var(--ink-2)]",
                            )}
                          >
                            <div className="size-7 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold text-[var(--ink-2)]">
                              {initials}
                            </div>
                            <span className="flex-1 min-w-0 truncate">{u.name}</span>
                            {active && (
                              <Check className="size-3.5 text-[var(--gold-deep)]" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[var(--border)] mt-1 pt-1">
            <button
              type="button"
              onClick={logout}
              disabled={pending}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)] transition disabled:opacity-50"
            >
              <LogOut className="size-3.5" />
              Sign out (back to landing)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
