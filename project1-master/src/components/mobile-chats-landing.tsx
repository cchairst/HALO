"use client";

import {
  Activity,
  ChevronRight,
  Pin,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { M_CHATS } from "@/lib/mobile-demo";
import { Card, CardHeader, MobileTopHeader } from "@/components/mobile-catch-up";

// Mobile Chats landing — image 9. Signature preserved.
export function MobileChatsLanding(_props: {
  user: { id: string; name: string; role: string };
  threads: unknown;
  unreadCounts?: { catchUp: number; threads: number; aac: number };
  people: unknown;
  composeOpen?: boolean;
}) {
  const D = M_CHATS;
  return (
    <div className="md:hidden -mx-4 min-h-[100dvh] pb-[140px]" style={{ background: "#000" }}>
      <MobileTopHeader />

      <div className="flex items-center gap-2 px-4 pt-1">
        <label
          className="flex flex-1 items-center gap-2 rounded-2xl px-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search className="size-4 text-[#888]" />
          <input
            placeholder="Search chats"
            className="h-10 w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#666]"
          />
        </label>
        <button
          aria-label="Filter"
          className="grid size-10 place-items-center rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <SlidersHorizontal className="size-4 text-white" />
        </button>
      </div>

      <h1 className="px-4 pt-4 text-[28px] font-bold text-white">Chats</h1>

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2 mobile-need-scroll">
        <FilterPill label="All" active />
        <FilterPill label="Unread" count={D.filters.unread} />
        <FilterPill label="Mentions" count={D.filters.mentions} />
        <FilterPill label="Alerts" count={D.filters.alerts} />
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Pin className="size-4 text-[#d4a847]" /> Pinned
              </span>
            }
            right="View all (3)"
          />
          {D.pinned.map((row, i) => (
            <ChatRow
              key={row.label}
              avatarText={row.avatar === "icu" ? null : row.avatar}
              avatarIcon={row.avatar === "icu"}
              avatarBg={row.avatarBg ?? "#1c1c1c"}
              presence={row.presence}
              label={
                <span className="inline-flex items-center gap-1.5">
                  {row.label}
                  <Pin className="size-3 -rotate-45 text-[#d4a847]" />
                </span>
              }
              preview={row.preview}
              time={row.time}
              unread={row.unread}
              divider={i !== D.pinned.length - 1}
            />
          ))}
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="size-4 text-[#d4a847]" /> Active chats
              </span>
            }
            right="View all (5)"
          />
          {D.active.map((row, i) => (
            <ChatRow
              key={row.name}
              avatarText={row.initials}
              avatarBg={row.avatarBg}
              avatarPhoto={row.photo}
              presence={row.presence}
              label={row.name}
              preview={row.preview}
              time={row.time}
              unread={row.unread}
              divider={i !== D.active.length - 1}
            />
          ))}
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-[#d4a847]" /> Recent patient threads
              </span>
            }
            right="View all (12)"
          />
          {D.threads.map((row, i) => (
            <ChatRow
              key={row.label}
              avatarText={row.room}
              avatarBg={row.avatarBg}
              presence={row.presence}
              label={row.label}
              preview={row.preview}
              time={row.time}
              unread={row.unread}
              divider={i !== D.threads.length - 1}
            />
          ))}
        </Card>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
}: {
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
      style={{
        background: active ? "transparent" : "rgba(255,255,255,0.03)",
        border: active
          ? "1px solid #d4a847"
          : "0.5px solid rgba(255,255,255,0.12)",
        color: active ? "#d4a847" : "#bbb",
      }}
    >
      {label}
      {count != null && (
        <span
          className="grid min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-bold"
          style={{ background: "rgba(255,255,255,0.08)", color: "#bbb" }}
        >
          {count}
        </span>
      )}
    </span>
  );
}

function ChatRow({
  avatarText,
  avatarIcon,
  avatarPhoto,
  avatarBg,
  presence,
  label,
  preview,
  time,
  unread,
  divider,
}: {
  avatarText?: string | null;
  avatarIcon?: boolean;
  avatarPhoto?: boolean;
  avatarBg: string;
  presence?: "active" | "idle";
  label: React.ReactNode;
  preview: string;
  time: string;
  unread?: number;
  divider?: boolean;
}) {
  return (
    <a
      href="#"
      className={`-mx-1 flex items-center gap-3 px-1 py-2.5 ${divider ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}
    >
      <span className="relative shrink-0">
        <span
          className="grid size-11 place-items-center rounded-full text-[12.5px] font-bold text-white"
          style={{
            background: avatarBg,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {avatarIcon ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a847" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3" />
              <circle cx="15" cy="8" r="3" />
              <path d="M5 20a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4" />
            </svg>
          ) : avatarPhoto ? (
            <span
              className="block size-11 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${avatarBg}, #3a2d18)`,
              }}
            />
          ) : (
            avatarText
          )}
        </span>
        {presence && (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full"
            style={{
              background: presence === "active" ? "#22c55e" : "#f97316",
              border: "2px solid #000",
            }}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-white">{label}</div>
        <div className="mt-0.5 truncate text-[12px] text-[#999]">{preview}</div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[11px] text-[#888]">{time}</span>
        {unread ? (
          <span
            className="grid min-w-[20px] place-items-center rounded-full px-1 text-[11px] font-bold leading-none"
            style={{ background: "#d4a847", color: "#1b1712" }}
          >
            {unread}
          </span>
        ) : (
          <ChevronRight className="size-3.5 text-[#555]" />
        )}
      </div>
    </a>
  );
}
