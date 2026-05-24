"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Bell,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  Paperclip,
  ShieldAlert,
  Smile,
  UserPlus,
  Users,
} from "lucide-react";
import { M_CHAT_311 } from "@/lib/mobile-demo";

type ChatThread = {
  id: string;
  members: { user: { id: string; name: string; role: string } }[];
  messages: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: { id: string; name: string; role: string };
  }[];
};

type MobileMessage = {
  author: string;
  initials?: string;
  icon?: "mortar" | "flask" | "lungs";
  role?: string;
  roleTone?: "purple" | "red" | "green" | "blue";
  bg?: string;
  time: string;
  body: string;
  chips?: { label: string; tone: "red" | "neutral"; alert?: boolean }[];
  attachment?: { name: string; kind: string };
  labCard?: { name: string; collected: string; value: string; trend: "up" };
};

// Mobile chat detail — image 10. Renders static demo content; replaces the
// old mobile-chat-shell tree in messages/[id]/page.tsx.
export function MobileChatDetail({
  thread,
  currentUserId,
  send,
}: {
  thread?: ChatThread;
  currentUserId?: string;
  send?: (formData: FormData) => void | Promise<void>;
}) {
  const D = M_CHAT_311;
  const title = thread ? threadNameFor(thread, currentUserId ?? "") : D.header.title;
  const messageRows = thread
    ? [
        ...thread.messages.map((message): MobileMessage => ({
          author: message.author.id === currentUserId ? "You" : message.author.name,
          initials: initials(message.author.name),
          role: roleLabel(message.author.role),
          roleTone: message.author.role === "caregiver" ? "purple" : "blue",
          bg: "#1c1c1c",
          time: formatTime(message.createdAt),
          body: message.body,
        })),
        ...D.messages
          .filter((message) => "icon" in message)
          .map((message) => message as MobileMessage),
      ]
    : D.messages;
  return (
    <div className="md:hidden -mx-4 -mt-4 min-h-[100dvh]" style={{ background: "#000" }}>
      <header className="flex items-start gap-2 px-4 py-3">
        <Link
          href="/messages"
          aria-label="Back"
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft className="size-5 text-white" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-bold leading-tight text-white">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-[11.5px] text-[#999]">
            Room 311  ·  Med Surg  ·  <span className="text-[#86efac]">Inpatient</span>  ·  MRN 854321
          </p>
        </div>
        <button
          className="grid h-10 shrink-0 items-center gap-1 rounded-full px-2.5"
          style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)" }}
        >
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
            <Users className="size-3.5" />
            {thread?.members.length ?? D.header.participants}
          </span>
        </button>
        <button className="relative grid size-10 shrink-0 place-items-center rounded-full" aria-label="Notifications">
          <Bell className="size-5 text-white" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full" style={{ background: "#d4a847" }} />
        </button>
      </header>

      <nav className="grid grid-cols-4 gap-0 px-4">
        <Tab active label="Messages" icon={<MessageIcon />} />
        <Tab label="Tasks" icon={<ClipboardList className="size-4" />} />
        <Tab label="Files" icon={<FileText className="size-4" />} />
        <Tab label="Care Plan" icon={<HeartPulse className="size-4" />} />
      </nav>

      <div className="flex flex-col gap-4 px-4 py-4">
        {messageRows.map((m, i) => {
          if ("kind" in m && m.kind === "divider") {
            return (
              <div key={i} className="my-1 flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(212,168,71,0.5)]" />
                <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#d4a847]">
                  {(m as { label: string }).label}
                </span>
                <div className="h-px flex-1 bg-[rgba(212,168,71,0.5)]" />
              </div>
            );
          }
          const msg = m as MobileMessage;
          return <MessageRow key={i} message={msg} />;
        })}
      </div>

      <SnapshotBar />

      <div className="px-4 pt-2">
        <div
          className="flex items-stretch gap-2 rounded-xl px-3 py-2 text-[11.5px]"
          style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Clock />
            <div className="min-w-0">
              <div className="font-semibold text-white">Med alert</div>
              <div className="text-[#d4a847]">{D.alerts.med.name}</div>
              <div className="text-[10.5px] text-[#888]">{D.alerts.med.note}</div>
            </div>
          </div>
          <span className="my-auto h-8 w-px bg-[rgba(255,255,255,0.08)]" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FlaskConical className="size-3.5 text-[#c4b5fd]" />
            <div className="min-w-0">
              <div className="font-semibold text-white">Lab alert</div>
              <div className="text-[#f87171]">{D.alerts.lab.name}</div>
              <div className="text-[10.5px] text-[#888]">{D.alerts.lab.note}</div>
            </div>
          </div>
          <a href="#" className="ml-2 self-center text-[11.5px] font-semibold text-[#d4a847]">
            View all
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pt-3">
        <ActionChip icon={<Users className="size-3.5 text-[#d4a847]" />}>Handoff</ActionChip>
        <ActionChip icon={<FileText className="size-3.5 text-[#d4a847]" />}>Post report</ActionChip>
        <ActionChip icon={<UserPlus className="size-3.5 text-[#d4a847]" />}>Invite family</ActionChip>
      </div>

      <Composer send={send} title={title} />

      <div className="h-[100px]" />
    </div>
  );
}

