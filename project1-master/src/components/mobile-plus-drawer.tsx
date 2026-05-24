"use client";

import { useState, useTransition } from "react";
import {
  Activity,
  ArrowRight,
  ChevronRight,
  ClipboardPlus,
  FileText,
  Loader2,
  MessageSquarePlus,
  UserRoundPlus,
} from "lucide-react";
import {
  MobileWizardDrawer,
  type WizardContext,
  type WizardStep,
} from "@/components/mobile-wizard-drawer";
import { PatientIntakeForm } from "@/components/patient-intake-form";
import {
  startDirectThread,
  createCareReport,
} from "@/app/actions";

type Person = { id: string; name: string; role: string };
type Patient = { id: string; name: string };

type Role = "caregiver" | "family" | "aps" | string;

// Shared design tokens — discipline over decoration
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_HOVER = "rgba(255,255,255,0.06)";
const LINE = "0.5px solid rgba(255,255,255,0.08)";
const LINE_STRONG = "0.5px solid rgba(255,255,255,0.14)";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_LABEL = "rgba(255,255,255,0.45)";
const TEXT_DIM = "rgba(255,255,255,0.35)";

export function MobilePlusDrawer({
  open,
  onOpenChange,
  role,
  people,
  patients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  people: Person[];
  patients: Patient[];
}) {
  const isCaregiver = role === "caregiver";
  // Reports are clinical handoffs — nurses only.
  const canPost = isCaregiver;

  const steps: WizardStep[] = [
    {
      id: "menu",
      title: "New",
      subtitle: "Pick what to start",
      render: ({ goTo }) => (
        <MenuStep
          goTo={goTo}
          isCaregiver={isCaregiver}
          canPost={canPost}
          peopleCount={people.length}
          patientsCount={patients.length}
        />
      ),
    },
    {
      id: "new-chat",
      title: "Start a chat",
      subtitle: `${people.length} on your care team`,
      render: () => <NewChatStep people={people} />,
    },
    ...(isCaregiver
      ? [
          {
            id: "add-patient",
            title: "Add patient",
            subtitle: "New care recipient",
            render: () => <AddPatientStep />,
          } as WizardStep,
        ]
      : []),
    ...(canPost
      ? [
          {
            id: "post-report",
            title: "Post report",
            subtitle: "Care update for handoff",
            render: () => (
              <PostReportStep patients={patients} canMarkInternal={isCaregiver} />
            ),
          } as WizardStep,
        ]
      : []),
  ];

  return (
    <MobileWizardDrawer
      open={open}
      onOpenChange={onOpenChange}
      initialStep="menu"
      steps={steps}
    />
  );
}

// ---------- Menu ----------

function MenuStep({
  goTo,
  isCaregiver,
  canPost,
  peopleCount,
  patientsCount,
}: {
  goTo: WizardContext["goTo"];
  isCaregiver: boolean;
  canPost: boolean;
  peopleCount: number;
  patientsCount: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <MenuRow
        Icon={MessageSquarePlus}
        title="New chat"
        meta={peopleCount === 1 ? "1 person" : `${peopleCount} people`}
        subtitle="Direct message a teammate or family"
        onClick={() => goTo("new-chat")}
      />
      {isCaregiver && (
        <MenuRow
          Icon={UserRoundPlus}
          title="Add patient"
          meta={patientsCount > 0 ? `${patientsCount} active` : "Start fresh"}
          subtitle="Create a profile and invite the team"
          onClick={() => goTo("add-patient")}
        />
      )}
      {canPost && (
        <MenuRow
          Icon={ClipboardPlus}
          title="Post report"
          meta={patientsCount === 0 ? "Add a patient first" : "Pain · sleep · notes"}
          subtitle="Log a care update visible at next handoff"
          onClick={() => goTo("post-report")}
        />
      )}
    </div>
  );
}

