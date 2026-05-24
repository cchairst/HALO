"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Apple, ClipboardList, Loader2, ShieldCheck, Sparkles } from "lucide-react";

type PredictionResult = {
  summary?: string;
  nutrition?: unknown;
  predictions?: unknown[];
  recommendations?: Record<string, unknown> | unknown[];
  allergyWarnings?: unknown[];
  medicationWarnings?: unknown[];
  pollenWarnings?: unknown[];
  doctorSummary?: unknown;
  doctor_report?: unknown;
  [key: string]: unknown;
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function tryParseSymptoms(value: string) {
  return value
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, pair) => {
      const [rawKey, rawValue] = pair.split(/[:=]/).map((part) => part?.trim());
      if (!rawKey) return acc;
      const score = Number(rawValue ?? 5);
      acc[rawKey.toLowerCase().replaceAll(" ", "_")] = Number.isFinite(score) ? score : 5;
      return acc;
    }, {});
}

function ResultBlock({ title, value }: { title: string; value: unknown }) {
  if (value == null || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{title}</h3>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--surface-2)] p-3 text-xs leading-relaxed text-[var(--muted)]">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export function WellnessPredictorClient() {
  const [food, setFood] = useState("burger and fries, soda");
  const [symptoms, setSymptoms] = useState("joint pain: 6, fatigue: 7, mood: 3");
  const [allergies, setAllergies] = useState("fish");
  const [medications, setMedications] = useState("warfarin");
  const [conditions, setConditions] = useState("hypertension");
  const [pollen, setPollen] = useState("grass, ragweed");
  const [daysLogged, setDaysLogged] = useState("14");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPreview = useMemo(
    () => ({
      food,
      symptoms: tryParseSymptoms(symptoms),
      userDaysLogged: Number(daysLogged || 0),
      allergies: parseList(allergies),
      medications: parseList(medications),
      conditions: parseList(conditions),
      pollenSensitivities: parseList(pollen),
    }),
    [allergies, conditions, daysLogged, food, medications, pollen, symptoms],
  );

  async function runPrediction() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/augur/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPreview),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Prediction failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              <Sparkles className="size-3.5 text-[var(--gold-soft)]" />
              Halo Augur wellness engine
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-4xl">
              Food, allergy, pollen, and supplement safety suggestions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
              This module turns logged meals and symptoms into tiered lifestyle, food substitution, OTC/supplement, and physician-escalation guidance. It blocks allergy conflicts and adds medication and pollen caution layers.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--muted)]">
              <ShieldCheck className="size-4 text-[var(--gold-soft)]" /> Interaction checks
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--muted)]">
              <AlertTriangle className="size-4 text-[var(--gold-soft)]" /> Allergy warnings
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
            <Apple className="size-5 text-[var(--gold-soft)]" /> Try a prediction
          </h2>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
              Food log
              <textarea value={food} onChange={(e) => setFood(e.target.value)} className="min-h-20 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
              Symptoms, as name: score
              <input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
                Allergies
                <input value={allergies} onChange={(e) => setAllergies(e.target.value)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
                Medications
                <input value={medications} onChange={(e) => setMedications(e.target.value)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
                Conditions
                <input value={conditions} onChange={(e) => setConditions(e.target.value)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
                Pollen sensitivities
                <input value={pollen} onChange={(e) => setPollen(e.target.value)} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium text-[var(--ink-2)]">
              Days logged
              <input value={daysLogged} onChange={(e) => setDaysLogged(e.target.value)} inputMode="numeric" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--border-strong)]" />
            </label>
            <button onClick={runPrediction} disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
              Generate recommendations
            </button>
            {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
              <ClipboardList className="size-5 text-[var(--gold-soft)]" /> Request preview
            </h2>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--surface-2)] p-4 text-xs leading-relaxed text-[var(--muted)]">
              {JSON.stringify(requestPreview, null, 2)}
            </pre>
          </div>
          {result ? (
            <div className="grid gap-4">
              <ResultBlock title="Tiered recommendations" value={result.recommendations ?? result.tieredRecommendations} />
              <ResultBlock title="Predictions" value={result.predictions} />
              <ResultBlock title="Allergy warnings" value={result.allergyWarnings ?? result.allergy_warnings} />
              <ResultBlock title="Medication warnings" value={result.medicationWarnings ?? result.medication_warnings} />
              <ResultBlock title="Pollen warnings" value={result.pollenWarnings ?? result.pollen_warnings} />
              <ResultBlock title="Doctor summary" value={result.doctorSummary ?? result.doctor_report ?? result.doctorReport} />
              <ResultBlock title="Full response" value={result} />
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/50 p-8 text-center text-sm leading-relaxed text-[var(--muted)]">
              Results will appear here after you generate recommendations.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
