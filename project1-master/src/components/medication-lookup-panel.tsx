"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import {
  lookupMedicationForPatient,
  type MedicationLookupResult,
} from "@/app/clinical-actions";

type PatientOption = {
  id: string;
  name: string;
  age: number;
  facility: string | null;
};

export function MedicationLookupPanel({
  patients,
  compact = false,
}: {
  patients: PatientOption[];
  compact?: boolean;
}) {
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [medication, setMedication] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [result, setResult] = useState<MedicationLookupResult | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedPatient = patients.find((patient) => patient.id === patientId);

  function submit() {
    startTransition(async () => {
      const next = await lookupMedicationForPatient({
        patientId,
        medication,
        symptoms,
        weightKg,
      });
      setResult(next);
    });
  }

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
          : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--gold-soft)]">
          <Search className="size-4" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-[var(--ink)]">
            Medication lookup
          </div>
          <div className="text-[12px] text-[var(--muted)]">
            Patient context + GPT clinical reference
          </div>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="text-[13px] text-[var(--muted)]">
          Add a patient before using medication lookup.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <select
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} - age {patient.age}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-[0.55fr_1fr] gap-2">
            <input
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              inputMode="decimal"
              placeholder="kg"
              className="w-full cursor-text rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
            <input
              value={medication}
              onChange={(event) => setMedication(event.target.value)}
              placeholder="Drug name"
              className="w-full cursor-text rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            rows={compact ? 2 : 3}
            placeholder="Symptoms, allergies, route, or concern"
            className="w-full cursor-text resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
          {selectedPatient && (
            <div className="text-[11px] text-[var(--muted)]">
              Chart: age {selectedPatient.age}
              {selectedPatient.facility ? ` - ${selectedPatient.facility}` : ""}
            </div>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Checking" : "Check reference"}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
          {result.ok ? (
            <div className="flex flex-col gap-2">
              <div className="text-[13px] font-semibold text-[var(--ink)]">
                {result.patientName}
              </div>
              <div className="text-[12px] leading-5 text-[var(--muted)]">{result.query}</div>
              <div className="whitespace-pre-wrap text-[13px] leading-5 text-[var(--ink-2)]">
                {result.providerSummary}
              </div>
              <div className="border-t border-[var(--border)] pt-2 text-[11px] leading-4 text-[var(--muted)]">
                {result.note}
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-[var(--muted)]">{result.error}</div>
          )}
        </div>
      )}
    </section>
  );
}
