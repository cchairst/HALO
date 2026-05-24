"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  RotateCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { M_PATIENTS, type Severity } from "@/lib/mobile-demo";
import { Card, CardHeader, MobileTopHeader, SeverityPill } from "@/components/mobile-catch-up";
import { MobilePatientDrawer } from "@/components/mobile-patient-drawer";

export type MobilePatientRow = {
  id?: string;
  initials: string;
  name: string;
  age: number;
  room: string;
  mrn?: string;
  severity: Severity;
  status: string;
  time: string;
  unread?: number;
};

// Mobile Patients — image 11. Signature preserved.
export function MobilePatients({
  patients,
  drawerOpen = false,
}: {
  patients?: MobilePatientRow[];
  isCaregiver?: boolean;
  drawerOpen?: boolean;
}) {
  const D = M_PATIENTS;
  const rows = patients && patients.length > 0 ? patients : D.all;
  const priorityRows =
    patients && patients.length > 0
      ? rows.filter((p) => p.severity === "high" || p.severity === "med").slice(0, 5)
      : D.priority;
  const total = patients && patients.length > 0 ? rows.length : D.total;
  return (
    <div className="md:hidden -mx-4 min-h-[100dvh] pb-[140px]" style={{ background: "#000" }}>
      <MobileTopHeader />

      <h1 className="px-4 pt-2 text-[28px] font-bold text-white">Patients</h1>

      <div className="px-4 pt-3">
        <MobilePatientDrawer defaultOpen={drawerOpen} />
      </div>

      <div className="flex items-center gap-2 px-4 pt-3">
        <label
          className="flex flex-1 items-center gap-2 rounded-2xl px-3"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search className="size-4 text-[#888]" />
          <input
            placeholder="Search patients by name, room, MRN..."
            className="h-10 w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-[#666]"
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

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-2 mobile-need-scroll">
        <PatientChip label="All" active />
        <PatientChip label="My patients" />
        <PatientChip label="High risk" dot="#ef4444" />
        <PatientChip label="Stable" dot="#22c55e" />
        <span className="my-auto h-5 w-px bg-[rgba(255,255,255,0.12)]" />
        <PatientChip label="All units" caret />
        <PatientChip label="All teams" caret />
      </div>

      <div className="px-4 pt-3">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-[#d4a847]" />
                Priority patients ({priorityRows.length})
              </span>
            }
            right={`View all (${Math.max(0, total - priorityRows.length)})`}
          />
          <div>
            {priorityRows.map((p, i) => (
              <PriorityRow key={p.name + p.room} patient={p} divider={i !== priorityRows.length - 1} />
            ))}
          </div>
        </Card>
      </div>

      <div className="px-4 pt-3">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[14px] font-bold text-white">{total} patients</div>
            <button className="inline-flex items-center gap-1 text-[12px] text-[#bbb]">
              Sorted by: <span className="text-[#d4a847]">Priority</span>
              <ChevronDown className="size-3 text-[#d4a847]" />
            </button>
          </div>
          <div>
            {rows.map((p, i) => (
              <PatientRow key={p.name + p.room} patient={p} divider={i !== rows.length - 1} />
            ))}
          </div>
        </Card>

        <div className="mt-3 flex items-center justify-between px-1 text-[12px] text-[#888]">
          <span>Last updated: 9:40 AM</span>
          <button className="inline-flex items-center gap-1.5 text-[#d4a847]">
            <RotateCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientChip({
  label,
  active,
  dot,
  caret,
}: {
  label: string;
  active?: boolean;
  dot?: string;
  caret?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
      style={{
        background: active ? "transparent" : "rgba(255,255,255,0.03)",
        border: active ? "1px solid #d4a847" : "0.5px solid rgba(255,255,255,0.12)",
        color: active ? "#d4a847" : "#ccc",
      }}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ background: dot }} />}
      {label}
      {caret && <ChevronDown className="size-3 text-[#888]" />}
    </span>
  );
}

function PriorityRow({
  patient,
  divider,
}: {
  patient: MobilePatientRow;
  divider?: boolean;
}) {
  return (
    <Link
      href={patient.id ? `/recipients/${patient.id}` : "#"}
      className={`-mx-1 flex items-center gap-2 px-1 py-2.5 ${divider ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: dotColor(patient.severity) }}
      />
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full text-[11.5px] font-bold text-white"
        style={{
          background: "rgba(239,68,68,0.16)",
          border: "1px solid rgba(248,113,113,0.32)",
        }}
      >
        {patient.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-white">
          {patient.name}, {patient.age}
        </div>
        <div className="truncate text-[11px] text-[#888]">
          {patient.room}  ·  {patient.mrn}
        </div>
      </div>
      <SeverityPill severity={patient.severity} />
      <div className="flex min-w-0 flex-col items-end gap-0.5">
        <span className="truncate text-[11.5px] text-[#bbb]">{patient.status}</span>
        <span className="text-[10.5px] text-[#777]">{patient.time}</span>
      </div>
      {patient.unread ? (
        <span
          className="grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold"
          style={{
            background: "rgba(239,68,68,0.18)",
            border: "1px solid rgba(248,113,113,0.4)",
            color: "#f87171",
          }}
        >
          {patient.unread}
        </span>
      ) : null}
      <ChevronRight className="size-3.5 shrink-0 text-[#555]" />
    </Link>
  );
}

function PatientRow({
  patient,
  divider,
}: {
  patient: MobilePatientRow;
  divider?: boolean;
}) {
  return (
    <Link
      href={patient.id ? `/recipients/${patient.id}` : "#"}
      className={`-mx-1 flex items-center gap-2 px-1 py-2.5 ${divider ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: dotColor(patient.severity) }}
      />
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold"
        style={{
          background: bgForSeverity(patient.severity),
          border: `1px solid ${ringForSeverity(patient.severity)}`,
          color: "white",
        }}
      >
        {patient.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-white">
          {patient.name}, {patient.age}
        </div>
        <div className="truncate text-[11px] text-[#888]">{patient.room}</div>
      </div>
      <SeverityPill severity={patient.severity} />
      <div className="flex min-w-0 flex-col items-end gap-0.5">
        <span className="truncate text-[11.5px] text-[#ccc]">{patient.status}</span>
        <span className="text-[10.5px] text-[#777]">{patient.time}</span>
      </div>
      {patient.unread ? (
        <span
          className="grid size-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold"
          style={{
            background: "rgba(239,68,68,0.18)",
            border: "1px solid rgba(248,113,113,0.4)",
            color: "#f87171",
          }}
        >
          {patient.unread}
        </span>
      ) : null}
      <ChevronRight className="size-3.5 shrink-0 text-[#555]" />
    </Link>
  );
}

function dotColor(severity: Severity): string {
  return severity === "high"
    ? "#ef4444"
    : severity === "med"
      ? "#f97316"
      : severity === "low"
        ? "#eab308"
        : "#22c55e";
}

function bgForSeverity(severity: Severity): string {
  return severity === "high"
    ? "rgba(239,68,68,0.16)"
    : severity === "med"
      ? "rgba(249,115,22,0.16)"
      : severity === "low"
        ? "rgba(234,179,8,0.14)"
        : "rgba(34,197,94,0.14)";
}

function ringForSeverity(severity: Severity): string {
  return severity === "high"
    ? "rgba(248,113,113,0.32)"
    : severity === "med"
      ? "rgba(251,146,60,0.32)"
      : severity === "low"
        ? "rgba(250,204,21,0.28)"
        : "rgba(134,239,172,0.28)";
}
