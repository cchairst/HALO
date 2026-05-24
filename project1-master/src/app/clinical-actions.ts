"use server";

import { Buffer } from "node:buffer";
import OpenAI from "openai";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const MAX_TRANSLATION_CHARS = 4000;
const MAX_LOOKUP_TEXT = 1500;
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-nano";
const MAX_CHART_FILE_BYTES = 8 * 1024 * 1024;

let _client: OpenAI | null = null;
function openai(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new OpenAI({ apiKey: key });
  return _client;
}

function clean(value: unknown, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanList(value: unknown, maxItems = 8, maxChars = 220) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => clean(item, maxChars)).filter(Boolean).slice(0, maxItems);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function languageName(code: string) {
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    ht: "Haitian Creole",
    tl: "Tagalog",
    vi: "Vietnamese",
    zh: "Chinese (Simplified)",
    ar: "Arabic",
    fr: "French",
    pt: "Portuguese",
    ru: "Russian",
    ko: "Korean",
    ja: "Japanese",
  };
  return names[code] ?? code;
}

// ---------- Patient chart import ----------

export type TreatmentConsideration = {
  label: string;
  rationale: string;
  medicationClasses: string[];
  monitoring: string[];
  warnings: string[];
};

export type PatientChartImportData = {
  patient: {
    name: string;
    age: string;
    facility: string;
    notes: string;
    weightKg: string;
  };
  chartSummary: string;
  clinicalSnapshot: string;
  activeProblems: string[];
  symptoms: string[];
  allergies: string[];
  currentMedications: string[];
  vitals: string[];
  labs: string[];
  treatmentConsiderations: TreatmentConsideration[];
  safetyFlags: string[];
  missingData: string[];
  sourceNotes: string[];
  disclaimer: string;
};

export type PatientChartImportResult =
  | { ok: true; fileName: string; data: PatientChartImportData }
  | { ok: false; error: string };

const CHART_MIME_BY_EXTENSION: Record<string, string> = {
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  html: "text/html",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  txt: "text/plain",
  webp: "image/webp",
  xml: "application/xml",
};

const CHART_IMPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "patient",
    "chartSummary",
    "clinicalSnapshot",
    "activeProblems",
    "symptoms",
    "allergies",
    "currentMedications",
    "vitals",
    "labs",
    "treatmentConsiderations",
    "safetyFlags",
    "missingData",
    "sourceNotes",
    "disclaimer",
  ],
  properties: {
    patient: {
      type: "object",
      additionalProperties: false,
      required: ["name", "age", "facility", "notes", "weightKg"],
      properties: {
        name: { type: "string" },
        age: { type: "string" },
        facility: { type: "string" },
        notes: { type: "string" },
        weightKg: { type: "string" },
      },
    },
    chartSummary: { type: "string" },
    clinicalSnapshot: { type: "string" },
    activeProblems: { type: "array", items: { type: "string" } },
    symptoms: { type: "array", items: { type: "string" } },
    allergies: { type: "array", items: { type: "string" } },
    currentMedications: { type: "array", items: { type: "string" } },
    vitals: { type: "array", items: { type: "string" } },
    labs: { type: "array", items: { type: "string" } },
    treatmentConsiderations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "rationale", "medicationClasses", "monitoring", "warnings"],
        properties: {
          label: { type: "string" },
          rationale: { type: "string" },
          medicationClasses: { type: "array", items: { type: "string" } },
          monitoring: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
        },
      },
    },
    safetyFlags: { type: "array", items: { type: "string" } },
    missingData: { type: "array", items: { type: "string" } },
    sourceNotes: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
};

const CHART_IMPORT_INSTRUCTIONS = `You are a clinical chart intake assistant for licensed nurses.

Read the uploaded chart/file and return structured patient intake data.

Rules:
- Extract only facts present in the uploaded file. If a field is not present, return an empty string or empty array.
- Provide treatment considerations for clinician review, not a diagnosis and not a prescription.
- Prefer concise medication classes and nursing next steps over brand names unless the chart names a medication.
- Do not calculate or provide doses. If the chart already lists a medication dose, preserve it only under currentMedications.
- Call out allergies, contraindication clues, interaction risks, abnormal vitals/labs, pediatric/geriatric flags, pregnancy flags, and urgent escalation signs.
- If the file is not a patient chart or lacks useful clinical data, return empty patient fields, a short chartSummary explaining that, and missingData entries.
- End disclaimer exactly: "Clinical decision support only - verify against the chart, orders, allergies, and licensed workflow before treatment."`;

function chartFileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function chartMime(file: File) {
  const ext = chartFileExtension(file.name);
  return file.type || CHART_MIME_BY_EXTENSION[ext] || "application/octet-stream";
}

