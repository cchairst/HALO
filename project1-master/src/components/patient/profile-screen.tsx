"use client";

import { useEffect, useState, useTransition } from "react";
import { signOut } from "@/app/actions";
import {
  AvatarChip,
  EncouragementCard,
  HaloLogo,
  I,
  IconBadge,
  PatientCard,
  PatientShell,
} from "@/components/patient/primitives";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

type ProfileUser = {
  name: string;
  email: string;
  role: string;
};

export function PatientProfileScreen({ user }: { user: ProfileUser }) {
  const [pending, start] = useTransition();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });

  // Resync once on mount in case ThemeInit ran between SSR and hydration.
  useEffect(() => {
    const cur =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cur !== theme) setTheme(cur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
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
    <PatientShell>
      <header className="relative flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <HaloLogo size={26} />
          <span
            className="text-[22px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Halo
          </span>
        </div>
        <AvatarChip initials={initials(user.name)} />
      </header>

      <div className="px-5 pt-3">
        <h1
          className="text-[24px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Profile
        </h1>
      </div>

      {/* Identity card */}
      <div className="px-5 pt-5">
        <PatientCard>
          <div className="flex items-center gap-3">
            <span
              className="inline-grid h-14 w-14 place-items-center rounded-full text-[16px] font-semibold"
              style={{
                background: "var(--p-green-bg-2)",
                color: "var(--p-green-bright)",
                border: "1px solid var(--p-green-ring)",
              }}
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-[17px] font-semibold tracking-[-0.01em]"
                style={{ color: "var(--p-ink)" }}
              >
                {user.name}
              </div>
              <div
                className="truncate text-[12.5px]"
                style={{ color: "var(--p-muted)" }}
              >
                {user.email}
              </div>
            </div>
            <span
              className="patient-chip px-2.5 py-1 text-[11px]"
            >
              Patient
            </span>
          </div>

          <div
            className="mt-4 grid grid-cols-3 gap-2 rounded-2xl p-2.5"
            style={{
              background: "var(--p-surface-2)",
              border: "1px solid var(--p-border)",
            }}
          >
            <Mini label="Day" value="4" />
            <Mini label="Streak" value="3" />
            <Mini label="Recovery" value="62%" />
          </div>
        </PatientCard>
      </div>

      {/* Surgery info */}
      <div className="px-5 pt-4">
        <SectionLabel icon={I.heart}>Recovery</SectionLabel>
        <PatientCard padded={false}>
          <ProfileRow
            tone="red"
            icon={I.heart}
            title="Procedure"
            subtitle="Right knee arthroscopy"
          />
          <ProfileRow
            tone="purple"
            icon={I.calendar}
            title="Surgery date"
            subtitle="May 18, 2026"
          />
          <ProfileRow
            tone="green"
            icon={I.sun}
            title="Target full mobility"
            subtitle="By week 6 (Jun 29)"
            last
          />
        </PatientCard>
      </div>

      {/* Care team */}
      <div className="px-5 pt-4">
        <SectionLabel icon={I.sparkle}>Care team</SectionLabel>
        <PatientCard padded={false}>
          <TeamRow name="Dr. Aisha Lee" role="Orthopedic surgeon" tint="ochre" />
          <TeamRow name="Marcus Hill, RN" role="Recovery nurse" tint="green" />
          <TeamRow name="Priya Shah, PT" role="Physical therapist" tint="purple" last />
        </PatientCard>
      </div>

      {/* Preferences */}
      <div className="px-5 pt-4">
        <SectionLabel icon={I.sun}>Preferences</SectionLabel>
        <PatientCard padded={false}>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
          >
            <IconBadge tone={theme === "dark" ? "purple" : "gold"} size={36}>
              {theme === "dark" ? I.moon : I.sun}
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div
                className="text-[14px] font-semibold"
                style={{ color: "var(--p-ink)" }}
              >
                Appearance
              </div>
              <div
                className="mt-0.5 text-[12px]"
                style={{ color: "var(--p-muted)" }}
              >
                {theme === "dark" ? "Dark — true black" : "Light — warm cream"}
              </div>
            </div>
            <ThemeToggle theme={theme} />
          </button>

          <ProfileRow
            tone="green"
            icon={I.checkCircle}
            title="Daily check-in reminders"
            subtitle="Every morning at 9:00 AM"
            trailing={<TogglePill on />}
            last
          />
        </PatientCard>
      </div>

      {/* Sign out */}
      <div className="px-5 pt-5">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold disabled:opacity-50"
          style={{
            background: "var(--p-surface)",
            border: "1px solid var(--p-border-strong)",
            color: "var(--p-ink)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <div className="px-5 pt-5">
        <EncouragementCard
          title="Halo is with you, every step."
          subtitle="Your recovery, gently guided."
        />
      </div>
    </PatientShell>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-2 flex items-center gap-1.5 text-[13.5px] font-semibold tracking-[-0.01em]"
      style={{ color: "var(--p-muted)" }}
    >
      <span style={{ color: "var(--p-muted)" }}>{icon}</span>
      <span style={{ color: "var(--p-ink-2)" }}>{children}</span>
    </div>
  );
}

function ProfileRow({
  icon,
  tone,
  title,
  subtitle,
  trailing,
  last,
}: {
  icon: React.ReactNode;
  tone: "green" | "purple" | "red" | "blue" | "gold" | "neutral";
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: last ? "0" : "1px solid var(--p-border)",
      }}
    >
      <IconBadge tone={tone} size={36}>
        {icon}
      </IconBadge>
      <div className="min-w-0 flex-1">
        <div
          className="text-[14px] font-semibold"
          style={{ color: "var(--p-ink)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="mt-0.5 text-[12px]"
            style={{ color: "var(--p-muted)" }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}

function TeamRow({
  name,
  role,
  tint,
  last,
}: {
  name: string;
  role: string;
  tint: "ochre" | "green" | "purple";
  last?: boolean;
}) {
  const tintColors: Record<typeof tint, string> = {
    ochre: "radial-gradient(circle at 40% 35%, #f1d4b4, #b97e58 70%, #5a3220)",
    green: "radial-gradient(circle at 40% 35%, #b9d6b0, #5a8a55 70%, #2c4f37)",
    purple: "radial-gradient(circle at 40% 35%, #d8c8ee, #8a6dc9 70%, #432f70)",
  };
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: last ? "0" : "1px solid var(--p-border)",
      }}
    >
      <span
        className="inline-grid h-10 w-10 place-items-center rounded-full"
        style={{
          background: tintColors[tint],
          border: "1px solid var(--p-border)",
          color: "white",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="9" r="3.5" />
          <path d="M5 21c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5z" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[14px] font-semibold"
          style={{ color: "var(--p-ink)" }}
        >
          {name}
        </div>
        <div
          className="mt-0.5 truncate text-[12px]"
          style={{ color: "var(--p-muted)" }}
        >
          {role}
        </div>
      </div>
      <button
        type="button"
        className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
        style={{
          background: "var(--p-green-bg-2)",
          color: "var(--p-green-bright)",
          border: "1px solid var(--p-green-ring)",
        }}
      >
        Message
      </button>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div
        className="text-[16px] font-bold leading-none tracking-[-0.01em]"
        style={{ color: "var(--p-ink)" }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-[10.5px] font-medium"
        style={{ color: "var(--p-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

function ThemeToggle({ theme }: { theme: "light" | "dark" }) {
  const on = theme === "dark";
  return (
    <span
      className="relative inline-block h-6 w-10 rounded-full transition"
      style={{
        background: on ? "var(--p-green-strong)" : "var(--p-surface-3)",
        border: "1px solid var(--p-border)",
      }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
        style={{
          left: on ? 19 : 3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      />
    </span>
  );
}

function TogglePill({ on }: { on?: boolean }) {
  return (
    <span
      className="relative inline-block h-6 w-10 rounded-full"
      style={{
        background: on ? "var(--p-green-strong)" : "var(--p-surface-3)",
        border: "1px solid var(--p-border)",
      }}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
        style={{
          left: on ? 19 : 3,
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      />
    </span>
  );
}