function MenuRow({
  Icon,
  title,
  subtitle,
  meta,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition active:scale-[0.99]"
      style={{ background: SURFACE, border: LINE }}
    >
      <div
        className="grid h-9 w-9 place-items-center rounded-[10px]"
        style={{ background: "rgba(255,255,255,0.05)", border: LINE }}
      >
        <Icon className="size-[18px]" style={{ color: "#d4a847" }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <div
            className="truncate text-[14.5px] font-semibold text-white"
            style={{ letterSpacing: "-0.01em" }}
          >
            {title}
          </div>
          {meta && (
            <div
              className="ml-auto shrink-0 text-[10.5px] font-medium"
              style={{ color: TEXT_DIM, letterSpacing: "0.04em" }}
            >
              {meta}
            </div>
          )}
        </div>
        <div
          className="mt-0.5 truncate text-[12px]"
          style={{ color: TEXT_MUTED, letterSpacing: "-0.005em" }}
        >
          {subtitle}
        </div>
      </div>
      <ChevronRight
        className="size-4 shrink-0 transition group-active:translate-x-0.5"
        style={{ color: TEXT_DIM }}
      />
    </button>
  );
}

// ---------- New chat ----------

function NewChatStep({ people }: { people: Person[] }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? people.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : people;

  return (
    <div className="flex flex-col gap-2 py-1">
      <SearchField value={q} onChange={setQ} placeholder="Search people" />
      <SectionLabel>{filtered.length === 0 ? "No matches" : "People"}</SectionLabel>
      <div className="flex max-h-[52dvh] flex-col gap-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyTile>
            {people.length === 0
              ? "Invite someone from Patients first."
              : "Try a different name."}
          </EmptyTile>
        ) : (
          filtered.map((person) => (
            <form key={person.id} action={startDirectThread}>
              <input type="hidden" name="userId" value={person.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition active:scale-[0.99]"
                style={{ background: "rgba(255,255,255,0.03)", border: LINE }}
              >
                <Avatar name={person.name} />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold text-white"
                    style={{ letterSpacing: "-0.005em" }}
                  >
                    {person.name}
                  </div>
                  <div
                    className="text-[11.5px]"
                    style={{ color: TEXT_LABEL, letterSpacing: "0.01em" }}
                  >
                    {roleLabel(person.role)}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0" style={{ color: TEXT_DIM }} />
              </button>
            </form>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Add patient ----------

function AddPatientStep() {
  return <PatientIntakeForm className="py-1" openChartOnSave />;
}

// ---------- Post report ----------

function PostReportStep({
  patients,
  canMarkInternal,
}: {
  patients: Patient[];
  canMarkInternal: boolean;
}) {
  const [pending, start] = useTransition();
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = patients.find((p) => p.id === selectedId);

  return (
    <form
      action={(fd) => start(() => createCareReport(fd))}
      className="flex flex-col gap-3.5 py-1"
    >
      <input type="hidden" name="recipientId" value={selectedId} />

      {/* Patient context card — tappable to switch */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>For patient</SectionLabel>
        {patients.length === 0 ? (
          <EmptyTile>No patients yet. Add one first.</EmptyTile>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition active:scale-[0.99]"
            style={{ background: SURFACE, border: LINE }}
          >
            <Avatar name={selected?.name ?? ""} />
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-[14px] font-semibold text-white"
                style={{ letterSpacing: "-0.005em" }}
              >
                {selected?.name ?? "Pick a patient"}
              </div>
              <div className="text-[11.5px]" style={{ color: TEXT_LABEL }}>
                {patients.length === 1
                  ? "Only patient on your team"
                  : `Tap to switch · ${patients.length} options`}
              </div>
            </div>
            <ChevronRight
              className={`size-4 shrink-0 transition ${pickerOpen ? "rotate-90" : ""}`}
              style={{ color: TEXT_DIM }}
            />
          </button>
        )}
        {pickerOpen && patients.length > 1 && (
          <div className="flex flex-col gap-1 pt-1">
            {patients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setPickerOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition active:scale-[0.99]"
                style={{
                  background: p.id === selectedId ? SURFACE_HOVER : "transparent",
                  border: LINE,
                }}
              >
                <Avatar name={p.name} small />
                <span
                  className="flex-1 truncate text-[13px] font-medium text-white"
                  style={{ letterSpacing: "-0.005em" }}
                >
                  {p.name}
                </span>
                {p.id === selectedId && (
                  <span
                    className="text-[10.5px] font-medium"
                    style={{ color: "#d4a847", letterSpacing: "0.04em" }}
                  >
                    SELECTED
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Field label="Title" Icon={FileText}>
        <input
          name="title"
          required
          placeholder="Sleep log, pain check, handoff…"
          className="halo-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Type">
          <select name="type" defaultValue="pain" className="halo-input">
            <option value="pain">Pain</option>
            <option value="lab">Lab</option>
            <option value="handoff">Handoff</option>
            <option value="medication">Medication</option>
            <option value="note">Note</option>
          </select>
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue="high" className="halo-input">
            <option value="high">High</option>
            <option value="med">Med</option>
            <option value="low">Low</option>
          </select>
        </Field>
      </div>
      <Field label="Body" Icon={Activity}>
        <textarea
          name="body"
          rows={3}
          required
          placeholder="What happened, what's next…"
          className="halo-input"
          style={{ resize: "none" }}
        />
      </Field>

      {canMarkInternal && <ToggleRow name="internal" label="Internal report" description="Hidden from family · Service team by request" />}

      <PrimaryAction
        pending={pending}
        icon={<ArrowRight className="size-[15px]" />}
        disabled={patients.length === 0 || !selectedId}
      >
        Post report
      </PrimaryAction>
    </form>
  );
}

// ---------- Reusable bits ----------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-1 text-[10.5px] font-semibold"
      style={{
        color: TEXT_LABEL,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function EmptyTile({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[12px] px-3 py-4 text-center text-[12px]"
      style={{ background: SURFACE, border: LINE, color: TEXT_MUTED }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 px-1">
        {Icon && <Icon className="size-[12px]" style={{ color: TEXT_DIM }} />}
        <span
          className="text-[10.5px] font-semibold"
          style={{
            color: TEXT_LABEL,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="halo-input pl-9"
        type="search"
      />
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: TEXT_DIM }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const s = small ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-[12.5px]";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${s}`}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: LINE_STRONG,
        color: "rgba(255,255,255,0.85)",
        letterSpacing: "-0.02em",
      }}
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

function PrimaryAction({
  pending,
  icon,
  disabled,
  children,
}: {
  pending: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="mt-1 inline-flex h-[46px] items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition active:scale-[0.98] disabled:opacity-40"
      style={{
        background: "#fff",
        color: "#000",
        letterSpacing: "-0.01em",
      }}
    >
      {pending ? (
        <>
          <Loader2 className="size-[15px] animate-spin" /> Saving…
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}

function ToggleRow({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description?: string;
}) {
  return (
    <label
      className="group flex cursor-pointer items-center gap-3 rounded-[13px] px-3 py-2.5 transition active:scale-[0.99]"
      style={{ background: SURFACE, border: LINE }}
    >
      <div className="min-w-0 flex-1">
        <div
          className="text-[13.5px] font-semibold text-white"
          style={{ letterSpacing: "-0.005em" }}
        >
          {label}
        </div>
        {description && (
          <div
            className="mt-0.5 text-[11.5px]"
            style={{ color: TEXT_LABEL, letterSpacing: "0.01em" }}
          >
            {description}
          </div>
        )}
      </div>
      <input type="checkbox" name={name} className="sr-only" />
      {/* group-has-[:checked]: drives both the track color and the inner
          slider's translate. peer-checked: only reaches direct siblings,
          never the nested slider span. */}
      <div className="relative h-[22px] w-[36px] flex-shrink-0 rounded-full bg-white/15 transition-colors duration-200 group-has-[:checked]:bg-[#d4a847]">
        <span
          className="absolute left-[2px] top-[2px] h-[18px] w-[18px] rounded-full bg-white transition-transform duration-200 group-has-[:checked]:translate-x-[14px]"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
        />
      </div>
    </label>
  );
}

function roleLabel(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Family / patient";
  if (role === "aps") return "Service";
  return "Care team";
}
