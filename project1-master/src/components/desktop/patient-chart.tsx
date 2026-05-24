import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  FileText,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { assignHomework, createCareReport, resolveCareReport } from "@/app/actions";
import { cn } from "@/lib/cn";
import { MARGARET_CHART } from "@/lib/desktop-demo";
import { Avatar, MutedTag, Panel, RiskPill } from "./bits";
import { DesktopTopBar } from "./top-bar";
import { InviteLauncher } from "@/components/invite-dialog";
import {
  FamilyContactsPanel,
  type FamilyContactRow,
} from "@/components/family-contacts-panel";

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

type RecentReportGroup = {
  group: string;
  items: Array<{
    id?: string;
    time: string;
    title: string;
    by: string;
    tag?: "New";
    resolvedAt?: Date | null;
  }>;
};

export type PatientTaskRow = {
  id: string;
  title: string;
  subtitle: string | null;
  kind: string;
  createdAt: Date;
  completedAt: Date | null;
  painScore: number | null;
  note: string | null;
  photoUrl: string | null;
  assignedByName: string;
};

export type DesktopPatientChartData = {
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
  tasks: PatientTaskRow[];
  // Pre-port the patient chart embedded FamilyContactsPanel for next-of-kin
  // management + per-row family-invite. Reinstated alongside the chart-port
  // so nurses can add/edit contacts and send invites from desktop again.
  familyContacts: FamilyContactRow[];
  canPost: boolean;
  canMarkInternal: boolean;
  // True when the viewer can mutate family contacts — caregiver on an
  // unlocked chart. Separate from canPost in case we ever loosen one.
  canEditFamily: boolean;
  isLocked: boolean;
};