function isSupportedChartFile(file: File) {
  const ext = chartFileExtension(file.name);
  const mime = chartMime(file);
  return Boolean(CHART_MIME_BY_EXTENSION[ext] || mime.startsWith("image/"));
}

function normalizeChartImport(value: unknown): PatientChartImportData {
  const root = asObject(value);
  const patient = asObject(root.patient);
  const treatments = Array.isArray(root.treatmentConsiderations)
    ? root.treatmentConsiderations
        .map((item) => {
          const treatment = asObject(item);
          return {
            label: clean(treatment.label, 120),
            rationale: clean(treatment.rationale, 500),
            medicationClasses: cleanList(treatment.medicationClasses, 6, 140),
            monitoring: cleanList(treatment.monitoring, 6, 160),
            warnings: cleanList(treatment.warnings, 6, 160),
          };
        })
        .filter(
          (item) =>
            item.label ||
            item.rationale ||
            item.medicationClasses.length ||
            item.monitoring.length ||
            item.warnings.length,
        )
        .slice(0, 5)
    : [];

  return {
    patient: {
      name: clean(patient.name, 120),
      age: clean(patient.age, 12),
      facility: clean(patient.facility, 160),
      notes: clean(patient.notes, 900),
      weightKg: clean(patient.weightKg, 24),
    },
    chartSummary: clean(root.chartSummary, 900),
    clinicalSnapshot: clean(root.clinicalSnapshot, 1200),
    activeProblems: cleanList(root.activeProblems, 10, 180),
    symptoms: cleanList(root.symptoms, 10, 180),
    allergies: cleanList(root.allergies, 10, 180),
    currentMedications: cleanList(root.currentMedications, 16, 220),
    vitals: cleanList(root.vitals, 12, 160),
    labs: cleanList(root.labs, 12, 180),
    treatmentConsiderations: treatments,
    safetyFlags: cleanList(root.safetyFlags, 10, 220),
    missingData: cleanList(root.missingData, 10, 180),
    sourceNotes: cleanList(root.sourceNotes, 8, 180),
    disclaimer:
      clean(root.disclaimer, 200) ||
      "Clinical decision support only - verify against the chart, orders, allergies, and licensed workflow before treatment.",
  };
}

export async function analyzePatientChartFile(
  formData: FormData,
): Promise<PatientChartImportResult> {
  const user = await requireUser();
  if (user.role !== "caregiver") {
    return { ok: false, error: "Chart import is available to nurses only." };
  }

  const file = formData.get("chartFile");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Drop a chart file first." };
  }
  if (file.size > MAX_CHART_FILE_BYTES) {
    return { ok: false, error: "Keep uploads under 8 MB for now." };
  }
  if (!isSupportedChartFile(file)) {
    return {
      ok: false,
      error: "Use a PDF, image, Word doc, CSV, JSON, text, XML, HTML, or RTF file.",
    };
  }

  const ai = openai();
  if (!ai) {
    return {
      ok: false,
      error: "Chart import isn't configured. Add OPENAI_API_KEY to enable it.",
    };
  }

  const mime = chartMime(file);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const dataUrl = `data:${mime};base64,${base64}`;
  const fileName = clean(file.name, 180) || "chart-upload";
  const fileContent: ResponseInputContent = mime.startsWith("image/")
    ? {
        type: "input_image",
        image_url: dataUrl,
        detail: "high",
      }
    : {
        type: "input_file",
        filename: fileName,
        file_data: dataUrl,
        detail: "high",
      };

  try {
    const response = await ai.responses.create({
      model: DEFAULT_MODEL,
      instructions: CHART_IMPORT_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            fileContent,
            {
              type: "input_text",
              text:
                `Uploaded file name: ${fileName}\n` +
                "Extract the patient profile, chart summary, clinical snapshot, safety flags, and treatment considerations.",
            },
          ],
        },
      ],
      max_output_tokens: 3500,
      store: false,
      temperature: 0,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "patient_chart_import",
          strict: true,
          schema: CHART_IMPORT_SCHEMA,
        },
      },
    });

    const raw = clean(response.output_text, 12000);
    if (!raw) return { ok: false, error: "Chart import returned no data." };

    return {
      ok: true,
      fileName,
      data: normalizeChartImport(JSON.parse(raw)),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return {
      ok: false,
      error: `Chart import failed (${message.slice(0, 120)}).`,
    };
  }
}

// ---------- Translation ----------

type TranslateInput = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export type TranslateResult =
  | { ok: true; translatedText: string; provider: string }
  | { ok: false; error: string };

