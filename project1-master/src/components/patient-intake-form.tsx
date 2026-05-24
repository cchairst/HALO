"use client";

import { useEffect, useId, useState, useTransition, type DragEvent } from "react";
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  FileUp,
  Loader2,
  Mail,
  Scale,
  Stethoscope,
  StickyNote,
  UserRound,
} from "lucide-react";
import { createPatient } from "@/app/actions";
import { PronounsPicker } from "@/components/pronouns-picker";
import {
  analyzePatientChartFile,
  type PatientChartImportData,
  type PatientChartImportResult,
} from "@/app/clinical-actions";
import {
  INTAKE_DRAFT_EVENT,
  ageFromImportToInputValue,
  buildCareNotesFromImport,
  buildChartReportFromImport,
  clearIntakeDraft,
  formatBytes,
  loadIntakeDraft,
  saveIntakeDraft,
  type PatientIntakeDraft,
} from "@/lib/patient-intake-draft";

type PatientIntakeFormProps = {
  className?: string;
  openChartOnSave?: boolean;
  showHeader?: boolean;
};

const LINE = "0.5px solid rgba(255,255,255,0.1)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_STRONG = "rgba(255,255,255,0.065)";
const GOLD = "#d4a847";
const TEXT_MUTED = "rgba(255,255,255,0.52)";
const TEXT_LABEL = "rgba(255,255,255,0.45)";
const TEXT_DIM = "rgba(255,255,255,0.35)";

// Draft state helpers (key, load/save/clear, type) moved to
// src/lib/patient-intake-draft.ts so the desktop variant can reuse the same
// sessionStorage key and in-tab event without duplication.
const DRAFT_EVENT = INTAKE_DRAFT_EVENT;
const loadDraft = loadIntakeDraft;
const saveDraft = saveIntakeDraft;
const clearDraft = clearIntakeDraft;
type Draft = PatientIntakeDraft;

