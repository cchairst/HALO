"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  SIDEBAR_ACTIVE,
  SIDEBAR_PINNED,
  SIDEBAR_RECENT_PATIENTS,
  SIDEBAR_RECENT_PATIENT_THREADS,
  type SidebarChat,
  type SidebarPatient,
  type SidebarPinned,
} from "@/lib/desktop-demo";
import { Avatar, StatusDot } from "./bits";

// One sidebar component, multiple presets. The mockups show the same
// chrome (search → tabs → grouped sections) with different filter chips and
// active rows on each screen.

type Variant = "shift-hub" | "chats" | "care-teams" | "patient-chart";

const TABS_DEFAULT = ["All", "Chats", "Patients", "Teams"] as const;
const TABS_CHATS = ["All", "Direct", "Teams"] as const;

export function DesktopSidebar({
  variant,
  activeChatId,
  activePatientId,
  bottomLabel = "View all chats",
}: {
  variant: Variant;
  activeChatId?: string;
  activePatientId?: string;
  bottomLabel?: string;
}) {
  const tabs = variant === "chats" ? TABS_CHATS : TABS_DEFAULT;
  const tabsActive = variant === "care-teams" ? "All" : variant === "patient-chart" ? "Patients" : "All";

  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)]">
      <div className="flex flex-col gap-3 px-3 pb-3 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-2)]" />
          <input
            placeholder="Search chats, patients, teams..."
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]/70 pl-8 pr-2 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(201,154,50,0.45)]"
          />
        </div>

        <div className="flex items-center gap-1 text-[12.5px] font-semibold">
          {tabs.map((tab) => {
            const isActive = tab === tabsActive;
            return (
              <button
                key={tab}
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 transition",
                  isActive
                    ? "text-[var(--gold-soft)]"
                    : "text-[var(--muted)] hover:text-[var(--ink-2)]",
                )}
              >
                {tab}
                {isActive && (
                  <span className="ml-0.5 inline-block h-[3px] w-[18px] rounded-full bg-[var(--gold)]" />
                )}
              </button>
            );
          })}
          {variant === "chats" && (
            <span className="ml-auto rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
              24
            </span>
          )}
        </div>

        {variant === "chats" && (
          <div className="flex gap-1.5 overflow-x-auto">
            {[
              { label: "All", count: 24, active: true },
              { label: "Unread", count: 7 },
              { label: "Mentions", count: 3 },
              { label: "Alerts", count: 5 },
            ].map((c) => (
              <span
                key={c.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
                  c.active
                    ? "border-[rgba(201,154,50,0.5)] bg-[var(--gold-bg)] text-[var(--gold-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)]/70 text-[var(--muted)]",
                )}
              >
                {c.label}
                <span className="rounded-full bg-[var(--surface-2)] px-1 text-[9.5px]">{c.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {variant === "patient-chart" ? (
          <SidebarRecentPatients activeId={activePatientId} />
        ) : (
          <>
            <SectionHeader title="PINNED" open />
            <div className="mt-1 flex flex-col">
              {SIDEBAR_PINNED.map((p) => (
                <PinnedRow key={p.id} pinned={p} />
              ))}
            </div>

            <div className="h-3" />

            <SectionHeader title="ACTIVE CHATS" open />
            <div className="mt-1 flex flex-col">
              {SIDEBAR_ACTIVE.map((c) => (
                <ChatRow key={c.id} chat={c} active={c.id === activeChatId} />
              ))}
            </div>

            <div className="h-3" />

            <SectionHeader title="RECENT PATIENT THREADS" open />
            <div className="mt-1 flex flex-col">
              {SIDEBAR_RECENT_PATIENT_THREADS.map((t) => (
                <ThreadRow key={t.id} label={t.label} time={t.time} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <Link
          href="#"
          className="inline-flex w-full items-center justify-end gap-1 text-[12.5px] font-semibold text-[var(--gold-soft)]"
        >
          {bottomLabel} <span>-&gt;</span>
        </Link>
      </div>
    </aside>
  );
}

function SectionHeader({ title, open }: { title: string; open?: boolean }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] hover:bg-[var(--surface)]"
    >
      <span>{title}</span>
      {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
    </button>
  );
}

function PinnedRow({ pinned }: { pinned: SidebarPinned }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface)]">
      <span className="grid size-5 place-items-center rounded text-[var(--muted)]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="5" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="11" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>
      <span className="flex-1 truncate text-[13px] font-semibold text-[var(--ink-2)]">
        {pinned.label}
      </span>
      {pinned.unread ? (
        <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--muted)]">
          {pinned.unread}
        </span>
      ) : null}
      <span className="text-[10.5px] text-[var(--muted)]">{pinned.time}</span>
    </div>
  );
}

function ChatRow({ chat, active }: { chat: SidebarChat; active?: boolean }) {
  const isHighlighted = active ?? chat.highlight;
  return (
    <Link
      href={chat.id === "room-311" ? "/messages/room-311" : "#"}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5",
        isHighlighted
          ? "bg-[var(--surface)] ring-1 ring-[var(--border-strong)]"
          : "hover:bg-[var(--surface)]",
      )}
    >
      <Avatar
        initials={initialsFrom(chat.name)}
        size={28}
        bg="#1c1c1f"
        fg="#d9d3c5"
        presence={chat.presence === "active" ? "active" : chat.presence === "idle" ? "idle" : undefined}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-[var(--ink)]">
          {chat.name}
        </span>
        <span className="block truncate text-[11.5px] text-[var(--muted)]">{chat.preview}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-[var(--muted)]">{chat.time}</span>
        {chat.unread ? (
          <span
            className="grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ background: "var(--gold)", color: "#1b1712" }}
          >
            {chat.unread}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function ThreadRow({ label, time }: { label: string; time: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface)]">
      <span className="grid size-5 place-items-center text-[var(--muted)]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>
      <span className="flex-1 truncate text-[12.5px] font-medium text-[var(--ink-2)]">{label}</span>
      <span className="text-[10.5px] text-[var(--muted)]">{time}</span>
    </div>
  );
}

function SidebarRecentPatients({ activeId }: { activeId?: string }) {
  return (
    <>
      <div className="px-2 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
        Recent patients
      </div>
      <div className="flex flex-col">
        {SIDEBAR_RECENT_PATIENTS.map((patient) => (
          <PatientRow
            key={patient.id}
            patient={patient}
            active={activeId ? patient.id === activeId : patient.highlight}
          />
        ))}
      </div>
    </>
  );
}

function PatientRow({ patient, active }: { patient: SidebarPatient; active?: boolean }) {
  return (
    <Link
      href={patient.id === "margaret-chen" ? "/recipients/margaret-chen" : "#"}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5",
        active
          ? "bg-[var(--surface)] ring-1 ring-[var(--border-strong)]"
          : "hover:bg-[var(--surface)]",
      )}
    >
      {patient.initials ? (
        <Avatar
          initials={patient.initials}
          size={28}
          bg="#1c1c1f"
          fg="#d9d3c5"
          presence={
            patient.presence === "active"
              ? "active"
              : patient.presence === "idle"
                ? "idle"
                : undefined
          }
        />
      ) : (
        <span className="grid size-7 place-items-center rounded-full border border-[var(--border)] text-[var(--muted)]">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-[var(--ink)]">
          {patient.name}
        </span>
        {patient.detail && (
          <span className="block truncate text-[11.5px] text-[var(--muted)]">
            {patient.detail}
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[10px] text-[var(--muted)]">{patient.time}</span>
        {patient.unread ? (
          <span
            className="grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ background: "var(--gold)", color: "#1b1712" }}
          >
            {patient.unread}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function initialsFrom(name: string) {
  return name
    .replace(/Room \d+\s*-\s*/, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Minimal Slack-style sidebar used by Catch Up (image 5): just a search +
// one collapsible "Chats" section, then user controls along the bottom.
export function DesktopSidebarCatchUp({ userName }: { userName: string }) {
  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-[256px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--background)]">
      <div className="px-3 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-2)]" />
          <input
            placeholder="Find or start a conversation"
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)]/70 pl-8 pr-2 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(201,154,50,0.45)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <button className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          <ChevronDown className="size-3" />
          <span>Chats</span>
          <span className="ml-auto rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            1
          </span>
        </button>
        <div className="mt-2 flex flex-col">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--surface)]"
          >
            <Avatar initials="V" size={26} bg="#1c1c1f" fg="#d9d3c5" presence="active" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-[var(--ink)]">
                Vagabond
              </span>
              <span className="block truncate text-[11px] text-[var(--muted)]">
                You: test
              </span>
            </span>
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-3 py-3">
        <button
          type="button"
          aria-label="New"
          className="mb-3 grid size-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--gold-soft)] hover:border-[rgba(201,154,50,0.6)]"
        >
          <Plus className="size-4" />
        </button>
        <div className="flex items-center gap-2">
          <span
            className="grid size-8 place-items-center rounded-full text-[12px] font-bold text-[#1b1712]"
            style={{ background: "var(--gold)" }}
          >
            C
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-[var(--ink)]">{userName}</div>
            <div className="text-[10.5px] text-[var(--muted)]">Nurse / Care T...</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[var(--muted)]">
          <SmallIcon label="Mute"><circle cx="8" cy="8" r="3" /></SmallIcon>
          <SmallIcon label="Headphones"><path d="M3 9a5 5 0 0 1 10 0v4a1 1 0 0 1-1 1h-2v-4h3" /></SmallIcon>
          <SmallIcon label="Theme"><circle cx="8" cy="8" r="3" /></SmallIcon>
          <SmallIcon label="Log out"><path d="M8 3v6m-3-3 3-3 3 3" /></SmallIcon>
        </div>
      </div>
    </aside>
  );
}

function SmallIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid size-7 place-items-center rounded-md hover:bg-[var(--surface)] hover:text-[var(--ink-2)]"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        {children}
      </svg>
    </button>
  );
}