export function DesktopPatientChart({ patient }: { patient?: DesktopPatientChartData }) {
  const D = MARGARET_CHART;
  const room = patient?.room ? formatRoom(patient.room) : patient?.facility ?? D.room;
  const unit = patient?.facility ?? D.unit;
  const careTeam =
    patient && patient.members.length > 0
      ? patient.members.map((member) => ({
          initials: initialsFromName(member.name),
          name: member.name,
          role: roleLabel(member.role),
          dot: "active" as const,
        }))
      : D.careTeam;
  const allergies = patient?.allergies
    ? patient.allergies.split(",").map((item) => item.trim()).filter(Boolean)
    : patient
      ? ["None documented"]
      : D.summary.allergies;
  const notes = patient?.notes
    ? patient.notes.split("\n").map((item) => item.trim()).filter(Boolean)
    : D.summary.notes;
  const recentReports: RecentReportGroup[] =
    patient && patient.reports.length > 0
      ? [
          {
            group: "Recent",
            items: patient.reports.slice(0, 8).map((report) => ({
              id: report.id,
              time: formatTime(report.createdAt),
              title: report.title,
              by: `${report.authorName} - ${roleLabel(report.authorRole)}`,
              tag: report.resolvedAt ? undefined : ("New" as const),
              resolvedAt: report.resolvedAt,
            })),
          },
        ]
      : D.recentReports.map((group) => ({
          group: group.group,
          items: group.items.map((item) => ({ ...item, resolvedAt: null })),
        }));
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
              {patient?.name ?? D.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.1)] px-2 py-0.5 text-[11.5px] font-semibold text-[#86efac]">
              <span className="status-dot" /> On unit
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink-2)]">{room}</span>
            <Separator />
            <span>{unit}</span>
            <Separator />
            <span>{D.bed}</span>
            <Separator />
            <span>{patient ? `Age ${patient.age}${patient.pronouns ? ` - ${patient.pronouns}` : ""}` : D.demographics}</span>
            <Separator />
            <span>{D.mrn}</span>
            <Separator />
            <span>{D.admit}</span>
            <Separator />
            <span>{D.attending}</span>
          </div>
        </div>
        <DesktopTopBar time="7:42 AM" alertsCount={5} />
      </div>

      {/* Secondary action row */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-6 pb-3">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)]">
          <MessageCircle className="size-3.5" /> Message care team
        </button>
        {patient?.canPost ? (
          <PostReportMenu patient={patient} />
        ) : (
          <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)]">
            <FileText className="size-3.5" /> Post report
            <ChevronDown className="size-3" />
          </button>
        )}
        {patient?.canPost ? <AssignHomeworkMenu patient={patient} /> : null}
        {patient ? (
          <InviteLauncher
            recipients={[{ id: patient.id, name: patient.name }]}
            initialRecipientId={patient.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)]"
          >
            <UserPlus className="size-3.5" /> Invite
          </InviteLauncher>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] opacity-60"
          >
            <UserPlus className="size-3.5" /> Invite
          </button>
        )}
        <button className="grid size-8 place-items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)]">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Care team strip */}
      <div className="px-6">
        <Panel className="!py-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              CARE TEAM
            </div>
            {careTeam.map((m) => (
              <div key={m.initials} className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
                <Avatar initials={m.initials} size={28} bg="#272318" fg="#d9b257" presence="active" />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                    {m.name}
                  </div>
                  <div className="truncate text-[10.5px] text-[var(--muted)]">{m.role}</div>
                </div>
              </div>
            ))}
            <a href="#" className="ml-auto text-[12px] font-semibold text-[var(--gold-soft)]">
              View care team -&gt;
            </a>
          </div>
        </Panel>
      </div>

      {/* Homework panel */}
      {patient ? (
        <div className="px-6 pt-3">
          <Panel>
            <SectionTitle
              title="Homework"
              right={
                <span className="text-[11px] text-[var(--muted)]">
                  {patient.tasks.length === 0
                    ? "No tasks yet"
                    : `${patient.tasks.filter((t) => t.completedAt).length}/${patient.tasks.length} done`}
                </span>
              }
            />
            {patient.tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)]/30 px-3 py-4 text-center text-[12px] text-[var(--muted)]">
                No homework assigned. Use "Assign homework" above to send a task to the patient.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {patient.tasks.map((task) => (
                  <HomeworkRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      ) : null}

      {/* 4-column grid */}
      <div className="grid flex-1 grid-cols-1 gap-3 px-6 py-3 lg:grid-cols-4">
        {/* Col 1: Patient summary + Clinical context */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle title="Patient summary" right={<EditButton />} />
            <div className="grid grid-cols-[88px_1fr] gap-y-2 text-[12px]">
              <Label>Allergies</Label>
              <div className="flex flex-col gap-1">
                {allergies.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 text-[12px] text-[#f87171]">
                    <span className="grid size-3.5 place-items-center rounded-sm bg-[rgba(239,68,68,0.18)] text-[10px]">!</span>
                    {a}
                  </div>
                ))}
              </div>
              <Label>Mobility</Label>
              <Value>{patient?.notes ? "See patient notes" : D.summary.mobility}</Value>
              <Label>Language</Label>
              <Value>{D.summary.language}</Value>
              <Label>Diet</Label>
              <Value>{D.summary.diet}</Value>
              <Label>Code status</Label>
              <Value>{D.summary.codeStatus}</Value>
              <Label>Isolation</Label>
              <Value>{D.summary.isolation}</Value>
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <div className="text-[12.5px] font-semibold text-[var(--ink)]">Patient notes</div>
              <div className="mt-1 flex flex-col gap-1 text-[12px] leading-relaxed text-[var(--ink-2)]">
                {notes.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Clinical context</h3>
            <div className="grid grid-cols-[104px_1fr] gap-y-2 text-[12px]">
              <Label>Primary diagnosis</Label>
              <Value>{D.clinical.primaryDx}</Value>
              <Label>Admission reason</Label>
              <Value>{D.clinical.admitReason}</Value>
              <Label>Comorbidities</Label>
              <Value>{D.clinical.comorbidities}</Value>
              <Label>Fall risk</Label>
              <div>
                <RiskPill severity="high">{D.clinical.fallRisk}</RiskPill>
              </div>
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View more clinical details -&gt;
              </a>
            </div>
          </Panel>

          {patient && (
            <Panel>
              <FamilyContactsPanel
                recipientId={patient.id}
                patientName={patient.name}
                contacts={patient.familyContacts}
                canEdit={patient.canEditFamily}
                variant="desktop"
              />
            </Panel>
          )}
        </div>

        {/* Col 2: Recent reports */}
        <Panel>
          <SectionTitle
            title="Recent reports"
            right={
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                View all
              </a>
            }
          />
          <div className="flex flex-col gap-3">
            {recentReports.map((g) => (
              <div key={g.group}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  {g.group}
                </div>
                <div className="flex flex-col">
                  {g.items.map((it) => (
                    <div key={`${g.group}-${it.title}-${it.time}`} className="grid grid-cols-[72px_1fr_auto] items-start gap-2 py-1.5">
                      <span className="mt-0.5 text-[11px] text-[var(--muted)]">{it.time}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                          {it.title}
                        </div>
                        <div className="truncate text-[11px] text-[var(--muted)]">{it.by}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {it.tag === "New" && <MutedTag tone="gold">New</MutedTag>}
                        {patient?.canPost && it.id && !it.resolvedAt ? (
                          <form action={resolveCareReport}>
                            <input type="hidden" name="id" value={it.id} />
                            <button
                              type="submit"
                              className="text-[11px] font-semibold text-[var(--gold-soft)]"
                            >
                              Resolve
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-3 text-center">
            <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
              View all reports -&gt;
            </a>
          </div>
        </Panel>

        {/* Col 3: Care handoff */}
        <Panel>
          <SectionTitle
            title="Care handoff"
            right={
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                View full handoff
              </a>
            }
          />
          <div className="flex items-center justify-between text-[11.5px] text-[var(--muted)]">
            <span className="text-[12.5px] font-semibold text-[var(--ink)]">Plan of care</span>
            <span>{D.handoff.updated}</span>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {D.handoff.planOfCare.map((p) => (
              <div key={p.title} className="flex items-start gap-2">
                <span className="mt-0.5 grid size-4 place-items-center rounded-sm text-[var(--gold-soft)]">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-[var(--ink-2)]">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">{p.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-[12.5px] font-semibold text-[var(--ink)]">Upcoming (next 24h)</div>
            <div className="mt-2 flex flex-col">
              {D.handoff.upcoming.map((u) => (
                <div key={u.title} className="grid grid-cols-[60px_1fr_auto] items-center gap-2 py-1.5">
                  <span className="text-[11.5px] font-semibold text-[var(--ink-2)]">{u.time}</span>
                  <span className="truncate text-[12px] text-[var(--ink-2)]">{u.title}</span>
                  <MutedTag tone={u.tag === "Med" ? "gold" : u.tag === "Imaging" ? "blue" : "purple"}>
                    {u.tag}
                  </MutedTag>
                </div>
              ))}
            </div>
            <a href="#" className="mt-2 inline-block text-[12px] font-semibold text-[var(--gold-soft)]">
              View all upcoming -&gt;
            </a>
          </div>

          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <div className="text-[12.5px] font-semibold text-[var(--ink)]">Key handoff points</div>
            <ul className="mt-2 flex flex-col gap-1.5 text-[12px] text-[var(--ink-2)]">
              {D.handoff.keyPoints.map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-[var(--gold-soft)]" />
                  {k}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[10.5px] text-[var(--muted)]">{D.handoff.editedBy}</div>
          </div>
        </Panel>

        {/* Col 4: Vitals + Labs */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle
              title="Vitals"
              right={
                <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                  View trends
                </a>
              }
            />
            <div className="grid grid-cols-3 gap-2">
              {D.vitals.map((v) => (
                <div
                  key={v.label}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-2.5"
                >
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                    {v.label}
                  </div>
                  <div className="mt-0.5 text-[18px] font-semibold leading-none tracking-[-0.03em] text-[var(--ink)]">
                    {v.value}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--muted)]">{v.unit}</div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--muted)]">
                    <span>{v.time}</span>
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: v.trend === "watch" ? "#facc15" : "#22c55e" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                See full vital signs -&gt;
              </a>
            </div>
          </Panel>

          <Panel>
            <SectionTitle
              title="Labs"
              right={
                <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                  View all
                </a>
              }
            />
            <div className="divide-y divide-[var(--border)] text-[12px]">
              {D.labs.map((l) => (
                <div key={l.name} className="grid grid-cols-[1fr_60px_70px_1fr_24px] items-center gap-2 py-1.5">
                  <span className="font-semibold text-[var(--ink)]">{l.name}</span>
                  <span className="text-[var(--ink-2)]">{l.value}</span>
                  <span className="text-[var(--muted)]">{l.unit}</span>
                  <span className="text-right text-[10.5px] text-[var(--muted)]">{l.time}</span>
                  <span className="grid size-4 place-items-center text-[10px]">
                    {l.trend === "up" && <ArrowUp className="size-3 text-[#f87171]" />}
                    {l.trend === "down" && <ArrowDown className="size-3 text-[#86efac]" />}
                    {l.trend === "flat" && <span className="block h-px w-2 bg-[var(--muted)]" />}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 text-center">
              <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
                View all labs -&gt;
              </a>
            </div>
          </Panel>
        </div>
      </div>

      {/* Medications + I&O */}
      <div className="grid grid-cols-1 gap-3 px-6 pb-6 lg:grid-cols-[3fr_1fr]">
        <Panel>
          <SectionTitle
            title="Medications"
            right={
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                View all
              </a>
            }
          />
          <div className="divide-y divide-[var(--border)] text-[12px]">
            {D.medications.map((m) => (
              <div key={m.name} className="grid grid-cols-[80px_2fr_1fr_1fr_90px] items-center gap-3 py-2">
                <span className="font-semibold text-[var(--ink-2)]">{m.time}</span>
                <span className="text-[var(--ink)]">{m.name}</span>
                <span className="text-[var(--muted)]">{m.route}</span>
                <span className="text-[var(--ink-2)]">{m.tag}</span>
                <span
                  className={cn(
                    "text-right font-semibold",
                    m.due.startsWith("Due") ? "text-[#facc15]" : "text-[var(--muted)]",
                  )}
                >
                  {m.due}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 text-center">
            <a href="#" className="text-[12.5px] font-semibold text-[var(--gold-soft)]">
              View MAR -&gt;
            </a>
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            title="I&O (24h)"
            right={
              <a href="#" className="text-[12px] font-semibold text-[var(--gold-soft)]">
                View all
              </a>
            }
          />
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <IOStat label="Intake" value={D.io.intake} unit={D.io.intakeUnit} />
            <IOStat label="Output" value={D.io.output} unit={D.io.outputUnit} />
            <IOStat label="Net" value={D.io.netValue} unit={D.io.netUnit} tone="critical" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-[11.5px]">
            <div>
              <div className="text-[var(--muted)]">Last void</div>
              <div className="font-semibold text-[var(--ink-2)]">{D.io.lastVoid}</div>
            </div>
            <div>
              <div className="text-[var(--muted)]">BM</div>
              <div className="font-semibold text-[var(--ink-2)]">{D.io.bm}</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Separator() {
  return <span className="text-[var(--muted-2)]">|</span>;
}

function PostReportMenu({ patient }: { patient: DesktopPatientChartData }) {
  return (
    <details className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)] [&::-webkit-details-marker]:hidden">
        <FileText className="size-3.5" /> Post report
        <ChevronDown className="size-3" />
      </summary>
      <form
        action={createCareReport}
        className="absolute right-0 top-9 z-20 grid w-[360px] grid-cols-2 gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-3 shadow-2xl"
      >
        <input type="hidden" name="recipientId" value={patient.id} />
        <input type="hidden" name="redirectTo" value={`/recipients/${patient.id}`} />
        <select
          name="type"
          defaultValue="pain"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-2 text-[12px] text-[var(--ink)] outline-none"
        >
          <option value="pain">Pain</option>
          <option value="lab">Lab</option>
          <option value="handoff">Handoff</option>
          <option value="medication">Medication</option>
          <option value="note">Note</option>
        </select>
        <select
          name="priority"
          defaultValue="high"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-2 text-[12px] text-[var(--ink)] outline-none"
        >
          <option value="high">High</option>
          <option value="med">Med</option>
          <option value="low">Low</option>
        </select>
        <input
          name="title"
          required
          placeholder="Pain reassessment"
          className="col-span-2 h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <textarea
          name="body"
          required
          rows={3}
          placeholder="What should the care team know?"
          className="col-span-2 resize-none rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <button
          type="submit"
          className="col-span-2 rounded-md px-3 py-2 text-[12.5px] font-bold"
          style={{ background: "var(--gold)", color: "#1b1712" }}
        >
          Post report
        </button>
      </form>
    </details>
  );
}

function AssignHomeworkMenu({ patient }: { patient: DesktopPatientChartData }) {
  return (
    <details className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-[rgba(201,154,50,0.55)] bg-[var(--gold-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--gold-soft)] hover:bg-[rgba(201,154,50,0.18)] [&::-webkit-details-marker]:hidden">
        <ClipboardList className="size-3.5" /> Assign homework
        <ChevronDown className="size-3" />
      </summary>
      <form
        action={assignHomework}
        className="absolute right-0 top-9 z-20 grid w-[360px] grid-cols-1 gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-3 shadow-2xl"
      >
        <input type="hidden" name="recipientId" value={patient.id} />
        <select
          name="kind"
          defaultValue="walk"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-2 text-[12px] text-[var(--ink)] outline-none"
        >
          <option value="walk">Walking / movement</option>
          <option value="incision">Incision check</option>
          <option value="meds">Medications</option>
          <option value="pain">Pain rating</option>
          <option value="other">Other</option>
        </select>
        <input
          name="title"
          required
          placeholder="e.g. Walk 10 minutes around the block"
          className="h-9 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <textarea
          name="subtitle"
          rows={2}
          placeholder="Optional: instructions, what to bring back"
          className="resize-none rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
        />
        <button
          type="submit"
          className="rounded-md px-3 py-2 text-[12.5px] font-bold"
          style={{ background: "var(--gold)", color: "#1b1712" }}
        >
          Send to patient
        </button>
      </form>
    </details>
  );
}

function HomeworkRow({ task }: { task: PatientTaskRow }) {
  const done = task.completedAt !== null;
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        done
          ? "border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.06)]"
          : "border-[var(--border)] bg-[var(--surface-2)]/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)]">
          {done ? (
            <CheckCircle2 className="size-4 text-[#86efac]" />
          ) : (
            <ClipboardList className="size-4 text-[var(--gold-soft)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 truncate text-[13px] font-semibold text-[var(--ink)]">
              {task.title}
            </div>
            <div className="shrink-0 text-[10.5px] text-[var(--muted)]">
              {done
                ? `Done ${formatTime(task.completedAt!)}`
                : `Assigned ${formatTime(task.createdAt)}`}
            </div>
          </div>
          {task.subtitle ? (
            <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">
              {task.subtitle}
            </div>
          ) : null}
          {done ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              {task.painScore !== null ? (
                <span className="rounded-full border border-[rgba(239,68,68,0.32)] bg-[rgba(239,68,68,0.1)] px-2 py-0.5 font-semibold text-[#fca5a5]">
                  Pain {task.painScore}/10
                </span>
              ) : null}
              {task.photoUrl ? (
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-semibold text-[var(--muted)]">
                  Photo attached
                </span>
              ) : null}
            </div>
          ) : null}
          {done && task.note ? (
            <div className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/70 px-2 py-1.5 text-[11px] leading-relaxed text-[var(--ink-2)]">
              &ldquo;{task.note}&rdquo;
            </div>
          ) : null}
          <div className="mt-1 text-[10.5px] text-[var(--muted)]">
            by {task.assignedByName}
          </div>
        </div>
      </div>
    </div>
  );
}

function initialsFromName(name: string) {
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

function formatRoom(room: string) {
  return /^room\b/i.test(room) ? room : `Room ${room}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--muted)]">{children}</span>;
}

function Value({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--ink-2)]">{children}</span>;
}

function SectionTitle({
  title,
  right,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      {right}
    </div>
  );
}

function EditButton() {
  return (
    <button className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--gold-soft)]">
      <Edit3 className="size-3" /> Edit
    </button>
  );
}

function IOStat({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string;
  value: string;
  unit: string;
  tone?: "neutral" | "critical";
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[20px] font-semibold leading-none tracking-[-0.03em]",
          tone === "critical" ? "text-[#f87171]" : "text-[var(--ink)]",
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-[var(--muted)]">{unit}</div>
    </div>
  );
}