export function PatientIntakeForm({
  className = "",
  openChartOnSave = true,
  showHeader = false,
}: PatientIntakeFormProps) {
  const fileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<PatientChartImportResult | null>(null);
  const [error, setError] = useState("");
  // Lazy initializers hydrate from sessionStorage on first render so a draft
  // typed in mobile reappears after resize → desktop (and vice versa).
  const [chartReport, setChartReport] = useState<string>(
    () => loadDraft().chartReport ?? "",
  );
  const [name, setName] = useState<string>(() => loadDraft().name ?? "");
  const [age, setAge] = useState<string>(() => loadDraft().age ?? "");
  const [weightKg, setWeightKg] = useState<string>(
    () => loadDraft().weightKg ?? "",
  );
  const [room, setRoom] = useState<string>(() => loadDraft().room ?? "");
  const [facility, setFacility] = useState<string>(
    () => loadDraft().facility ?? "",
  );
  const [allergies, setAllergies] = useState<string>(
    () => loadDraft().allergies ?? "",
  );
  const [notes, setNotes] = useState<string>(() => loadDraft().notes ?? "");
  const [patientEmail, setPatientEmail] = useState<string>(
    () => loadDraft().patientEmail ?? "",
  );
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();

  // Persist any change to sessionStorage. Cheap to write; kept in an effect
  // so it runs after each render with the latest values. saveDraft also
  // dispatches a custom event so peer instances (same tab) re-hydrate.
  useEffect(() => {
    saveDraft({
      name,
      age,
      weightKg,
      room,
      facility,
      allergies,
      notes,
      chartReport,
      patientEmail,
    });
  }, [name, age, weightKg, room, facility, allergies, notes, chartReport, patientEmail]);

  // Listen for draft updates from other PatientIntakeForm instances mounted
  // in the same tab (desktop card + mobile drawer). Set state directly; if
  // values match, useState bails out, so this won't infinite-loop with the
  // saveDraft effect above.
  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<Draft>).detail;
      if (!detail) return;
      setName(detail.name ?? "");
      setAge(detail.age ?? "");
      setWeightKg(detail.weightKg ?? "");
      setRoom(detail.room ?? "");
      setFacility(detail.facility ?? "");
      setAllergies(detail.allergies ?? "");
      setNotes(detail.notes ?? "");
      setChartReport(detail.chartReport ?? "");
      setPatientEmail(detail.patientEmail ?? "");
    }
    window.addEventListener(DRAFT_EVENT, onUpdate);
    return () => window.removeEventListener(DRAFT_EVENT, onUpdate);
  }, []);

  const parsed = result?.ok ? result.data : null;
  const hasImportedReview = Boolean(parsed && chartReport);

  function setSelectedFile(nextFile: File | null) {
    setFile(nextFile);
    setResult(null);
    setChartReport("");
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    setSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  function readChart() {
    if (!file) {
      setError("Drop a chart file first.");
      return;
    }

    const fd = new FormData();
    fd.set("chartFile", file);
    setError("");

    startAnalyze(async () => {
      const next = await analyzePatientChartFile(fd);
      setResult(next);
      if (!next.ok) {
        setError(next.error);
        return;
      }

      const data = next.data;
      setName(data.patient.name || name);
      setAge(ageFromImportToInputValue(data.patient.age) || age);
      setFacility(data.patient.facility || facility);
      setAllergies(data.allergies.join(", ") || allergies);
      setNotes(buildCareNotesFromImport(data) || notes);
      setChartReport(buildChartReportFromImport(data, next.fileName));
    });
  }

  return (
    <form
      action={(fd) => {
        // Optimistically clear the persisted draft on submit. If the action
        // throws, the next render's effect re-saves from in-memory useState,
        // so the user doesn't lose their input on retry.
        clearDraft();
        startSave(() => createPatient(fd));
      }}
      className={`flex flex-col gap-3.5 ${className}`}
    >
      {showHeader && (
        <div className="px-1">
          <div className="text-[15px] font-semibold text-white">Add patient</div>
          <div className="mt-0.5 text-[12px]" style={{ color: TEXT_MUTED }}>
            Drop a chart or enter details by hand.
          </div>
        </div>
      )}

      <label
        htmlFor={fileInputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="flex cursor-pointer items-center gap-3 rounded-[16px] px-3.5 py-3 transition active:scale-[0.99]"
        style={{
          background: dragging ? SURFACE_STRONG : SURFACE,
          border: dragging ? `0.5px solid ${GOLD}` : LINE,
        }}
      >
        <input
          id={fileInputId}
          type="file"
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.csv,.json,.txt,.xml,.html,.rtf,application/pdf,image/*"
          onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)}
        />
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px]"
          style={{ background: "rgba(255,255,255,0.055)", border: LINE }}
        >
          <FileUp className="size-[18px]" style={{ color: GOLD }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13.5px] font-semibold text-white"
            style={{ letterSpacing: "-0.01em" }}
          >
            {file ? file.name : "Drop chart file"}
          </div>
          <div className="mt-0.5 truncate text-[11.5px]" style={{ color: TEXT_MUTED }}>
            {file ? `${formatBytes(file.size)} selected` : "PDF, image, Word, CSV, JSON, text"}
          </div>
        </div>
      </label>

      <button
        type="button"
        onClick={readChart}
        disabled={!file || analyzing}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full text-[13px] font-semibold transition active:scale-[0.98] disabled:opacity-40"
        style={{ background: "#fff", color: "#000", letterSpacing: "-0.01em" }}
      >
        {analyzing ? (
          <>
            <Loader2 className="size-[14px] animate-spin" /> Reading chart
          </>
        ) : (
          <>
            <ClipboardCheck className="size-[14px]" /> Load from file
          </>
        )}
      </button>

      {error && (
        <StatusTile tone="warn" icon={<AlertTriangle className="size-[14px]" />}>
          {error}
        </StatusTile>
      )}

      {parsed && (
        <ChartReviewPreview data={parsed} />
      )}

      <Field label="Patient name" Icon={UserRound}>
        <input
          name="name"
          required
          placeholder="Margaret Chen"
          className="halo-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <Field label="Pronouns">
        <PronounsPicker variant="mobile" />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Age">
          <input
            name="age"
            type="number"
            required
            min="0"
            placeholder="78"
            inputMode="numeric"
            className="halo-input"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
        </Field>
        <Field label="Weight (kg)" Icon={Scale}>
          <input
            name="weightKg"
            type="number"
            min="0"
            step="0.1"
            placeholder="64.5"
            inputMode="decimal"
            className="halo-input"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            style={{ fontVariantNumeric: "tabular-nums" }}
          />
        </Field>
      </div>

      <Field label="Room" Icon={Building2}>
        <input
          name="room"
          placeholder="214, 402A, Home"
          className="halo-input"
          value={room}
          onChange={(event) => setRoom(event.target.value)}
        />
      </Field>

      <Field label="Facility / unit" Icon={Building2}>
        <input
          name="facility"
          placeholder="4 North, ICU, Med Surg"
          className="halo-input"
          value={facility}
          onChange={(event) => setFacility(event.target.value)}
        />
      </Field>

      <Field label="Allergies">
        <input
          name="allergies"
          placeholder="Penicillin, shellfish"
          className="halo-input"
          value={allergies}
          onChange={(event) => setAllergies(event.target.value)}
        />
      </Field>

      <Field label="Care notes" Icon={StickyNote}>
        <textarea
          name="notes"
          rows={4}
          placeholder="Allergies, symptoms, mobility, contacts..."
          className="halo-input"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          style={{ resize: "none" }}
        />
      </Field>

      <Field label="Patient email (optional)" Icon={Mail}>
        <input
          name="patientEmail"
          type="email"
          inputMode="email"
          placeholder="patient@example.com"
          className="halo-input"
          value={patientEmail}
          onChange={(event) => setPatientEmail(event.target.value)}
          autoComplete="off"
        />
        <div
          className="px-1 text-[11px] leading-snug"
          style={{ color: TEXT_MUTED }}
        >
          Adding an email creates a sign-up link locked to the patient.
          You&apos;ll see the link to copy or send right after saving.
        </div>
      </Field>

      <input type="hidden" name="chartImportReport" value={chartReport} />
      <input type="hidden" name="openChart" value={openChartOnSave ? "1" : "0"} />

      <button
        type="submit"
        disabled={saving}
        className="mt-1 inline-flex h-[46px] items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition active:scale-[0.98] disabled:opacity-40"
        style={{ background: GOLD, color: "#070707", letterSpacing: "-0.01em" }}
      >
        {saving ? (
          <>
            <Loader2 className="size-[15px] animate-spin" /> Saving
          </>
        ) : hasImportedReview ? (
          "Save patient + review"
        ) : (
          "Save patient"
        )}
      </button>
    </form>
  );
}

function ChartReviewPreview({ data }: { data: PatientChartImportData }) {
  const topFlags = data.safetyFlags.slice(0, 3);
  const topTreatments = data.treatmentConsiderations.slice(0, 3);

  return (
    <div
      className="flex flex-col gap-2.5 rounded-[16px] p-3"
      style={{ background: "rgba(212,168,71,0.055)", border: "0.5px solid rgba(212,168,71,0.28)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="grid h-7 w-7 place-items-center rounded-full"
          style={{ background: "rgba(212,168,71,0.14)", color: GOLD }}
        >
          <Stethoscope className="size-[14px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white">Chart loaded</div>
          <div className="truncate text-[11.5px]" style={{ color: TEXT_MUTED }}>
            Review before saving.
          </div>
        </div>
      </div>

      {data.chartSummary && (
        <p className="text-[12.5px] leading-5" style={{ color: "rgba(255,255,255,0.8)" }}>
          {data.chartSummary}
        </p>
      )}

      {topTreatments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <MiniLabel>Treatment considerations</MiniLabel>
          {topTreatments.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-[12px] px-3 py-2"
              style={{ background: "rgba(0,0,0,0.18)", border: LINE }}
            >
              <div className="truncate text-[12.5px] font-semibold text-white">
                {item.label || "Review care option"}
              </div>
              {item.rationale && (
                <div className="mt-0.5 text-[11.5px] leading-4" style={{ color: TEXT_MUTED }}>
                  {item.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {topFlags.length > 0 && (
        <StatusTile tone="gold" icon={<AlertTriangle className="size-[14px]" />}>
          {topFlags.join(" | ")}
        </StatusTile>
      )}
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

function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-1 text-[10px] font-semibold"
      style={{ color: TEXT_LABEL, letterSpacing: "0.08em", textTransform: "uppercase" }}
    >
      {children}
    </div>
  );
}

function StatusTile({
  tone,
  icon,
  children,
}: {
  tone: "warn" | "gold";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12px] leading-5"
      style={{
        background: tone === "warn" ? "rgba(255,85,85,0.08)" : "rgba(212,168,71,0.08)",
        border: tone === "warn" ? "0.5px solid rgba(255,85,85,0.24)" : "0.5px solid rgba(212,168,71,0.24)",
        color: tone === "warn" ? "rgba(255,210,210,0.9)" : "rgba(255,236,190,0.9)",
      }}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// Chart-import → form-prefill helpers moved to
// src/lib/patient-intake-draft.ts for reuse by the desktop variant.