export async function translateForCare(input: TranslateInput): Promise<TranslateResult> {
  await requireUser();

  const text = clean(input.text, MAX_TRANSLATION_CHARS);
  const source = clean(input.sourceLanguage, 24) || "auto";
  const target = clean(input.targetLanguage, 24) || "en";
  if (!text) return { ok: false, error: "Enter text to translate." };
  if (source === target) {
    return { ok: true, translatedText: text, provider: "same-language" };
  }

  const ai = openai();
  if (!ai) {
    return {
      ok: false,
      error: "Translation isn't configured. Add OPENAI_API_KEY to enable it.",
    };
  }

  const sourceName = source === "auto" ? "the source language" : languageName(source);
  const targetName = languageName(target);

  try {
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You translate care messages between caregivers, patients, and family. " +
            "Preserve clinical terms, dosages, units, and times exactly. " +
            "Keep tone natural and warm. Reply with ONLY the translation — no preamble, no quotes, no explanation.",
        },
        {
          role: "user",
          content:
            `Translate from ${sourceName} to ${targetName}.\n` +
            `Return only the translated text.\n\n` +
            text,
        },
      ],
    });

    const translated = clean(
      completion.choices[0]?.message?.content,
      MAX_TRANSLATION_CHARS,
    );
    if (!translated) return { ok: false, error: "Translation returned no text." };

    return { ok: true, translatedText: translated, provider: "openai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return {
      ok: false,
      error: `Translation service is unavailable (${message.slice(0, 80)}).`,
    };
  }
}

// ---------- Medication / clinical lookup ----------

type MedicationLookupInput = {
  patientId: string;
  medication: string;
  symptoms: string;
  weightKg: string;
};

export type MedicationLookupResult =
  | {
      ok: true;
      patientName: string;
      query: string;
      providerSummary: string;
      note: string;
    }
  | { ok: false; error: string };

const LOOKUP_SYSTEM_PROMPT = `You are a clinical reference assistant for a licensed nurse on a care floor.

Given the patient context plus a medication name and/or symptoms, return a concise structured reference. Use plain text with these short labeled sections, in this order, omitting any section that does not apply:

Indication
Typical adult dosing
Key contraindications
Common interactions
What to monitor
Patient-specific flags

Constraints:
- Keep it tight. No filler. Bullet points where helpful.
- Adjust for the patient's age and any care notes (e.g. fall risk, dementia, hepatic/renal flags).
- If a medication name is missing but symptoms are given, suggest the standard first-line classes used in clinical care, briefly.
- Never give a diagnosis. Never write a prescription. Do not use the phrase "I recommend".
- End with exactly one final line: "Reference only — confirm in your licensed workflow before treatment."`;

export async function lookupMedicationForPatient(
  input: MedicationLookupInput,
): Promise<MedicationLookupResult> {
  const user = await requireUser();
  if (user.role !== "caregiver") {
    return { ok: false, error: "Medication lookup is available to nurses only." };
  }

  const patientId = clean(input.patientId, 128);
  const medication = clean(input.medication, 120);
  const symptoms = clean(input.symptoms, 700);
  const weightKg = clean(input.weightKg, 20);
  if (!patientId) return { ok: false, error: "Choose a patient." };
  if (!medication && !symptoms) {
    return { ok: false, error: "Enter a medication or symptoms." };
  }

  const patient = await db.careRecipient.findFirst({
    where: { id: patientId, memberships: { some: { userId: user.id } } },
    select: { name: true, age: true, facility: true, notes: true },
  });
  if (!patient) return { ok: false, error: "Patient is not on your care team." };

  const ai = openai();
  if (!ai) {
    return {
      ok: false,
      error: "Lookup isn't configured. Add OPENAI_API_KEY to enable it.",
    };
  }

  const queryParts = [
    medication ? `Medication: ${medication}` : "",
    symptoms ? `Symptoms: ${symptoms}` : "",
    `Age: ${patient.age}`,
    weightKg ? `Weight: ${weightKg} kg` : "",
  ].filter(Boolean);
  const query = queryParts.join(" | ");

  const userPrompt = [
    "Patient context:",
    `- Name: ${patient.name}`,
    `- Age: ${patient.age}`,
    patient.facility ? `- Facility / setting: ${patient.facility}` : "",
    weightKg ? `- Weight: ${weightKg} kg` : "",
    patient.notes ? `- Care notes: ${clean(patient.notes, MAX_LOOKUP_TEXT)}` : "",
    "",
    medication ? `Medication of interest: ${medication}` : "",
    symptoms ? `Symptoms reported: ${symptoms}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const completion = await ai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: LOOKUP_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const summary = clean(completion.choices[0]?.message?.content, 4000);
    if (!summary) return { ok: false, error: "Lookup returned no result." };

    return {
      ok: true,
      patientName: patient.name,
      query,
      providerSummary: summary,
      note: "Reference only. Confirm dosing, contraindications, and allergies in your licensed workflow before treatment.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return {
      ok: false,
      error: `Lookup service is unavailable (${message.slice(0, 80)}).`,
    };
  }
}
