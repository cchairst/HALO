"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUserRound,
  ClipboardPlus,
  HeartPulse,
  House,
  Sparkles,
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { HaloMark } from "@/components/glass";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher, type DirectoryUser } from "@/components/role-switcher";

type NavItem = { href: string; label: string; Icon: React.ComponentType<{ className?: string }> };

const ITEMS: NavItem[] = [
  { href: "/messages", label: "Chat", Icon: MessageSquareText },
  { href: "/catch-up", label: "Catch Up", Icon: ClipboardPlus },
  { href: "/recipients", label: "Patients", Icon: HeartPulse },
  { href: "/wellness", label: "Wellness", Icon: Sparkles },
  { href: "/dashboard", label: "Home", Icon: House },
];

export function Sidebar({
  user,
  roleLabel,
}: {
  user: { name: string };
  roleLabel: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col gap-5 w-64 shrink-0 p-4 glass rounded-2xl m-4 sticky top-4 self-start max-h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <HaloMark size={28} />
        <div>
          <div className="text-[17px] font-semibold tracking-tight text-[var(--ink)] leading-none">
            Halo
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1 font-medium tracking-[-0.01em]">
            Care comms
          </div>
        </div>
      </div>

      <div className="gold-divider mx-2" />

      <nav className="flex flex-col gap-0.5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-[var(--surface)] text-[var(--ink)] font-semibold border border-[var(--border-strong)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--ink-2)]",
              )}
            >
              <Icon className={cn("size-4", active && "text-[var(--gold-deep)]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--surface)]/70 border border-[var(--border)]">
        <div className="size-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--ink-2)]">
          {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--ink)] truncate">
            {user.name}
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium tracking-[-0.01em] truncate">
            {roleLabel}
          </div>
        </div>
        <Link
          href="/switch"
          aria-label="Switch role"
          className="text-[var(--muted)] hover:text-[var(--ink)] transition"
        >
          <CircleUserRound className="size-4" />
        </Link>
      </div>
    </aside>
  );
}

export function MobileTopBar({
  user,
  roleLabel,
  directory,
  demoMode,
}: {
  user: { id: string; name: string; role: string };
  roleLabel: string;
  directory: DirectoryUser[];
  demoMode: boolean;
}) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/messages/") ||
    pathname === "/messages" ||
    pathname === "/catch-up"
  )
    return null;

  return (
    <div className="md:hidden sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)] px-3 pt-3 pb-2">
      <div className="glass rounded-[20px] px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <HaloMark size={24} />
          <div className="min-w-0 leading-tight">
            <div className="text-[14px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Halo
            </div>
            <div className="max-w-[130px] truncate text-[10px] font-medium tracking-[-0.01em] text-[var(--muted)]">
              {roleLabel}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <RoleSwitcher current={user} users={directory} variant="compact" demoMode={demoMode} />
        </div>
      </div>
    </div>
  );
}

// --- Patient mobile bottom nav -------------------------------------------
// The mobile app is the patient experience. Four tabs only: Today, Progress,
// Messages, Profile. Active color is the calm green accent; gold is reserved
// for the Halo logo elsewhere.

type PatientNavItem = {
  href: string;
  labelKey: "today" | "progress" | "plan" | "messages" | "profile";
  iconPath: React.ReactNode;
  badge?: boolean;
};

const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  {
    href: "/dashboard",
    labelKey: "today",
    iconPath: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
  },
  {
    href: "/progress",
    labelKey: "progress",
    iconPath: (
      <>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </>
    ),
  },
  {
    href: "/plan",
    labelKey: "plan",
    iconPath: (
      <>
        <path d="M12 2.5l1.7 4.3 4.6.4-3.5 3 1 4.5L12 12.4 8.2 14.7l1-4.5-3.5-3 4.6-.4z" />
        <path d="M5 17.5l.7 1.8 1.9.2-1.4 1.2.4 1.8-1.6-1-1.6 1 .4-1.8-1.4-1.2 1.9-.2z" />
        <path d="M18 16.5l.55 1.4 1.45.15-1.1.95.3 1.4-1.2-.75-1.2.75.3-1.4-1.1-.95 1.45-.15z" />
      </>
    ),
  },
  {
    href: "/messages",
    labelKey: "messages",
    badge: true,
    iconPath: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
  },
  {
    href: "/profile",
    labelKey: "profile",
    iconPath: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </>
    ),
  },
];

const PATIENT_NAV_LABELS: Record<PatientNavItem["labelKey"], string> = {
  today: "Today",
  progress: "Progress",
  plan: "Plan",
  messages: "Messages",
  profile: "Profile",
};

export type MobileNavLabels = {
  chats: string;
  patients: string;
  catchUp: string;
  profile: string;
};

export function MobileBottomNav({
  labels: _labels,
}: {
  // Kept for compatibility with the desktop layout; not used by the patient
  // bottom nav. Tab copy is owned by this component.
  labels: MobileNavLabels;
}) {
  const pathname = usePathname();
  // Hide inside individual chat threads, the check-in flow, or the AI chat
  // (each renders its own bottom actions / composer).
  if (pathname.startsWith("/messages/") && pathname !== "/messages") return null;
  if (pathname.startsWith("/check-in")) return null;
  if (pathname.startsWith("/ai")) return null;

  // Compute the active tab index. We match in declaration order so the
  // sliding highlight uses the same offsets the rendered tabs do.
  const activeIndex = PATIENT_NAV_ITEMS.findIndex(({ href }) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  });
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const tabCount = PATIENT_NAV_ITEMS.length;
  const tabWidthPct = 100 / tabCount;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-1/2 z-30 w-[min(94vw,440px)] -translate-x-1/2 px-3 pb-3 pt-2 pointer-events-none patient-mobile"
      aria-label="Primary"
    >
      <div
        className="relative flex items-stretch gap-0 rounded-[30px] px-2 py-2 pointer-events-auto"
        style={{
          background: "var(--p-surface)",
          border: "1px solid var(--p-border)",
          boxShadow: "0 12px 30px -16px rgba(0,0,0,0.35)",
        }}
      >
        {/* Sliding highlight pill. Sits behind the tabs and translates to
            the active index on every route change. Width matches one tab
            slot; the spring-y cubic-bezier gives the iOS-y settle. */}
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-2 right-2 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <span
            className="absolute top-0 bottom-0 rounded-[22px] transition-transform duration-300"
            style={{
              width: `${tabWidthPct}%`,
              transform: `translate3d(${safeIndex * 100}%, 0, 0)`,
              transitionTimingFunction: "cubic-bezier(0.34, 1.35, 0.64, 1)",
              background: "var(--p-green-bg-2)",
              border: "1px solid var(--p-green-ring)",
            }}
          />
        </span>

        {PATIENT_NAV_ITEMS.map(({ href, labelKey, iconPath, badge }, i) => {
          const label = PATIENT_NAV_LABELS[labelKey];
          const active = i === safeIndex;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-95",
              )}
              style={{
                color: active ? "var(--p-green-bright)" : "var(--p-muted)",
              }}
            >
              <span className="relative inline-flex">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {iconPath}
                </svg>
                {badge && (
                  <span
                    className="absolute -right-1 -top-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--p-green-bright)" }}
                  />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

