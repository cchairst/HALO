"use client";

import { PropsWithChildren } from "react";
import { z } from "zod";
import {
  TamboProvider,
  TamboStubProvider,
  type TamboTool,
} from "@tambo-ai/react";
import { PLAN_COMPONENTS } from "@/components/patient/care-plan/tambo-components";

const augurPredictSchema = z.object({
  food: z.string().describe("Food, meal, ingredient, supplement, or substitution to evaluate."),
  symptoms: z
    .record(z.string(), z.union([z.number(), z.string(), z.boolean()]))
    .optional()
    .describe("Current symptom scores or flags, for example headache: 3 or fatigue: true."),
  userDaysLogged: z.number().optional().describe("How many days of user logs are available."),
  medications: z.array(z.string()).optional().describe("Current medications for interaction checks."),
  allergies: z.array(z.string()).optional().describe("Known allergies and hard-block foods."),
  conditions: z.array(z.string()).optional().describe("Known conditions relevant to recommendation safety."),
  pollenSensitivities: z.array(z.string()).optional().describe("Known pollen or oral-allergy-syndrome sensitivities."),
  latitude: z.number().optional().describe("Latitude for optional pollen lookup."),
  longitude: z.number().optional().describe("Longitude for optional pollen lookup."),
});

const nutritionLookupSchema = z.object({
  query: z.string().describe("Food, ingredient, supplement, or substitution to look up."),
  allergies: z.array(z.string()).optional().describe("Known allergies or avoid-list items."),
  medications: z.array(z.string()).optional().describe("Current medications for interaction warnings."),
});

const priorLookupSchema = z.object({
  topic: z.string().optional().describe("Optional prior table or recommendation topic to inspect."),
});

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const TAMBO_TOOLS: TamboTool[] = [
  {
    name: "getAugurWellnessPrediction",
    description:
      "Runs Halo/Augur correlation and recommendation logic. Use before rendering wellness, diet substitution, lifestyle, OTC, or supplement recommendations. Escalate to physician for allergy, medication, red-flag, pregnancy, pediatric, or worsening-symptom concerns.",
    toolSchema: augurPredictSchema,
    tool: async (args: z.infer<typeof augurPredictSchema>) => postJson("/api/augur/predict", args),
  },
  {
    name: "lookupNutritionAndSafety",
    description:
      "Looks up food, substitution, supplement, allergy, and medication-interaction context for a recommendation.",
    toolSchema: nutritionLookupSchema,
    tool: async (args: z.infer<typeof nutritionLookupSchema>) => postJson("/api/augur/nutrition", args),
  },
  {
    name: "lookupPopulationPrior",
    description:
      "Reads the population prior used by Augur when the user does not have enough personal history yet. Use as background context for cautious early recommendations.",
    toolSchema: priorLookupSchema,
    tool: async (args: z.infer<typeof priorLookupSchema>) => postJson("/api/augur/prior", args),
  },
];

export const TAMBO_UI_STORAGE_KEY = "halo:tambo-enabled";

type HaloTamboProviderProps = PropsWithChildren<{
  userId?: string;
  /**
   * Live Tambo is intentionally opt-in from the UI.
   * Keeping this false by default prevents an API key from automatically
   * switching patient-facing chat into live agent mode.
   */
  enabled?: boolean;
}>;

export function HaloTamboProvider({ children, userId, enabled = false }: HaloTamboProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  if (!apiKey || !enabled) {
    return <TamboStubProvider components={PLAN_COMPONENTS}>{children}</TamboStubProvider>;
  }
  return (
    <TamboProvider apiKey={apiKey} components={PLAN_COMPONENTS} tools={TAMBO_TOOLS} userToken={userId}>
      {children}
    </TamboProvider>
  );
}

export function hasLiveTamboKey() {
  return Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);
}
