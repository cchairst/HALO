import "server-only";

import OpenAI from "openai";
import { db } from "@/lib/db";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

let _client: OpenAI | null = null;
function client(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new OpenAI({ apiKey: key });
  return _client;
}

// Two known targets. Adding a new one means: decide where it lands (DB
// column / appended notes), update the prompt, and add a write path in
// `acceptChatSuggestion` in actions.ts.
type Target = "patient_notes" | "family_contact_notes";

type Extracted = {
  target: Target;
  field: string;
  value: string;
};

// Fields-of-interest the model is asked to look for. The list shapes the
// prompt and the downstream UI label. Volatility flag governs whether the
// suggestion fires when the existing chart field already has a value:
//   - "static": only suggest when the corresponding field looks empty.
//   - "always": always suggest (chat is the freshest source).
const FIELD_HINTS = [
  { label: "Availability / best time to talk", target: "family_contact_notes", volatility: "always" },
  { label: "Current concerns or symptoms", target: "patient_notes", volatility: "always" },
  { label: "Pain level / today's pain", target: "patient_notes", volatility: "always" },
  { label: "Allergies", target: "patient_notes", volatility: "static" },
  { label: "Preferred name", target: "patient_notes", volatility: "static" },
  { label: "Primary contact phone or email", target: "family_contact_notes", volatility: "static" },
  { label: "Mobility or fall risk", target: "patient_notes", volatility: "always" },
  { label: "Sleep / appetite", target: "patient_notes", volatility: "always" },
] as const;

// Decide which patient (if any) this thread is about. Direct threads have
// two members; if exactly one of them is a family-role user with exactly
// one membership, that's the patient. Anything else (multi-patient family,
// nurse↔nurse, no family at all) → no suggestion target.
async function resolvePatientForThread(
  threadId: string,
): Promise<{ recipientId: string; familyAuthorId: string | null } | null> {
  const members = await db.threadMember.findMany({
    where: { threadId },
    include: { user: { include: { memberships: true } } },
  });
  if (members.length !== 2) return null;
  const family = members.find((m) => m.user.role === "family");
  if (!family) return null;
  if (family.user.memberships.length !== 1) return null;
  return {
    recipientId: family.user.memberships[0].recipientId,
    familyAuthorId: family.user.id,
  };
}

// Map an "always" / "static" volatility against current chart state. For
// "static" fields we only fire when the relevant target slot looks empty
// (notes field is null / whitespace). For "always" we always fire.
function shouldSuggest(
  volatility: "static" | "always",
  patientNotes: string | null,
  familyNotes: string | null,
  target: Target,
): boolean {
  if (volatility === "always") return true;
  const haystack = target === "patient_notes" ? patientNotes : familyNotes;
  return !haystack || haystack.trim().length === 0;
}

async function extractWithLLM(
  body: string,
  authorRole: string,
): Promise<Extracted[]> {
  const ai = client();
  if (!ai) return [];

  const system = [
    "You read a single chat message between a nurse and a patient or family member. Your job is to extract concrete, factual chart-relevant details that a nurse might want to record on the patient's chart.",
    "",
    "Only extract details that are clearly factual statements made by the speaker. Skip greetings, questions to the nurse, opinions, feelings, or speculation. If the message is small talk, return an empty list.",
    "",
    `Author role: ${authorRole}`,
    "",
    "Each suggestion must be one of these field types — match the closest one. If nothing fits, leave it out.",
    ...FIELD_HINTS.map((h, i) => `${i + 1}. ${h.label}  →  target: ${h.target}`),
    "",
    "Return STRICT JSON with this shape and nothing else:",
    `{ "suggestions": [ { "field": "<field label, exactly as listed above>", "value": "<short verbatim phrase from the message>", "target": "patient_notes" | "family_contact_notes" } ] }`,
    "",
    "Rules:",
    "- value MUST be a short snippet that a nurse can paste straight into the chart. Quote-faithful where possible.",
    "- value MUST be at most 140 characters.",
    "- field MUST exactly match one of the labels above.",
    "- target MUST match the field's listed target.",
    "- Maximum 3 suggestions.",
    "- If unsure, return an empty array — false positives are worse than misses.",
  ].join("\n");

  let raw: string | undefined;
  try {
    const resp = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: body },
      ],
    });
    raw = resp.choices[0]?.message?.content?.trim();
  } catch (err) {
    console.error("[chart-suggestions] OpenAI call failed:", err);
    return [];
  }
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { suggestions?: unknown };
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) return [];
    return parsed.suggestions
      .map((s): Extracted | null => {
        if (!s || typeof s !== "object") return null;
        const obj = s as Record<string, unknown>;
        const field = typeof obj.field === "string" ? obj.field.trim() : "";
        const value = typeof obj.value === "string" ? obj.value.trim() : "";
        const target = obj.target;
        if (!field || !value) return null;
        if (target !== "patient_notes" && target !== "family_contact_notes") return null;
        // Field must be one we listed.
        const hint = FIELD_HINTS.find((h) => h.label === field);
        if (!hint) return null;
        // Target must match the field's hint.
        if (hint.target !== target) return null;
        return { field, value: value.slice(0, 140), target };
      })
      .filter((x): x is Extracted => x !== null)
      .slice(0, 3);
  } catch (err) {
    console.error("[chart-suggestions] JSON parse failed:", err, raw);
    return [];
  }
}

// Public entry point. Called from createThreadMessage right after a row is
// inserted. Failures are swallowed — chat must never fail because of an AI
// problem.
export async function extractChartSuggestionsForMessage(args: {
  messageId: string;
  threadId: string;
  authorId: string;
  body: string;
}) {
  try {
    const ctx = await resolvePatientForThread(args.threadId);
    if (!ctx) return;

    const author = await db.user.findUnique({
      where: { id: args.authorId },
      select: { role: true, email: true },
    });
    if (!author) return;
    // Only extract from family-side messages for now — nurse messages are
    // chart-writes already, and looping back to "suggest adding what you
    // just typed" is noise.
    if (author.role !== "family") return;

    const recipient = await db.careRecipient.findUnique({
      where: { id: ctx.recipientId },
      select: {
        notes: true,
        familyContacts: { where: { email: author.email.toLowerCase() } },
      },
    });
    if (!recipient) return;

    const familyContact = recipient.familyContacts[0] ?? null;

    const candidates = await extractWithLLM(args.body, author.role);
    if (candidates.length === 0) return;

    const rowsToInsert = candidates
      .filter((c) => {
        const hint = FIELD_HINTS.find((h) => h.label === c.field);
        if (!hint) return false;
        return shouldSuggest(
          hint.volatility,
          recipient.notes,
          familyContact?.notes ?? null,
          c.target,
        );
      })
      .map((c) => ({
        messageId: args.messageId,
        recipientId: ctx.recipientId,
        target: c.target,
        familyContactId: c.target === "family_contact_notes" ? familyContact?.id ?? null : null,
        field: c.field,
        value: c.value,
      }))
      .filter((row) => {
        // For family-contact suggestions we need a contact to attach to.
        // If the family-author isn't a tracked FamilyContact yet, drop the
        // suggestion rather than orphaning it.
        if (row.target === "family_contact_notes" && !row.familyContactId) return false;
        return true;
      });

    if (rowsToInsert.length === 0) return;

    await db.chatChartSuggestion.createMany({ data: rowsToInsert });
  } catch (err) {
    console.error("[chart-suggestions] extraction failed:", err);
  }
}
