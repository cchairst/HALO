"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, ChevronDown, Mic, Headphones } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher, type DirectoryUser } from "@/components/role-switcher";

export type ChannelRecipient = {
  id: string;
  name: string;
  facility: string | null;
  status: string; // e.g. "On shift", "Quiet hours", "In session"
  presence: "active" | "idle" | "alert" | "offline";
  unread: number;
};

const PRESENCE_COLOR: Record<ChannelRecipient["presence"], string> = {
  active: "#22c55e",
  idle: "#eab308",
  alert: "#ef4444",
  offline: "#9ca3af",
};

export function ChannelList({
  recipients,
  user,
  roleLabel,
  directory,
  demoMode,
}: {
  recipients: ChannelRecipient[];
  user: { id: string; name: string; role: string };
  roleLabel: string;
  directory: DirectoryUser[];
  demoMode: boolean;
}) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      q.trim()
        ? recipients.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
        : recipients,
    [recipients, q],
  );

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 bg-[var(--surface-2)]/60 border-r border-[var(--border)]">
      {/* search */}
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find or start a conversation"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm placeholder:text-[var(--muted-2)] outline-none focus:border-[var(--ink)]/40 min-h-9"
          />
        </div>
      </div>

      {/* sections */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-[var(--muted)]">
          <ChevronDown className="size-3" />
          Chats
          <span className="ml-auto text-[10px] text-[var(--muted-2)]">
            {filtered.length}
          </span>
        </div>

        <ul className="flex flex-col gap-0.5 mt-1">
          {filtered.map((r) => {
            const active =
              pathname === `/messages/${r.id}` ||
              pathname === `/recipients/${r.id}`;
            return (
              <li key={r.id}>
                <Link
                  href={`/messages/${r.id}`}
                  className={cn(
                    "group flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition",
                    active
                      ? "bg-[var(--surface)] border border-[var(--border-strong)]"
                      : "hover:bg-[var(--surface)]/70",
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="size-9 rounded-full bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--ink-2)]">
                      {r.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[var(--surface-2)]"
                      style={{ background: PRESENCE_COLOR[r.presence] }}
                      aria-label={r.presence}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "text-[13.5px] truncate",
                          active
                            ? "font-semibold text-[var(--ink)]"
                            : "font-medium text-[var(--ink-2)]",
                        )}
                      >
                        {r.name}
                      </div>
                      {r.unread > 0 && (
                        <span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[10px] font-bold flex items-center justify-center">
                          {r.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">
                      {r.status}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-[var(--muted)]">
            No matches.
          </div>
        )}
      </div>

      {/* user pod */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)]/80 px-2 py-2">
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <div className="size-9 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#22c55e] border-2 border-[var(--surface)]"
              aria-label="online"
            />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[13px] font-semibold text-[var(--ink)] truncate">
              {user.name}
            </div>
            <div className="text-[10px] text-[var(--muted)] font-medium tracking-[-0.01em] truncate">
              {roleLabel}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              aria-label="Mute"
              className="size-7 rounded-md hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink-2)] flex items-center justify-center transition"
            >
              <Mic className="size-3.5" />
            </button>
            <button
              aria-label="Quiet hours"
              className="size-7 rounded-md hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--ink-2)] flex items-center justify-center transition"
            >
              <Headphones className="size-3.5" />
            </button>
            <ThemeToggle />
            <RoleSwitcher current={user} users={directory} demoMode={demoMode} />
          </div>
        </div>
      </div>
    </aside>
  );
}
