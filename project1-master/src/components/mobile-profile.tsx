"use client";

import { useTransition } from "react";
import { Sun, Moon, LogOut, ShieldCheck, Mail } from "lucide-react";
import { signOut } from "@/app/actions";
import { MobileScreenHeader, MobileSection, MobileScreenWrapper } from "@/components/mobile-screen";

type Props = {
  user: { name: string; role: string; email: string };
  roleLabel: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MobileProfile({ user, roleLabel }: Props) {
  const [pending, start] = useTransition();

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("halo-theme", next);
    } catch {}
  }

  function handleSignOut() {
    start(async () => {
      window.dispatchEvent(new CustomEvent("halo:privy-logout"));
      await signOut();
    });
  }

  return (
    <MobileScreenWrapper>
      <MobileScreenHeader title="Profile" subtitle={roleLabel} />

      {/* Identity card */}
      <div className="px-3.5 pb-2">
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            border: "0.5px solid rgba(255,255,255,0.08)",
            background: "rgba(212,168,71,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-full text-[15px] font-semibold"
              style={{ border: "0.5px solid #d4a847", color: "#d4a847" }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-semibold">{user.name}</div>
              <div className="truncate text-[12px]" style={{ color: "#8a8a8a" }}>
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileSection label="Settings">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
        >
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.14)",
              color: "#d4a847",
            }}
          >
            <Sun className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">Theme</div>
            <div className="text-[11px]" style={{ color: "#8a8a8a" }}>
              Tap to flip light / dark
            </div>
          </div>
          <Moon className="size-4" style={{ color: "#8a8a8a" }} />
        </button>
      </MobileSection>

      <MobileSection label="Account">
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.14)",
              color: "#d4a847",
            }}
          >
            <Mail className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">Email</div>
            <div className="truncate text-[11px]" style={{ color: "#8a8a8a" }}>
              {user.email}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.14)",
              color: "#d4a847",
            }}
          >
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">Role</div>
            <div className="text-[11px]" style={{ color: "#8a8a8a" }}>
              {roleLabel}
            </div>
          </div>
        </div>
      </MobileSection>

      <div className="px-3.5 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.14)",
            color: "#fff",
          }}
        >
          <LogOut className="size-4" />
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </MobileScreenWrapper>
  );
}
