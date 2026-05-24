"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Loader2,
} from "lucide-react";
import { createPatient } from "@/app/actions";
import {
  analyzePatientChartFile,
  type PatientChartImportData,
  type PatientChartImportResult,
} from "@/app/clinical-actions";
import { PronounsPicker } from "@/components/pronouns-picker";
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

// Desktop counterpart of PatientIntakeForm. Shares the same sessionStorage
// draft (via INTAKE_DRAFT_* helpers) and the same server actions so a draft
// typed here roundtrips with the mobile drawer instance and vice versa.
// Visual structure matches the franchise inline form previously inlined in
// care-teams.tsx (2-col grid, dashed dropzone, token-based input styling).

type Props = {
  className?: string;
  openChartOnSave?: boolean;
};

export function DesktopPatientIntakeForm({
  className = "",
  openChartOnSave = true,
}: Props) {
  const fileInputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<PatientChartImportResult | null>(null);
  const [error, setError] = useState("");

  // Lazy initializers hydrate from sessionStorage on first render so a
  // draft typed in mobile reappears after resize → desktop.
  const [chartReport, setChartReport] = useState<string>(
    () => loadIntakeDraft().chartReport ?? "",
  );
  const [name, setName] = useState<string>(() => loadIntakeDraft().name ?? "");
  const [age, setAge] = useState<string>(() => loadIntakeDraft().age ?? "");
  const [weightKg, setWeightKg] = useState<string>(
    () => loadIntakeDraft().weightKg ?? "",
  );
  const [room, setRoom] = useState<string>(() => loadIntakeDraft().room ?? "");
  const [facility, setFacility] = useState<string>(
    () => loadIntakeDraft().facility ?? "",
  );
  const [allergies, setAllergies] = useState<string>(
    () => loadIntakeDraft().allergies ?? "",
  );
  const [notes, setNotes] = useState<string>(() => loadIntakeDraft().notes ?? "");
  const [patientEmail, setPatientEmail] = useState<string>(
    () => loadIntakeDraft().patientEmail ?? "",
  );
  const [analyzing, startAnalyze] = useTransition();
  const [saving, startSave] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist any change to sessionStorage. saveIntakeDraft also dispatches
  // INTAKE_DRAFT_EVENT so peer instances (mobile drawer mounted in same
  // tab) re-hydrate live.
  useEffect(() => {
    saveIntakeDraft({
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

  // Listen for draft updates from other intake form instances mounted in
  // the same tab. useState bails on identical values, so this doesn't loop.
  useEffect(() => {
    function onUpdate(e: Event) {
      const detail = (e as CustomEvent<PatientIntakeDraft>).detail;
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
    window.addEventListener(INTAKE_DRAFT_EVENT, onUpdate);
    return () => window.removeEventListener(INTAKE_DRAFT_EVENT, onUpdate);
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
        // throws, the next render's effect re-saves from in-memory useState.
        clearIntakeDraft();
        startSave(() => createPatient(fd));
      }}
      className={`flex flex-col gap-3 ${className}`}
    >
      {/* Dropzone tile (full-width above the grid) */}
      <label
        htmlFor={fileInputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 py-3 transition " +
          (dragging
            ? "border-[rgba(246,189,71,0.7)] bg-[var(--gold-bg)]"
            : "border-[var(--border-strong)] bg-[var(--surface-2)]/40 hover:border-[rgba(201,154,50,0.45)]")
        }
      >
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.csv,.json,.txt,.xml,.html,.rtf,application/pdf,image/*"
          onChange={(event) =>
            setSelectedFile(event.currentTarget.files?.[0] ?? null)
          }
        />
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--gold-soft)]">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
            {file ? file.name : "Drop chart file here"}
          </div>
          <div className="truncate text-[11px] text-[var(--muted)]">
            {file
              ? `${formatBytes(file.size)} selected`
              : "PDF, image, Word, CSV, JSON, text"}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)]"
        >
          Browse files
        </button>
      </label>

      <button
        type="button"
        onClick={readChart}
        disabled={!file || analyzing}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.45)] disabled:opacity-50"
      >
        {analyzing ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Reading chart
          </>
        ) : (
          <>
            <ClipboardCheck className="size-3.5" /> Load from file
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {parsed && <DesktopChartReviewPreview data={parsed} />}

      {/* 2-col field grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="Patient name">
          <DesktopInput
            name="name"
            placeholder="Margaret Chen"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Care notes">
          <DesktopTextarea
            name="notes"
            placeholder="Allergies, symptoms, mobility, contacts..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pronouns">
            <PronounsPicker variant="desktop" />
          </Field>
          <Field label="Age">
            <DesktopInput
              name="age"
              type="number"
              required
              min="0"
              inputMode="numeric"
              placeholder="78"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Patient email (optional)">
          <DesktopInput
            name="patientEmail"
            type="email"
            inputMode="email"
            placeholder="margaret.chen@email.com"
            autoComplete="off"
            value={patientEmail}
            onChange={(e) => setPatientEmail(e.target.value)}
          />
          <p className="mt-1 text-[10.5px] text-[var(--muted)]">
            Adding an email creates a sign-up link locked to the patient.
          </p>
        </Field>

        <Field label="Weight (kg)">
          <DesktopInput
            name="weightKg"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder="64.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </Field>

        <Field label="Allergies">
          <DesktopInput
            name="allergies"
            placeholder="Penicillin, shellfish"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
        </Field>

        <div className="flex items-end justify-end gap-2">
          <button
            type="reset"
            onClick={() => {
              clearIntakeDraft();
              setName("");
              setAge("");
              setWeightKg("");
              setRoom("");
              setFacility("");
              setAllergies("");
              setNotes("");
              setChartReport("");
              setPatientEmail("");
              setResult(null);
              setFile(null);
              setError("");
            }}
            className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-bold disabled:opacity-60"
            style={{ background: "var(--gold)", color: "#1b1712" }}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Saving
              </>
            ) : hasImportedReview ? (
              "Save patient + review"
            ) : (
              "Save patient"
            )}
          </button>
        </div>

        <div className="md:col-span-2">
          <Field label="Room">
            <DesktopInput
              name="room"
              placeholder="214, 402A, Home"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Facility / unit">
            <DesktopInput
              name="facility"
              placeholder="4 North, ICU, Med Surg"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <input type="hidden" name="chartImportReport" value={chartReport} />
      <input type="hidden" name="openChart" value={openChartOnSave ? "1" : "0"} />
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-semibold text-[var(--muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function DesktopInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.5)]"
    />
  );
}

function DesktopTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      rows={4}
      {...props}
      className="w-full resize-none rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2 text-[12.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[rgba(246,189,71,0.5)]"
    />
  );
}

function DesktopChartReviewPreview({ data }: { data: PatientChartImportData }) {
  const topFlags = data.safetyFlags.slice(0, 3);
  const topTreatments = data.treatmentConsiderations.slice(0, 3);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[rgba(246,189,71,0.25)] bg-[var(--gold-bg)] p-3">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-[var(--surface)] text-[var(--gold-soft)]">
          <ClipboardCheck className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-[var(--ink)]">
            Chart loaded
          </div>
          <div className="truncate text-[11px] text-[var(--muted)]">
            Review before saving.
          </div>
        </div>
      </div>

      {data.chartSummary && (
        <p className="text-[12px] leading-relaxed text-[var(--ink-2)]">
          {data.chartSummary}
        </p>
      )}

      {topTreatments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            Treatment considerations
          </div>
          {topTreatments.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2"
            >
              <div className="truncate text-[12px] font-semibold text-[var(--ink)]">
                {item.label || "Review care option"}
              </div>
              {item.rationale && (
                <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {item.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {topFlags.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-[rgba(246,189,71,0.3)] bg-[var(--surface)] px-3 py-2 text-[11.5px] text-[var(--ink-2)]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--gold-soft)]" />
          <span>{topFlags.join(" | ")}</span>
        </div>
      )}
    </div>
  );
}
