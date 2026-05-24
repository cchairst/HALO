// Discharge types — drive type-specific sections in the AI care plan.
// One source of truth for the picker UI, the form value, and the prompt.

export const DISCHARGE_TYPES = [
  "checkup",
  "surgery",
  "behavioral_health",
  "rehab",
  "infection_recovery",
  "general",
] as const;

export type DischargeType = (typeof DISCHARGE_TYPES)[number];

export function isDischargeType(s: string): s is DischargeType {
  return (DISCHARGE_TYPES as readonly string[]).includes(s);
}

export const DISCHARGE_LABEL: Record<DischargeType, string> = {
  checkup: "Routine checkup",
  surgery: "Post-surgery / post-procedure",
  behavioral_health: "Behavioral / mental health",
  rehab: "Rehab or PT discharge",
  infection_recovery: "Recovery from illness or infection",
  general: "General",
};

// Type-specific guidance fed to the model as system context. Phrased as
// directions to the model — "Pay attention to X" — not as text to be quoted
// in the output. The model previously echoed "The plan MUST include:" into
// patient-facing text; the new wording avoids that footgun.
export const DISCHARGE_FOCUS: Record<DischargeType, string> = {
  checkup:
    "Routine checkup. Keep the plan short. Emphasize continuity of normal routine, the next scheduled visit, and a couple of monitoring cues drawn from what was observed today. Do not invent restrictions or new medications. Only mention activity changes if the chart notes specifically support them.",
  surgery: [
    "Post-surgery / post-procedure. Pay particular attention to:",
    "- Wound or incision care: check frequency, signs of infection (redness, swelling, drainage, fever over 100.4°F).",
    "- Activity restrictions specific to the procedure (lifting limits, driving, bathing, sexual activity when relevant).",
    "- Pain management: scheduled non-opioid baseline, opioid use only as prescribed, when to taper, what to do if pain worsens.",
    "- Bowel and bladder watch after anesthesia or opioid use.",
    "- Anticoagulation or blood-thinner notes when anesthesia or immobility is involved.",
    "- A specific follow-up for suture removal or surgical review.",
    "When the chart notes mention specific wound dimensions or sites (e.g. '3.5 inch laceration on right calf'), restrictions and watch-outs MUST reference those specifics — not generic wound advice.",
  ].join("\n"),
  behavioral_health: [
    "Behavioral / mental-health discharge. Tone is warm, non-stigmatizing, never minimizing. Pay particular attention to:",
    "- Safety plan reference, including 988 (Suicide & Crisis Lifeline) and 911 for imminent danger.",
    "- Medication adherence specifics: what to take, when, side effects, why missed doses matter.",
    "- Therapy continuity: next outpatient appointment and what to do if it's missed.",
    "- Daily structure that supports stability: sleep window, meals, light exposure, movement.",
    "- Substance and alcohol guidance when relevant to prescribed meds.",
    "- Warning signs that mean call the care team TODAY: increasing isolation, sleep collapse, self-harm urges, voices or paranoia worsening, stopping meds.",
    "- Frame the family's role as supportive, not surveilling.",
  ].join("\n"),
  rehab: [
    "Rehab / PT discharge. Pay particular attention to:",
    "- Specific exercises with frequency and reps (e.g. 'ankle pumps, 10 reps, 3× daily').",
    "- Weight-bearing status and assistive device use (cane, walker, none).",
    "- Pain ceiling during exercise — when to stop, when to push through.",
    "- Home modifications (rails, no rugs, raised toilet seat) only when the chart supports them.",
    "- Schedule for outpatient PT or home-health PT visits.",
    "- Progress markers — what 'getting better' looks like over the next two weeks.",
  ].join("\n"),
  infection_recovery: [
    "Recovery from illness or infection. Pay particular attention to:",
    "- Antibiotic adherence: finish the full course even if feeling better; name the drug from chart notes.",
    "- Hydration and rest specifics.",
    "- Return-to-activity timeline (work, school, exercise) calibrated to severity in the notes.",
    "- Contagion guidance when relevant (mask, hand hygiene, household risk).",
    "- Relapse red flags: new fever after 48h, breathing changes, severe weakness.",
  ].join("\n"),
  general:
    "General discharge with no specific procedural context. Use the chart notes and recent reports to identify what actually happened and write a plan that addresses those specifics. Do not invent details that aren't supported by the notes.",
};