function MessageRow({
  message,
}: {
  message: MobileMessage;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="relative shrink-0">
        <span
          className="grid size-9 place-items-center rounded-full text-[11px] font-bold text-white"
          style={{
            background: message.bg ?? "#1c1c1c",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {"initials" in message && message.initials ? (
            message.initials
          ) : message.icon === "mortar" ? (
            <MortarIcon />
          ) : message.icon === "flask" ? (
            <FlaskConical className="size-4" />
          ) : message.icon === "lungs" ? (
            <LungsIcon />
          ) : null}
        </span>
        <span
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full"
          style={{ background: "#22c55e", border: "2px solid #000" }}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-[#d4a847]">{message.author}</span>
          {message.role && <RoleTag tone={message.roleTone} label={message.role} />}
          <span className="ml-auto text-[10.5px] text-[#888]">{message.time}</span>
        </div>
        <div className="mt-1 whitespace-pre-wrap text-[13.5px] leading-snug text-white">
          {message.body}
        </div>

        {"chips" in message && message.chips && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.chips.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold"
                style={
                  c.tone === "red"
                    ? {
                        background: "rgba(239,68,68,0.14)",
                        color: "#f87171",
                        borderColor: "rgba(248,113,113,0.4)",
                      }
                    : {
                        background: "rgba(255,255,255,0.05)",
                        color: "#bbb",
                        borderColor: "rgba(255,255,255,0.1)",
                      }
                }
              >
                {c.alert && <ShieldAlert className="size-3" />}
                {c.label}
              </span>
            ))}
          </div>
        )}

        {"attachment" in message && message.attachment && (
          <div
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              className="grid size-6 place-items-center rounded-md text-[9px] font-bold text-white"
              style={{ background: "#dc2626" }}
            >
              PDF
            </span>
            <span className="font-semibold text-white">{message.attachment.name}</span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[#bbb]"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              {message.attachment.kind}
            </span>
          </div>
        )}

        {"labCard" in message && message.labCard && (
          <div
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold text-white">{message.labCard.name}</div>
              <div className="text-[10.5px] text-[#888]">{message.labCard.collected}</div>
            </div>
            <div className="inline-flex items-center gap-1 text-[14px] font-bold text-[#f87171]">
              {message.labCard.value}
              <ArrowUp className="size-3.5" />
            </div>
            <a
              href="#"
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold text-[#c4b5fd]"
              style={{
                background: "rgba(167,139,250,0.14)",
                borderColor: "rgba(196,181,253,0.32)",
              }}
            >
              Result <ChevronRight className="size-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleTag({ tone, label }: { tone?: "purple" | "red" | "green" | "blue"; label: string }) {
  const tones: Record<string, string> = {
    purple: "bg-[rgba(167,139,250,0.18)] text-[#c4b5fd] border-[rgba(196,181,253,0.32)]",
    red: "bg-[rgba(239,68,68,0.16)] text-[#f87171] border-[rgba(248,113,113,0.32)]",
    green: "bg-[rgba(34,197,94,0.16)] text-[#86efac] border-[rgba(134,239,172,0.32)]",
    blue: "bg-[rgba(96,165,250,0.16)] text-[#93c5fd] border-[rgba(147,197,253,0.32)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${tones[tone ?? "purple"]}`}
    >
      {label}
    </span>
  );
}

function Tab({
  active,
  label,
  icon,
}: {
  active?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      className="flex flex-col items-center gap-1.5 py-2"
      style={{ color: active ? "#d4a847" : "#888" }}
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
        {icon}
        {label}
      </span>
      <span
        className="h-[2px] w-full max-w-[110px] rounded-full"
        style={{ background: active ? "#d4a847" : "transparent" }}
      />
    </button>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MortarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 9h14l-2 4a4 4 0 0 1-4 3h-2a4 4 0 0 1-4-3z" />
      <path d="M12 5v4" />
    </svg>
  );
}

function LungsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 5v8" />
      <path d="M9 6a4 4 0 0 0-4 4v6a2 2 0 0 0 2 2h2V6z" />
      <path d="M15 6a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2h-2V6z" />
    </svg>
  );
}

function Clock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a847" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function SnapshotBar() {
  const D = M_CHAT_311;
  return (
    <div className="mx-4 mt-3">
      <div
        className="relative rounded-xl px-3 py-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <button
          aria-label="Collapse"
          className="absolute -top-2 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full"
          style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.16)" }}
        >
          <ChevronUp className="size-3 text-[#bbb]" />
        </button>
        <div className="grid grid-cols-[1.1fr_0.9fr_1.2fr] gap-3 text-[11.5px]">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#d4a847]">
              <ClipboardList className="size-3.5" /> Patient snapshot
            </div>
            <div className="text-[#f87171]">
              <span className="text-[#bbb]">Allergy:</span> {D.snapshot.allergy}
            </div>
            <div className="text-[#86efac]">
              <span className="text-[#bbb]">Code status:</span> {D.snapshot.codeStatus}
            </div>
            <div className="text-[#bbb]">Isolation: {D.snapshot.isolation}</div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-[#d4a847]">
              Care team ({D.snapshot.careTeamCount})
            </div>
            <div className="flex items-center -space-x-2">
              {D.snapshot.careTeam.map((avatar, i) => (
                <span
                  key={avatar}
                  className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-white"
                  style={{
                    background: ["#7c2d12", "#6b46c1", "#065f46", "#1e3a8a"][i] ?? "#1c1c1c",
                    border: "2px solid #000",
                  }}
                >
                  {avatar}
                </span>
              ))}
              <span
                className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-[#bbb]"
                style={{
                  background: "#1c1c1c",
                  border: "2px solid #000",
                }}
              >
                +{D.snapshot.careTeamExtra}
              </span>
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold text-[#d4a847]">
              <span>Current tasks ({D.snapshot.currentTasks.length})</span>
              <a href="#" className="text-[11px] font-semibold text-[#d4a847]">View all</a>
            </div>
            <ul className="flex flex-col gap-0.5">
              {D.snapshot.currentTasks.map((t) => (
                <li key={t.name} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: t.tone === "high" ? "#ef4444" : "#f97316" }}
                  />
                  <span className="text-white">{t.name}</span>
                  <span className="ml-auto text-[#888]">{t.due}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold text-white"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)" }}
    >
      {icon}
      {children}
    </button>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Family";
  if (role === "aps") return "Service";
  return role || "Care team";
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function threadNameFor(thread: ChatThread, currentUserId: string) {
  const others = thread.members
    .filter((member) => member.user.id !== currentUserId)
    .map((member) => member.user.name);
  if (others.length === 0) return "Private notes";
  if (others.length === 1) return others[0];
  return others.join(", ");
}

function Composer({
  send,
  title,
}: {
  send?: (formData: FormData) => void | Promise<void>;
  title: string;
}) {
  return (
    <form action={send} className="px-4 pt-3">
      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        <button type="button" aria-label="Attach" className="grid size-7 place-items-center text-[#bbb]">
          <Paperclip className="size-4" />
        </button>
        <input
          name="body"
          required
          placeholder={`Message ${title}`}
          className="h-9 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-[#666]"
        />
        <button type="button" aria-label="Emoji" className="grid size-7 place-items-center text-[#bbb]">
          <Smile className="size-4" />
        </button>
      </div>
      <div className="-mt-9 mb-1 flex justify-end pr-1">
        <button
          type="submit"
          aria-label="Send"
          className="relative z-[1] grid size-9 place-items-center rounded-full"
          style={{ background: "#d4a847", color: "#1b1712", boxShadow: "0 4px 12px rgba(212,168,71,0.4)" }}
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </form>
  );
}
