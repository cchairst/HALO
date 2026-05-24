import {
  ChevronDown,
  FileText,
  Mail,
  MoreHorizontal,
  Search,
  Send,
  UserRoundPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { CARE_TEAMS } from "@/lib/desktop-demo";
import { Avatar, Panel, RiskPill } from "./bits";
import { InviteLauncher, type InviteDialogRecipient } from "@/components/invite-dialog";
import { DesktopPatientIntakeForm } from "@/components/desktop-patient-intake-form";

export type DesktopCareTeamPatient = {
  id?: string;
  initials: string;
  name: string;
  age: number;
  sex: string;
  status: string[];
  room: string;
  facility: string;
  team: string[];
  teamExtra: number;
  unreadReports: number;
  updated: string;
};

export function DesktopCareTeams({
  patients,
  isCaregiver = false,
}: {
  patients?: DesktopCareTeamPatient[];
  isCaregiver?: boolean;
}) {
  const D = CARE_TEAMS;
  const rows: DesktopCareTeamPatient[] =
    patients && patients.length > 0
      ? patients
      : D.patients.map((patient) => ({ ...patient, id: undefined }));
  const patientCount = rows.length || D.patientCount;
  // Only real (DB-backed) patients are valid invite targets — the demo
  // fallback rows have no id and would 400 the server action.
  const inviteRecipients: InviteDialogRecipient[] = rows
    .filter((p): p is DesktopCareTeamPatient & { id: string } => Boolean(p.id))
    .map((p) => ({ id: p.id, name: p.name }));
  const canInvite = isCaregiver && inviteRecipients.length > 0;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
            Patients
          </p>
          <h1 className="mt-1 text-[34px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]">
            Care teams
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{D.blurb}</p>
        </div>
        {isCaregiver && (
          <div className="flex items-center gap-2">
            {canInvite ? (
              <InviteLauncher
                recipients={inviteRecipients}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)]"
              >
                <Mail className="size-3.5" />
                Invite to care team
              </InviteLauncher>
            ) : (
              <button
                disabled
                title="Add a patient before inviting their care team."
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-2)] opacity-60"
              >
                <Mail className="size-3.5" />
                Invite to care team
              </button>
            )}
            <a
              href="#add-patient"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-bold"
              style={{ background: "var(--gold)", color: "#1b1712" }}
            >
              Add patient
              <ChevronDown className="size-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Two columns: Add patient + Invite & manage — nurses only. */}
      {isCaregiver && (
      <div id="add-patient" className="grid grid-cols-1 gap-3 px-6 pt-3 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
            <UserRoundPlus className="size-4 text-[var(--gold-soft)]" /> Add patient
          </h3>
          {/* Desktop-styled intake form (matches the franchise inline
              layout) but keeps the full functionality of the mobile
              PatientIntakeForm: chart-file ingest via OpenAI, sessionStorage
              draft persistence shared with the mobile drawer, and the
              ?inviteCreated=<token> redirect that surfaces the patient
              invite link. */}
          <DesktopPatientIntakeForm openChartOnSave={false} />
        </Panel>

        <Panel>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
            <Mail className="size-4 text-[var(--gold-soft)]" /> Invite & manage care teams
          </h3>
          <p className="mt-1 text-[12.5px] text-[var(--muted)]">
            Invite colleagues to join a patient&apos;s care team and set their role-based access.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {canInvite ? (
              <InviteLauncher
                recipients={inviteRecipients}
                className="flex w-full items-start gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-3 text-left transition hover:border-[rgba(201,154,50,0.55)]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--gold-soft)]">
                  <Mail className="size-4" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[12.5px] font-semibold text-[var(--ink)]">
                    Invite by email
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Generate a tokenized link tied to a specific patient and role.
                  </span>
                </span>
              </InviteLauncher>
            ) : (
              <FeatureRow
                icon={<Mail className="size-4" />}
                title="Invite by email"
                detail="Add a patient first — invites are scoped to a specific care team."
              />
            )}
            <FeatureRow
              icon={<Users className="size-4" />}
              title="Role-based access"
              detail="Patient, family member, or service agent — each gets the right view."
            />
            <FeatureRow
              icon={<Send className="size-4" />}
              title="Stay in the loop"
              detail="Invited teammates will be added to updates and reports."
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 text-[12px] font-semibold text-[var(--ink-2)]">Common roles</div>
            <div className="flex flex-wrap gap-2">
              {D.commonRoles.map((r) => (
                <div
                  key={r.name}
                  className="flex min-w-[120px] flex-col rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2"
                >
                  <span className="text-[12px] font-semibold text-[var(--ink)]">{r.name}</span>
                  <span className="text-[10.5px] text-[var(--muted)]">{r.scope}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <a href="#" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--gold-soft)]">
              Manage roles & permissions -&gt;
            </a>
          </div>
        </Panel>
      </div>
      )}

      {/* Patients table */}
      <div className="px-6 pt-3 pb-6">
        <Panel>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-[15px] font-semibold text-[var(--ink)]">
              Patients ({patientCount})
            </h3>
            <div className="relative ml-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[var(--muted)]" />
              <input
                placeholder="Search patients..."
                className="h-7 w-[220px] rounded-md border border-[var(--border)] bg-[var(--surface)]/70 pl-7 pr-2 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
              />
            </div>
            <DropdownGhost>All facilities</DropdownGhost>
            <DropdownGhost>All status</DropdownGhost>
            <div className="ml-auto flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
              View:
              <DropdownGhost>Compact</DropdownGhost>
            </div>
          </div>

          <div className="grid grid-cols-[1.4fr_1.1fr_0.9fr_1fr_0.8fr_0.7fr_auto] gap-2 pb-2 pl-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            <span>PATIENT</span>
            <span>STATUS</span>
            <span>ROOM / FACILITY</span>
            <span>CARE TEAM</span>
            <span>UNREAD REPORTS</span>
            <span>UPDATED</span>
            <span>ACTIONS</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {rows.map((p) => (
              <div
                key={p.id ?? p.name}
                className="grid grid-cols-[1.4fr_1.1fr_0.9fr_1fr_0.8fr_0.7fr_auto] items-center gap-2 py-2 pl-1"
              >
                <div className="flex items-center gap-2">
                  <Avatar initials={p.initials} size={28} bg="#1c1c1f" fg="#d9d3c5" />
                  <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    - {p.age} - {p.sex}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {p.status.map((s) => (
                    <RiskPill
                      key={s}
                      severity={
                        s === "High" || s === "Critical" || s === "Unstable"
                          ? "high"
                          : s === "Med" || s === "Watch"
                            ? "med"
                            : "low"
                      }
                    >
                      {s}
                    </RiskPill>
                  ))}
                </div>

                <div className="text-[12px] text-[var(--ink-2)]">
                  <span className="font-semibold text-[var(--ink)]">{p.room}</span>
                  <span className="ml-1 text-[var(--muted)]">{p.facility}</span>
                </div>

                <div className="flex items-center -space-x-1.5">
                  {p.team.map((t) => (
                    <Avatar key={t} initials={t} size={22} bg="#272318" fg="#d9b257" />
                  ))}
                  {p.teamExtra ? (
                    <span className="grid size-[22px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-semibold text-[var(--muted)]">
                      +{p.teamExtra}
                    </span>
                  ) : null}
                </div>

                <div className="text-[12px] font-semibold">
                  {p.unreadReports ? (
                    <span className="inline-flex items-center gap-1 text-[#f87171]">
                      <span className="size-1.5 rounded-full bg-[#f87171]" />
                      {p.unreadReports}
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">0</span>
                  )}
                </div>

                <span className="text-[11.5px] text-[var(--muted)]">{p.updated}</span>

                <div className="flex items-center gap-1">
                  <Link href={p.id ? `/recipients/${p.id}` : "#"} className="inline-flex items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[11.5px] font-semibold text-[var(--ink-2)]">
                    <FileText className="size-3" />
                    Open chart
                  </Link>
                  <button aria-label="More" className="grid size-6 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)]">
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11.5px] text-[var(--muted)]">
            <span>1-{rows.length} of {patientCount}</span>
            <div className="flex items-center gap-2">
              <button className="grid size-6 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="m6 2-3 3 3 3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button className="grid size-6 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="m4 2 3 3-3 3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <DropdownGhost>Show 20</DropdownGhost>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--gold-soft)]">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-[var(--ink)]">{title}</div>
        <div className="text-[11.5px] text-[var(--muted)]">{detail}</div>
      </div>
    </div>
  );
}

function DropdownGhost({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-2)]"
    >
      {children}
      <ChevronDown className="size-3" />
    </button>
  );
}
