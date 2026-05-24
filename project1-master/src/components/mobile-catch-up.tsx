"use client";

import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardList,
  Clock,
  Filter,
  FlaskConical,
  MessageCircle,
  ShieldAlert,
  Users,
} from "lucide-react";
import { HaloMark } from "@/components/glass";
import type { CatchUpData } from "@/lib/catch-up";
import { M_CATCH_UP, M_TOP_BAR, type Severity } from "@/lib/mobile-demo";

// Mobile Catch Up — image 8. Keeps the same export signature so the
// page.tsx caller doesn't change; props are unused while we render
// static fixtures.
export function MobileCatchUp(_props: {
  user: { id: string; name: string; role: string };
  data?: CatchUpData;
}) {
  const D = M_CATCH_UP;
  const data = _props.data;
  const stats = data
    ? [
        { icon: "chat", label: "Open threads", value: String(data.stats.openThreads), tone: "neutral" as const },
        { icon: "alert", label: "Urgent updates", value: String(data.stats.urgentUpdates), tone: "critical" as const },
        { icon: "clipboard", label: "Unresolved items", value: String(data.stats.unresolvedItems), tone: "neutral" as const },
        { icon: "users", label: "Patients need attention", value: String(data.stats.patientsNeedingAttention), tone: "neutral" as const },
      ]
    : D.stats;
  const needingAttention = data?.needingAttention ?? D.needingAttention;
  const recentActivity = data?.recentActivity ?? D.recentActivity;
  const unresolved = data?.unresolved ?? D.unresolved;
  return (
    <div className="md:hidden -mx-4 min-h-[100dvh] pb-[140px]" style={{ background: "#000" }}>
      <MobileTopHeader />

      <div className="px-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-white">Catch Up</h1>
            <p className="mt-1 text-[12px] text-[#888]">{D.subtitle}</p>
          </div>
          {D.onShift && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.1)] px-2.5 py-1 text-[11.5px] font-semibold text-[#86efac]">
              <span className="size-1.5 rounded-full bg-[#22c55e]" /> On shift
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 overflow-x-auto px-4 pb-2 mobile-need-scroll">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} tone={s.tone} />
        ))}
      </div>

      <div className="px-4 pt-4">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-[#d4a847]" />
                Patients needing attention
              </span>
            }
            right={`View all (${needingAttention.length})`}
          />
          <div className="-mx-1">
            {needingAttention.map((p, i) => (
              <a
                key={"recipientId" in p ? p.recipientId : p.room}
                href="#"
                className={`flex items-center gap-2 px-1 py-2 ${i !== needingAttention.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}
              >
                <span className="w-[44px] shrink-0 text-[12px] font-semibold text-white">
                  {p.room}
                </span>
                <span className="shrink-0 text-[13.5px] font-semibold text-white">
                  {p.name}, {p.age}
                </span>
                <SeverityPill severity={p.severity} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#bbb]">
                  {"statusLine" in p ? p.statusLine : p.status}
                </span>
                <span className="shrink-0 text-[10.5px] text-[#777]">
                  {"timeAgo" in p ? p.timeAgo : p.time}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-[#555]" />
              </a>
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-[#d4a847]" />
                Recent activity
              </span>
            }
            right={
              <span className="inline-flex items-center gap-1 text-[12px] text-[#bbb]">
                Filter <Filter className="size-3 text-[#d4a847]" />
              </span>
            }
          />
          <div className="relative pt-1">
            <span className="absolute bottom-3 left-[68px] top-3 w-px bg-[rgba(255,255,255,0.08)]" />
            {recentActivity.map((a) => (
              <div
                key={a.time + a.title}
                className="grid grid-cols-[56px_24px_1fr_auto] items-start gap-2 py-2.5"
              >
                <span className="text-[11px] font-semibold text-[#888]">{a.time}</span>
                <ActivityIcon kind={a.icon} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-white">{a.title}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-[#d4a847]">{a.by}</div>
                </div>
                <ActivityTag tag={a.tag} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <ClipboardList className="size-4 text-[#d4a847]" />
                Unresolved items
              </span>
            }
            right={`View all (${unresolved.length})`}
          />
          <div>
            {unresolved.map((u, i) => (
              <div
                key={u.title}
                className={`flex items-center gap-2.5 py-2.5 ${i !== unresolved.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: dotColor(u.severity) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-white">{u.title}</div>
                </div>
                <span className="truncate text-[11.5px] text-[#888]">{u.who}</span>
                <span
                  className="text-[11.5px] font-semibold"
                  style={{ color: dueColor(u.severity) }}
                >
                  {u.due}
                </span>
                <ChevronRight className="size-3.5 text-[#555]" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Shared mobile bits used by other mobile screens ----------

export function MobileTopHeader({
  showBell = true,
  initials = M_TOP_BAR.initials,
}: {
  showBell?: boolean;
  initials?: string;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <HaloMark size={26} />
        <span className="text-[20px] font-bold tracking-tight text-white">Halo</span>
      </div>
      <div className="flex items-center gap-3">
        {showBell && (
          <button className="relative grid size-9 place-items-center rounded-full" aria-label="Notifications">
            <Bell className="size-5 text-white" />
            <span className="absolute right-1 top-1 size-2 rounded-full" style={{ background: "#d4a847" }} />
          </button>
        )}
        <div className="relative">
          <span
            className="grid size-9 place-items-center rounded-full text-[12px] font-bold text-white"
            style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {initials}
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full"
            style={{ background: "#22c55e", border: "2px solid #000" }}
          />
        </div>
      </div>
    </header>
  );
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: string;
  label: string;
  tone: "neutral" | "critical";
}) {
  const Icon =
    icon === "chat"
      ? MessageCircle
      : icon === "alert"
        ? ShieldAlert
        : icon === "clipboard"
          ? ClipboardList
          : Users;
  const iconColor = tone === "critical" ? "#ef4444" : "#d4a847";
  return (
    <div
      className="flex w-[170px] shrink-0 flex-col gap-2 rounded-2xl px-3.5 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <Icon className="size-5" style={{ color: iconColor }} />
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold tracking-tight text-white">{value}</span>
        <span className="text-[12px] leading-tight text-[#bbb]">{label}</span>
      </div>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: "alert" | "chat" | "clipboard" | "check" | "flask" }) {
  const Icon =
    kind === "alert"
      ? ShieldAlert
      : kind === "chat"
        ? MessageCircle
        : kind === "clipboard"
          ? Clipboard
          : kind === "check"
            ? CheckCircle2
            : FlaskConical;
  return (
    <span
      className="relative z-[1] grid size-6 place-items-center rounded-full"
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.12)",
        color: kind === "alert" ? "#ef4444" : "#d4a847",
      }}
    >
      <Icon className="size-3" />
    </span>
  );
}

function ActivityTag({ tag }: { tag: "Lab" | "Chat" | "Care Plan" | "MAR" }) {
  const tones: Record<string, string> = {
    Lab: "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd] border-[rgba(196,181,253,0.32)]",
    Chat: "bg-[rgba(96,165,250,0.14)] text-[#93c5fd] border-[rgba(147,197,253,0.32)]",
    "Care Plan": "bg-[rgba(34,197,94,0.14)] text-[#86efac] border-[rgba(134,239,172,0.32)]",
    MAR: "bg-[rgba(255,255,255,0.06)] text-[#bbb] border-[rgba(255,255,255,0.12)]",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold ${tones[tag]}`}
    >
      {tag}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  const tones: Record<string, string> = {
    high: "bg-[rgba(239,68,68,0.14)] text-[#f87171] border-[rgba(248,113,113,0.32)]",
    med: "bg-[rgba(234,179,8,0.14)] text-[#facc15] border-[rgba(250,204,21,0.32)]",
    low: "bg-[rgba(234,179,8,0.12)] text-[#facc15] border-[rgba(250,204,21,0.28)]",
    stable: "bg-[rgba(34,197,94,0.14)] text-[#86efac] border-[rgba(134,239,172,0.32)]",
    info: "bg-[rgba(96,165,250,0.12)] text-[#93c5fd] border-[rgba(147,197,253,0.28)]",
  };
  const labels: Record<string, string> = {
    high: "High",
    med: "Med",
    low: "Low",
    stable: "Stable",
    info: "Info",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${tones[severity]}`}
    >
      {labels[severity]}
    </span>
  );
}

function dotColor(severity: Severity): string {
  return severity === "high"
    ? "#ef4444"
    : severity === "med"
      ? "#f97316"
      : severity === "low"
        ? "#eab308"
        : severity === "stable"
          ? "#6b7280"
          : "#60a5fa";
}

function dueColor(severity: Severity): string {
  return severity === "high"
    ? "#f87171"
    : severity === "med"
      ? "#fb923c"
      : severity === "low"
        ? "#facc15"
        : "#888";
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  right,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div className="text-[15px] font-bold text-white">{title}</div>
      {typeof right === "string" ? (
        <a className="text-[12px] font-semibold text-[#d4a847]" href="#">
          {right}
        </a>
      ) : (
        right
      )}
    </div>
  );
}
