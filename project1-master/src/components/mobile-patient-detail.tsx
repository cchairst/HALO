"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardList,
  Clock,
  Droplet,
  Edit3,
  FileText,
  FlaskConical,
  HeartPulse,
  MessageCircle,
  RotateCw,
  UserPlus,
  Users,
} from "lucide-react";
import { createCareReport, resolveCareReport } from "@/app/actions";
import { Card, CardHeader } from "@/components/mobile-catch-up";
import { M_MARGARET } from "@/lib/mobile-demo";

type PatientReport = {
  id: string;
  title: string;
  body: string;
  type: string;
  priority: string;
  resolvedAt: Date | null;
  createdAt: Date;
  authorName: string;
  authorRole: string;
};

export type MobilePatientDetailData = {
  id: string;
  name: string;
  age: number;
  pronouns: string | null;
  room: string | null;
  facility: string | null;
  allergies: string | null;
  notes: string | null;
  status: string;
  members: Array<{ id: string; userId: string; name: string; role: string; familyKind: string | null }>;
  reports: PatientReport[];
  canPost: boolean;
  canMarkInternal: boolean;
  isLocked: boolean;
};

// Mobile Patient chart — image 12. Signature preserved.
export function MobilePatientDetail(_props: {
  patient?: MobilePatientDetailData;
  currentUserId: string;
  currentRole: string;
  recipient: unknown;
  members: unknown;
  familyContacts: unknown;
  offerings: unknown;
  reports: unknown;
  canPost: boolean;
  canMarkInternal: boolean;
  isLocked: boolean;
}) {
  const D = M_MARGARET;
  const patient = _props.patient;
  const room = patient?.room ?? patient?.facility ?? D.room;
  const careTeam =
    patient && patient.members.length > 0
      ? patient.members.map((member) => ({
          initials: initials(member.name),
          name: member.name,
          role: roleLabel(member.role),
          bg: "#1c1c1c",
          presence: "active" as const,
        }))
      : D.careTeam;
  const reports =
    patient && patient.reports.length > 0
      ? patient.reports.slice(0, 6).map((report) => ({
          id: report.id,
          time: formatTime(report.createdAt),
          title: report.title,
          by: `${report.authorName} (${roleLabel(report.authorRole)})`,
          resolvedAt: report.resolvedAt,
          ...reportVisual(report.type),
        }))
      : D.reports;
  return (
    <div className="md:hidden -mx-4 min-h-[100dvh] pb-[140px]" style={{ background: "#000" }}>
      <header className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="flex flex-1 items-start gap-2">
          <Link
            href="/recipients"
            aria-label="Back"
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            <ArrowLeft className="size-5 text-white" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-white">
              {patient?.name ?? D.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-[#999]">
              <span>{room}</span>
              <span className="text-[#666]">·</span>
              <span>Age {patient?.age ?? D.age}</span>
              <span className="text-[#666]">·</span>
              <span>{patient?.pronouns ?? D.sex}</span>
              <span className="text-[#666]">·</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.1)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#86efac]">
                <span className="size-1.5 rounded-full bg-[#22c55e]" /> {statusLabel(patient?.status) ?? D.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <HeaderAction icon={<MessageCircle className="size-4" />} label={["Message", "care team"]} />
          <HeaderAction icon={<FileText className="size-4" />} label={["Post", "report"]} href="#mobile-post-report" />
          <HeaderAction icon={<UserPlus className="size-4" />} label={["Invite", "family"]} />
        </div>
      </header>

      <div className="px-4 pt-1">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-[#d4a847]" /> Care team
              </span>
            }
            right={`View all (${careTeam.length})`}
          />
          <div className="flex gap-3 overflow-x-auto pb-1 mobile-need-scroll">
            {careTeam.map((m) => (
              <div key={m.name} className="flex w-[100px] shrink-0 flex-col items-center gap-1.5">
                <div className="relative">
                  <span
                    className="grid size-12 place-items-center rounded-full text-[12px] font-bold text-white"
                    style={{
                      background: m.bg ?? "#1c1c1c",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {m.initials}
                  </span>
                  {m.presence === "active" && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full"
                      style={{ background: "#22c55e", border: "2px solid #000" }}
                    />
                  )}
                </div>
                <div className="w-full truncate text-center text-[11.5px] font-semibold text-white">
                  {m.name}
                </div>
                <div className="w-full truncate text-center text-[10px] text-[#888]">
                  {m.role}
                </div>
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
                <ClipboardList className="size-4 text-[#d4a847]" /> Patient summary
              </span>
            }
            right={
              <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#d4a847]">
                <Edit3 className="size-3" /> Edit
              </button>
            }
          />
          <div className="grid grid-cols-5 gap-3 text-[11.5px]">
            <SummaryItem label="Allergies" value={patient?.allergies ?? "None documented"} valueTone="#d4a847" />
            <SummaryItem label="Mobility" value={patient?.notes ? "See notes" : D.summary.mobility} />
            <SummaryItem label="Language" value={D.summary.language} />
            <SummaryItem label="Code status" value={D.summary.codeStatus} />
            <SummaryItem label="Notes" value={patient?.notes ?? D.summary.notes} long />
          </div>
        </Card>
      </div>

      {patient?.canPost ? (
        <div id="mobile-post-report" className="px-4 pt-3">
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-4 text-[#d4a847]" /> Post report
                </span>
              }
            />
            <form action={createCareReport} className="grid grid-cols-2 gap-2.5">
              <input type="hidden" name="recipientId" value={patient.id} />
              <input type="hidden" name="redirectTo" value={`/recipients/${patient.id}`} />
              <select name="type" defaultValue="pain" className="halo-input">
                <option value="pain">Pain</option>
                <option value="lab">Lab</option>
                <option value="handoff">Handoff</option>
                <option value="medication">Medication</option>
                <option value="note">Note</option>
              </select>
              <select name="priority" defaultValue="high" className="halo-input">
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
              <input name="title" required placeholder="Pain reassessment" className="halo-input col-span-2" />
              <textarea
                name="body"
                required
                rows={3}
                placeholder="What should the care team know?"
                className="halo-input col-span-2"
                style={{ resize: "none" }}
              />
              <button
                type="submit"
                className="col-span-2 h-11 rounded-full px-4 text-[14px] font-semibold text-black"
                style={{ background: "#d4a847" }}
              >
                Post report
              </button>
            </form>
          </Card>
        </div>
      ) : null}

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4 text-[#d4a847]" /> Recent reports
              </span>
            }
            right="View all"
          />
          <div className="relative">
            <span className="absolute bottom-3 left-[68px] top-3 w-px bg-[rgba(255,255,255,0.08)]" />
            {reports.map((r) => (
              <div key={r.time + r.title} className="grid grid-cols-[56px_24px_1fr_auto] items-start gap-2 py-2">
                <span className="text-[11px] font-semibold text-[#888]">{r.time}</span>
                <ReportIcon kind={r.icon} />
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-white">{r.title}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-[#d4a847]">{r.by}</div>
                  {patient?.canPost && "id" in r && !r.resolvedAt ? (
                    <form action={resolveCareReport} className="mt-1">
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-[11px] font-semibold text-[#86efac]" type="submit">
                        Mark resolved
                      </button>
                    </form>
                  ) : null}
                </div>
                <ReportTag tag={r.tag} />
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
                <Users className="size-4 text-[#d4a847]" /> Care handoff
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="mb-2 text-[12.5px] font-bold text-white">Active plan</div>
              <ul className="flex flex-col gap-2">
                {D.handoff.activePlan.map((p) => (
                  <li key={p.title} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#22c55e]" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-white">{p.title}</div>
                      <div className="text-[10.5px] text-[#888]">{p.note}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="mb-2 flex items-center gap-2 text-[12.5px] font-bold text-white">
                <Clock className="size-3.5 text-[#d4a847]" /> Upcoming tasks
              </div>
              <ul className="flex flex-col gap-2">
                {D.handoff.upcoming.map((t) => (
                  <li key={t.title} className="text-[11.5px]">
                    <div className="text-[11px] text-[#888]">{t.time}</div>
                    <div className="text-[12px] font-semibold text-white">{t.title}</div>
                    <div className="text-[10.5px] text-[#d4a847]">{t.who}</div>
                  </li>
                ))}
              </ul>
              <a href="#" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#d4a847]">
                View all tasks ({D.handoff.totalTasks}) <ChevronRight className="size-3" />
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <HeartPulse className="size-4 text-[#d4a847]" /> Vitals
                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#888]">
                  <RotateCw className="size-3" /> {D.vitals.time}
                </span>
              </span>
            }
            right="View trends"
          />
          <div className="grid grid-cols-6 gap-2">
            {D.vitals.items.map((v) => (
              <div
                key={v.label}
                className="rounded-lg px-2 py-2 text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[#999]">
                  {v.label}
                </div>
                <div
                  className="mt-0.5 text-[16px] font-bold leading-tight"
                  style={{ color: vitalsColor(v.tone) }}
                >
                  {v.value}
                </div>
                <div className="text-[9.5px] text-[#777]">{v.unit}</div>
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
                <FlaskConical className="size-4 text-[#d4a847]" /> Labs
                <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#888]">
                  <RotateCw className="size-3" /> {D.labs.time}
                </span>
              </span>
            }
            right="View all"
          />
          <div className="grid grid-cols-6 gap-2">
            {D.labs.items.map((l) => (
              <div key={l.name} className="text-center">
                <div className="text-[11px] font-semibold text-white">{l.name}</div>
                <div
                  className="mt-0.5 inline-flex items-center gap-0.5 text-[14px] font-bold"
                  style={{ color: l.tone === "red" ? "#f87171" : "#fff" }}
                >
                  {l.value}
                  {l.trend === "up" && <ArrowUp className="size-3" />}
                  {l.trend === "down" && <ArrowDown className="size-3" />}
                </div>
                <div className="text-[10px] text-[#777]">{l.unit}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Clipboard className="size-4 text-[#d4a847]" /> Medications
              </span>
            }
            right={<a className="text-[12px] font-semibold text-[#d4a847]" href="#">{D.medications.nextDueLabel}</a>}
          />
          <a
            href="#"
            className="-mx-1 flex items-start gap-2 rounded-lg px-1 py-1"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-white">{D.medications.name}</span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: "rgba(167,139,250,0.18)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(196,181,253,0.32)",
                  }}
                >
                  {D.medications.chip}
                </span>
              </div>
              <div className="text-[11px] text-[#888]">{D.medications.detail}</div>
              <div className="mt-1.5 text-[10.5px] text-[#999]">{D.medications.availableLabel}</div>
              <div className="text-[11px] font-semibold text-[#d4a847]">
                {D.medications.nextEligible}
              </div>
            </div>
            <ChevronRight className="mt-1 size-3.5 text-[#555]" />
          </a>
        </Card>
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Droplet className="size-4 text-[#d4a847]" /> I&O (24h)
              </span>
            }
            right="View all"
          />
          <div className="grid grid-cols-3 gap-2">
            <IOStat label="Intake" value={D.io.intake} unit={D.io.unit} color="#60a5fa" />
            <IOStat label="Output" value={D.io.output} unit={D.io.unit} color="#fb923c" />
            <IOStat label="Net" value={D.io.net} unit={D.io.unit} color="#22c55e" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function HeaderAction({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: [string, string];
  href?: string;
}) {
  const content = (
    <>
      <span className="text-white">{icon}</span>
      <span className="text-[9.5px] font-semibold leading-tight text-white">{label[0]}</span>
      <span className="-mt-1 text-[9.5px] font-semibold leading-tight text-white">{label[1]}</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="flex w-[64px] flex-col items-center gap-1 rounded-2xl py-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      className="flex w-[64px] flex-col items-center gap-1 rounded-2xl py-2"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      {content}
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

function statusLabel(status?: string | null) {
  if (!status) return null;
  return status
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function reportVisual(type: string): {
  icon: "clipboard" | "chat" | "flask" | "check";
  tag: "Care Plan" | "Chat" | "Lab" | "MAR";
} {
  if (type === "lab") return { icon: "flask", tag: "Lab" };
  if (type === "medication") return { icon: "check", tag: "MAR" };
  if (type === "handoff") return { icon: "clipboard", tag: "Care Plan" };
  return { icon: "chat", tag: "Chat" };
}

function SummaryItem({
  label,
  value,
  long,
  valueTone,
}: {
  label: string;
  value: string;
  long?: boolean;
  valueTone?: string;
}) {
  return (
    <div className={long ? "col-span-1" : ""}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[#888]">{label}</div>
      <div
        className="mt-0.5 text-[11.5px] leading-tight text-white"
        style={{ color: valueTone }}
      >
        {value}
      </div>
    </div>
  );
}

function ReportIcon({ kind }: { kind: "clipboard" | "chat" | "flask" | "check" }) {
  const Icon =
    kind === "clipboard"
      ? Clipboard
      : kind === "chat"
        ? MessageCircle
        : kind === "flask"
          ? FlaskConical
          : CheckCircle2;
  return (
    <span
      className="relative z-[1] grid size-6 place-items-center rounded-full"
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#d4a847",
      }}
    >
      <Icon className="size-3" />
    </span>
  );
}

function ReportTag({ tag }: { tag: "Care Plan" | "Chat" | "Lab" | "MAR" }) {
  const tones: Record<string, string> = {
    "Care Plan": "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd] border-[rgba(196,181,253,0.32)]",
    Chat: "bg-[rgba(96,165,250,0.14)] text-[#93c5fd] border-[rgba(147,197,253,0.32)]",
    Lab: "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd] border-[rgba(196,181,253,0.32)]",
    MAR: "bg-[rgba(255,255,255,0.06)] text-[#bbb] border-[rgba(255,255,255,0.12)]",
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${tones[tag]}`}
    >
      {tag}
    </span>
  );
}

function vitalsColor(tone: "neutral" | "green" | "yellow" | "blue" | "purple"): string {
  switch (tone) {
    case "green":
      return "#86efac";
    case "yellow":
      return "#facc15";
    case "blue":
      return "#60a5fa";
    case "purple":
      return "#c4b5fd";
    default:
      return "#ffffff";
  }
}

function IOStat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#888]">{label}</div>
      <div
        className="mt-0.5 text-[15px] font-bold leading-tight"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[9.5px] text-[#777]">{unit}</div>
    </div>
  );
}
