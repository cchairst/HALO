import type { PatientChartImportData } from "@/app/clinical-actions";

// sessionStorage-backed draft state for the patient-intake form. Shared
// between the mobile drawer copy (src/components/patient-intake-form.tsx)
// and the desktop card copy (src/components/desktop-patient-intake-form.tsx)
// so a draft survives breakpoint resizes (which mount / unmount different
// copies of the form) and stays in step when both are mounted in the same
// tab.

export type PatientIntakeDraft = {
  name: string;
  age: string;
  weightKg: string;
  room: string;
  facility: string;
  allergies: string;
  notes: string;
  chartReport: string;
  patientEmail: string;
};

export const EMPTY_INTAKE_DRAFT: PatientIntakeDraft = {
  name: "",
  age: "",
  weightKg: "",
  room: "",
  facility: "",
  allergies: "",
  notes: "",
  chartReport: "",
  patientEmail: "",
};

export const INTAKE_DRAFT_KEY = "halo:patient-intake-draft:v1";
// Custom in-tab event so peer instances (e.g. desktop card + mobile drawer
// form both mounted at once) re-hydrate live. `storage` only fires across
// tabs, not within the same window.
export const INTAKE_DRAFT_EVENT = "halo:patient-intake-draft:update";

export function loadIntakeDraft(): Partial<PatientIntakeDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(INTAKE_DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PatientIntakeDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveIntakeDraft(d: PatientIntakeDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(d));
    window.dispatchEvent(
      new CustomEvent<PatientIntakeDraft>(INTAKE_DRAFT_EVENT, { detail: d }),
    );
  } catch {
    // Quota or disabled storage — fail silently.
  }
}

export function clearIntakeDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(INTAKE_DRAFT_KEY);
    window.dispatchEvent(
      new CustomEvent<PatientIntakeDraft>(INTAKE_DRAFT_EVENT, {
        detail: EMPTY_INTAKE_DRAFT,
      }),
    );
  } catch {
    // ignore
  }
}

// ---- Chart-import → form-prefill helpers ---------------------------------
//
// Both the mobile and desktop intake forms turn a `PatientChartImportData`
// (produced by `analyzePatientChartFile`) into (a) a free-text care-notes
// block that prefills the Care notes field, and (b) a longer "chart report"
// that rides along on the createPatient submit as `chartImportReport` so
// the nurse can review the full extraction on the patient chart afterwards.
// Lifted here from patient-intake-form.tsx so the desktop variant can reuse
// the exact same formatting.

export function ageFromImportToInputValue(age: string): string {
  const match = age.match(/\d+/);
  if (!match) return "";
  const value = Number(match[0]);
  if (!Number.isFinite(value)) return "";
  if (/\b(day|days|week|weeks|month|months|mo)\b/i.test(age)) return "0";
  return String(Math.max(0, Math.floor(value)));
}

function listLine(label: string, items: string[]): string {
  return items.length ? `${label}: ${items.join("; ")}` : "";
}

export function buildCareNotesFromImport(data: PatientChartImportData): string {
  return [
    data.chartSummary ? `Imported summary: ${data.chartSummary}` : "",
    data.patient.age ? `Age in chart: ${data.patient.age}` : "",
    data.patient.weightKg ? `Weight: ${data.patient.weightKg} kg` : "",
    listLine("Allergies", data.allergies),
    listLine("Current meds", data.currentMedications),
    listLine("Problems", data.activeProblems),
    listLine("Symptoms", data.symptoms),
    listLine("Vitals", data.vitals),
    listLine("Safety flags", data.safetyFlags),
    data.patient.notes,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2600);
}

export function buildChartReportFromImport(
  data: PatientChartImportData,
  fileName: string,
): string {
  const treatmentText = data.treatmentConsiderations
    .map((item, index) =>
      [
        `${index + 1}. ${item.label || "Review option"}`,
        item.rationale ? `Reason: ${item.rationale}` : "",
        listLine("Medication classes", item.medicationClasses),
        listLine("Monitor", item.monitoring),
        listLine("Warnings", item.warnings),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return [
    `Imported from: ${fileName}`,
    "",
    "Chart summary",
    data.chartSummary || "No summary extracted.",
    "",
    "Clinical snapshot",
    data.clinicalSnapshot || "No snapshot extracted.",
    listLine("Active problems", data.activeProblems),
    listLine("Symptoms", data.symptoms),
    listLine("Allergies", data.allergies),
    listLine("Current meds", data.currentMedications),
    listLine("Vitals", data.vitals),
    listLine("Labs", data.labs),
    "",
    "Treatment considerations",
    treatmentText || "No treatment considerations extracted.",
    "",
    listLine("Safety flags", data.safetyFlags),
    listLine("Missing / confirm", data.missingData),
    listLine("Source notes", data.sourceNotes),
    "",
    data.disclaimer,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .slice(0, 12000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}
