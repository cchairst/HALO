"use server";

import OpenAI from "openai";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isLocale, LOCALE_COOKIE, type LocaleCode } from "@/lib/locales";
import {
  createThreadMessage,
  getOrCreateDirectThread,
} from "@/lib/messages";
import { getCurrentUser, isDemoMode, requireUser, type Role } from "@/lib/session";
import {
  AccessError,
  assertCanProposeService,
  assertCanReadRecipient,
  assertCanWriteRecipient,
  logAudit,
} from "@/lib/access";
import {
  isRecipientStatus,
  STATUS_EFFECTS,
  statusChangeMessage,
} from "@/lib/recipient-status";
import {
  DISCHARGE_FOCUS,
  DISCHARGE_LABEL,
  isDischargeType,
  type DischargeType,
} from "@/lib/discharge-types";
import {
  isServiceType,
  isOfferingStatus,
  SERVICE_LABEL,
  type ServiceType,
} from "@/lib/service-types";
import { sendEmail } from "@/lib/notify";
import { isUsStateCode } from "@/lib/us-states";
import { verifyNpi } from "@/lib/nppes";
import {
  CONSENT_FORM_TEMPLATES,
  isConsentFormType,
  renderConsentFormBody,
  type ConsentFormType,
} from "@/lib/consent-forms";
import { headers } from "next/headers";

export async function switchToUser(userId: string) {
  if (!isDemoMode()) throw new Error("Demo identity switching is disabled.");
  const c = await cookies();
  c.set("uid", userId, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  revalidatePath("/", "layout");
}

export async function pickRole(role: Role) {
  if (!isDemoMode()) throw new Error("Demo role picking is disabled.");
  const u = await db.user.findFirst({ where: { role }, orderBy: { createdAt: "asc" } });
  if (!u) return;
  const c = await cookies();
  c.set("uid", u.id, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  redirect("/dashboard");
}

// Fire-and-forget telemetry for the client IdleLock component. Emits an
// auth.idle_lock audit row so an auditor can see when a session went
// idle-locked and (later) when it resumed. Returning void keeps the server
// action contract simple — the client never branches on the result.
export async function markIdleLock(reason: "idle" | "manual") {
  const actor = await getCurrentUser();
  if (!actor) return;
  await logAudit({
    actorId: actor.id,
    action: "auth.idle_lock",
    metadata: { reason },
  });
}

export async function signOut() {
  // Capture actor before clearing cookies so the audit row attributes the
  // sign-out to the right user. Best-effort — anon sessions just log a null
  // actor row.
  const actor = await getCurrentUser();
  void logAudit({
    actorId: actor?.id ?? null,
    action: "auth.signout",
  });
  const c = await cookies();
  c.delete("uid");
  // Clear Privy auth cookies too. Without this the landing page reads a
  // still-valid Privy DID, sees a matching User row, and bounces straight
  // back to /dashboard — making the click feel like a no-op until the
  // page is refreshed (which is what the user reported). We delete on the
  // server here; the client-side privy.logout() (fired from RoleSwitcher
  // via the halo:privy-logout event) cleans up the SDK's in-memory state.
  c.delete("privy-token");
  c.delete("privy-id-token");
  c.delete("privy-access-token");
  // Also let the user re-pick their language on the next sign-in. Without
  // this, the next person on the same device inherits the previous user's
  // locale until they sign up again.
  c.delete(LOCALE_COOKIE);
  redirect("/");
}

export async function createPrivyUser(opts: {
  did: string;
  email: string;
  name: string;
  role: Role;
  /** Required when role === "family": whether the new user is the patient
   *  themselves or a family member. Ignored for other roles. */
  familyKind?: "patient" | "family";
  /** UI locale chosen at sign-up. Persisted on the user row and mirrored
   *  to the halo_locale cookie so server components render in this language
   *  on the very next request. */
  locale?: LocaleCode;
  /** Required for role === "aps". Optional for "family" if a nurse issued
   *  a family invite tied to a specific patient. */
  inviteToken?: string;
  /** USPS 2-letter state code. Required for every role at sign-up; HIPAA
   *  state-overlay laws (CMIA, etc.) need this to be on the row. */
  state?: string;
  /** 10-digit NPI. Required for role === "caregiver"; verified against
   *  the public NPPES registry before the User row is created. */
  npi?: string;
}) {
  // Locale is optional but if supplied it must be a known one.
  const locale: LocaleCode | undefined =
    opts.locale && isLocale(opts.locale) ? opts.locale : undefined;

  // State of practice / residence — required for every role.
  const state = opts.state?.trim().toUpperCase();
  if (!state || !isUsStateCode(state)) {
    throw new Error("Pick the U.S. state you're practicing or living in.");
  }

  // NPPES verification — caregivers only. Block sign-up if the NPI is
  // missing, malformed, or absent from the registry. The result is recorded
  // on the user row so a future audit can prove the registry was checked.
  let npiVerified = false;
  let npiCredential: string | null = null;
  let npiNumber: string | null = null;
  if (opts.role === "caregiver") {
    const raw = (opts.npi ?? "").replace(/\D/g, "");
    if (raw.length !== 10) {
      throw new Error("Enter your 10-digit NPI to continue.");
    }
    const result = await verifyNpi(raw);
    if (!result.ok) {
      void logAudit({
        action: "npi.rejected",
        target: `NPI:${raw}`,
        metadata: { reason: result.reason },
      });
      if (result.reason === "invalid-format") {
        throw new Error(
          "That NPI doesn't pass the standard checksum — double-check the number on your registry record.",
        );
      }
      if (result.reason === "not-found") {
        throw new Error(
          "We couldn't find an active NPI in the NPPES registry for that number. Check the digits or contact NPPES support.",
        );
      }
      throw new Error(
        "We couldn't reach the NPPES registry right now. Try again in a moment.",
      );
    }
    npiVerified = true;
    npiCredential = result.credential || null;
    npiNumber = result.npi;
    void logAudit({
      action: "npi.verified",
      target: `NPI:${result.npi}`,
      metadata: { credential: result.credential, registryName: result.registryName },
    });
  }
  // Validate the invite token when present. Service-agent sign-ups REQUIRE
  // a valid token; family sign-ups don't (family can self-register), but if
  // a token IS supplied it must still be valid so we can attach to the
  // patient on the invite.
  let validInvite: Awaited<ReturnType<typeof db.serviceInvite.findUnique>> = null;
  if (opts.inviteToken) {
    validInvite = await db.serviceInvite.findUnique({
      where: { token: opts.inviteToken },
    });
    if (
      !validInvite ||
      validInvite.consumedAt ||
      validInvite.expiresAt < new Date() ||
      validInvite.email.toLowerCase() !== opts.email.toLowerCase()
    ) {
      throw new Error(
        "This invite is invalid, expired, or doesn't match your email. Ask the nurse to issue a new one.",
      );
    }
    // Token must match the role being applied — a family-invite link can't
    // be redeemed as a service agent and vice versa.
    if (validInvite.role !== opts.role) {
      throw new Error(
        `This invite is for a different role (${validInvite.role}). Pick the matching role or ask for a new invite.`,
      );
    }
    // Family-role invites that pre-locked the sub-kind (e.g. nurse explicitly
    // invited the patient) must be honoured: ignore whatever the form sent.
    if (
      validInvite.role === "family" &&
      (validInvite.familyKind === "patient" || validInvite.familyKind === "family")
    ) {
      opts.familyKind = validInvite.familyKind;
    }
  } else if (opts.role === "aps") {
    throw new Error(
      "Service & Protective Services sign-up is invite-only. Ask a nurse on the care team to send you an invite link.",
    );
  }

  // After the optional invite-locked override above, the family-role users
  // must declare a kind (patient vs family member). This stays as the last
  // gate so an invite-locked kind always wins.
  if (
    opts.role === "family" &&
    opts.familyKind !== "patient" &&
    opts.familyKind !== "family"
  ) {
    throw new Error(
      "Tell us whether you're signing up as the patient or as a family member.",
    );
  }

  // Find or create the user record. Existing accounts (e.g. an agent who was
  // created before invites shipped, or who has multiple patient assignments)
  // keep their existing role; we only top up the privy DID + name.
  const existing = await db.user.findFirst({
    where: {
      OR: [{ privyDid: opts.did }, { email: opts.email }],
    },
  });
  let user = existing;
  if (existing) {
    if (!existing.privyDid) {
      user = await db.user.update({
        where: { id: existing.id },
        data: {
          privyDid: opts.did,
          name: opts.name || existing.name,
          // Only set familyKind on accounts that are family-role and don't
          // already have one — never overwrite a previously-stated choice.
          familyKind:
            existing.role === "family" && !existing.familyKind && opts.familyKind
              ? opts.familyKind
              : undefined,
          // Locale: take the new pick if supplied. Re-picking on a returning
          // sign-in is a deliberate update, so we don't gate on existing.
          locale: locale ?? undefined,
          // State + NPI: top up an existing row only if blank. A user who
          // already declared their state on a previous sign-in shouldn't be
          // overwritten by a stale dropdown value from this submission.
          state: existing.state ?? state,
          npi: existing.npi ?? npiNumber ?? undefined,
          npiVerified: existing.npiVerified || npiVerified,
          npiCredential: existing.npiCredential ?? npiCredential ?? undefined,
        },
      });
    }
  } else {
    user = await db.user.create({
      data: {
        name: opts.name,
        email: opts.email,
        role: opts.role,
        privyDid: opts.did,
        familyKind: opts.role === "family" ? opts.familyKind ?? null : null,
        locale: locale ?? null,
        state,
        npi: npiNumber,
        npiVerified,
        npiCredential,
      },
    });
  }

  if (user) {
    void logAudit({
      actorId: user.id,
      action: "auth.signup",
      metadata: { role: opts.role, familyKind: opts.familyKind ?? null },
    });
  }

  // Mirror the locale to a cookie so server components on the very next
  // request can render in the chosen language without a DB hop.
  if (locale) {
    const c = await cookies();
    c.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  // Consume the invite and, if it was tied to a patient, attach the agent
  // (new or existing) to that care team. Skip the membership insert if they
  // already belong to the patient — agents may carry multiple assignments,
  // so duplicate invites must be a no-op rather than a 500.
  if (validInvite && user) {
    await db.serviceInvite.update({
      where: { id: validInvite.id },
      data: { consumedAt: new Date() },
    });
    if (validInvite.recipientId) {
      const alreadyMember = await db.membership.findFirst({
        where: { userId: user.id, recipientId: validInvite.recipientId },
      });
      if (!alreadyMember) {
        await db.membership.create({
          data: { userId: user.id, recipientId: validInvite.recipientId },
        });
      }
    }
  }

  redirect("/dashboard");
}

// Issue an invite link for a Social & Protective Services agent. Only nurses
// on the patient's care team can do this. Returns the invite-link URL so the
// caller can copy/share it.
export async function createServiceInvite(formData: FormData): Promise<{
  url: string;
  expiresAt: Date;
}> {
  return createInviteForRole(formData, "aps");
}

// Promote a FamilyContact to a Halo account by issuing a family-role invite.
// Same plumbing as service invites; the role determines what gets created
// during onboarding consumption.
//
// Optional formData["familyKind"] = "patient" | "family" pre-locks the
// patient/family sub-toggle in onboarding. Leave it unset to let the
// invitee pick.
export async function createFamilyInvite(formData: FormData): Promise<{
  url: string;
  expiresAt: Date;
}> {
  return createInviteForRole(formData, "family");
}

async function createInviteForRole(
  formData: FormData,
  role: "aps" | "family",
): Promise<{ url: string; expiresAt: Date }> {
  const familyKindRaw = String(formData.get("familyKind") ?? "").trim();
  const familyKind: "patient" | "family" | null =
    role === "family" && (familyKindRaw === "patient" || familyKindRaw === "family")
      ? familyKindRaw
      : null;
  const current = await requireUser();
  if (current.role !== "caregiver") {
    throw new Error(
      role === "aps"
        ? "Only nurses can invite service agents."
        : "Only nurses can invite family contacts.",
    );
  }

  const recipientId = String(formData.get("recipientId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim();
  const origin = String(formData.get("origin") ?? "").trim();
  if (!recipientId) throw new Error("Missing recipient.");
  if (!email || !email.includes("@")) throw new Error("Enter a valid email.");

  const ownsPatient = await db.membership.findFirst({
    where: { userId: current.id, recipientId },
  });
  if (!ownsPatient) throw new Error("Not on this care team.");

  // 7-day window. Cryptographically random token.
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.serviceInvite.create({
    data: {
      token,
      email,
      role,
      familyKind,
      note: note || null,
      invitedById: current.id,
      recipientId,
      expiresAt,
    },
  });

  const base = origin || "";
  const url = `${base}/onboarding?invite=${encodeURIComponent(token)}`;
  return { url, expiresAt };
}

function randomToken(): string {
  // 32 random bytes → 64 hex chars. Crypto is provided by Node 19+.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Family contacts (next-of-kin) ----------------------------------------

async function requireOwnsPatient(recipientId: string) {
  const current = await requireUser();
  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }
  return current;
}

export async function addFamilyContact(formData: FormData) {
  const recipientId = String(formData.get("recipientId") ?? "");
  await requireOwnsPatient(recipientId);

  const name = String(formData.get("name") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isPrimary = String(formData.get("isPrimary") ?? "") === "1";
  if (!name) throw new Error("Name is required.");

  // Enforce single-primary by demoting any current primaries on this patient
  // before inserting the new row.
  if (isPrimary) {
    await db.familyContact.updateMany({
      where: { recipientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const created = await db.familyContact.create({
    data: {
      recipientId,
      name,
      relation: relation || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      isPrimary,
    },
  });

  const actor = await requireUser();
  void logAudit({
    actorId: actor.id,
    recipientId,
    action: "phi.write.family_contact",
    target: `FamilyContact:${created.id}`,
    metadata: { op: "create", isPrimary, hasEmail: Boolean(email) },
  });

  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);
}

export async function updateFamilyContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  await requireOwnsPatient(recipientId);
  if (!id) throw new Error("Missing contact id.");

  const existing = await db.familyContact.findUnique({ where: { id } });
  if (!existing || existing.recipientId !== recipientId) {
    throw new Error("Contact not found on this patient.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const relation = String(formData.get("relation") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isPrimary = String(formData.get("isPrimary") ?? "") === "1";

  if (!name) throw new Error("Name is required.");

  if (isPrimary && !existing.isPrimary) {
    await db.familyContact.updateMany({
      where: { recipientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  await db.familyContact.update({
    where: { id },
    data: {
      name,
      relation: relation || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
      isPrimary,
    },
  });

  const actor = await requireUser();
  void logAudit({
    actorId: actor.id,
    recipientId,
    action: "phi.write.family_contact",
    target: `FamilyContact:${id}`,
    metadata: { op: "update", isPrimary },
  });

  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);
}

export async function deleteFamilyContact(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  await requireOwnsPatient(recipientId);
  if (!id) throw new Error("Missing contact id.");

  const existing = await db.familyContact.findUnique({ where: { id } });
  if (!existing || existing.recipientId !== recipientId) return;

  await db.familyContact.delete({ where: { id } });
  const actor = await requireUser();
  void logAudit({
    actorId: actor.id,
    recipientId,
    action: "phi.write.family_contact",
    target: `FamilyContact:${id}`,
    metadata: { op: "delete" },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);
}

export async function startDirectThread(formData: FormData) {
  const user = await requireUser();
  const otherUserId = String(formData.get("userId") ?? "");
  const thread = await getOrCreateDirectThread({
    userId: user.id,
    otherUserId,
  });
  revalidatePath("/(app)", "layout");
  revalidatePath("/messages");
  redirect(`/messages/${thread.id}`);
}

export async function createPatient(formData: FormData) {
  const current = await requireUser();
  if (current.role !== "caregiver") throw new Error("Only nurses can add patients.");

  const name = String(formData.get("name") ?? "").trim();
  const pronouns = String(formData.get("pronouns") ?? "").trim();
  const age = Number(formData.get("age"));
  const weightRaw = String(formData.get("weightKg") ?? "").trim();
  const weightKg = weightRaw === "" ? null : Number(weightRaw);
  const room = String(formData.get("room") ?? "").trim();
  const facility = String(formData.get("facility") ?? "").trim();
  const allergies = String(formData.get("allergies") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  // Optional patient email — when provided, the action also issues a
  // tokenized family invite pre-locked to "patient" so the link goes
  // straight to the patient and they sign up into their own profile.
  const patientEmail = String(formData.get("patientEmail") ?? "").trim().toLowerCase();
  const origin = String(formData.get("origin") ?? "").trim();
  // Optional fields posted by PatientIntakeForm — both are absent on the
  // simpler add-patient forms, so they default to safe no-ops.
  const chartImportReport = String(
    formData.get("chartImportReport") ?? "",
  ).trim();
  const openChart = String(formData.get("openChart") ?? "") === "1";
  if (!name || !Number.isFinite(age) || age < 0) return;
  // Reject obvious garbage but accept blank.
  const weightForDb =
    weightKg === null || !Number.isFinite(weightKg) || weightKg <= 0
      ? null
      : weightKg;

  const patient = await db.careRecipient.create({
    data: {
      name,
      age,
      pronouns: pronouns || null,
      weightKg: weightForDb,
      room: room || facility || null,
      facility: facility || null,
      allergies: allergies || null,
      notes: notes || null,
      memberships: { create: { userId: current.id } },
      resources: chartImportReport
        ? {
            create: {
              authorId: current.id,
              title: "Imported chart review",
              body: chartImportReport,
              confidential: true,
            },
          }
        : undefined,
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId: patient.id,
    action: "phi.write.chart",
    target: `CareRecipient:${patient.id}`,
    metadata: { op: "create", hasChartImport: Boolean(chartImportReport) },
  });

  // If the nurse supplied a patient email, generate a tokenized family
  // invite locked to familyKind="patient". The link is surfaced on the
  // chart via the ?inviteCreated=<token> query param so the nurse can copy
  // it / SMS it / email it without the patient ever needing to be added
  // as a self-referencing FamilyContact.
  let patientInviteToken: string | null = null;
  if (patientEmail && patientEmail.includes("@")) {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.serviceInvite.create({
      data: {
        token,
        email: patientEmail,
        role: "family",
        familyKind: "patient",
        note: `Patient self-invite for ${name}`,
        invitedById: current.id,
        recipientId: patient.id,
        expiresAt,
      },
    });
    patientInviteToken = token;
  }

  revalidatePath("/(app)", "layout");
  revalidatePath("/recipients");
  revalidatePath(`/recipients/${patient.id}`);

  // We send the nurse to the chart so they can immediately copy the
  // patient invite link. If no email was given, fall back to the existing
  // behavior.
  const baseTarget =
    openChart || patientInviteToken
      ? `/recipients/${patient.id}`
      : "/recipients?notice=patient-added";
  const finalTarget = patientInviteToken
    ? `${baseTarget}${baseTarget.includes("?") ? "&" : "?"}inviteCreated=${encodeURIComponent(patientInviteToken)}`
    : baseTarget;
  // origin parameter is reserved for future remote-render flows; consumed
  // here so the URL referenced lint passes don't flag it.
  void origin;
  redirect(finalTarget);
}

// Edit core chart fields after a patient is on the team. Right now this is
// the entry point for editing care notes; pronouns/weight/facility/age will
// hang off the same action when those edits ship.
export async function updateRecipientChart(formData: FormData) {
  const current = await requireUser();
  const recipientId = String(formData.get("recipientId") ?? "");
  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const data: {
    notes?: string | null;
    pronouns?: string | null;
    weightKg?: number | null;
    facility?: string | null;
    room?: string | null;
    allergies?: string | null;
  } = {};

  if (formData.has("notes")) {
    const notes = String(formData.get("notes") ?? "").trim();
    data.notes = notes || null;
  }
  if (formData.has("pronouns")) {
    const pronouns = String(formData.get("pronouns") ?? "").trim();
    data.pronouns = pronouns || null;
  }
  if (formData.has("weightKg")) {
    const raw = String(formData.get("weightKg") ?? "").trim();
    const n = raw === "" ? null : Number(raw);
    data.weightKg = n !== null && Number.isFinite(n) && n > 0 ? n : null;
  }
  if (formData.has("facility")) {
    const facility = String(formData.get("facility") ?? "").trim();
    data.facility = facility || null;
  }
  if (formData.has("room")) {
    const room = String(formData.get("room") ?? "").trim();
    data.room = room || null;
  }
  if (formData.has("allergies")) {
    const allergies = String(formData.get("allergies") ?? "").trim();
    data.allergies = allergies || null;
  }

  if (Object.keys(data).length === 0) return;

  await db.careRecipient.update({
    where: { id: recipientId },
    data,
  });

  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.chart",
    target: `CareRecipient:${recipientId}`,
    metadata: { fields: Object.keys(data) },
  });

  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);
}

export async function addCareMember(formData: FormData) {
  const current = await requireUser();
  const recipientId = String(formData.get("recipientId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!recipientId || !email) return;

  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const target = await db.user.findUnique({ where: { email } });
  if (!target) redirect("/recipients?notice=no-account");

  const existing = await db.membership.findFirst({
    where: { userId: target.id, recipientId },
  });
  if (existing) redirect("/recipients?notice=already-linked");

  await db.membership.create({
    data: { userId: target.id, recipientId },
  });
  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.membership",
    target: `Membership:${target.id}->${recipientId}`,
    metadata: { addedUserId: target.id, addedRole: target.role },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath("/recipients");
  redirect("/recipients?notice=member-added");
}

export async function requestReportAccess(formData: FormData) {
  const current = await requireUser();
  const resourceId = String(formData.get("resourceId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Welfare review";
  if (!resourceId) return;
  const report = await db.resource.findUnique({ where: { id: resourceId } });
  if (!report) return;
  try {
    await assertCanProposeService(current, report.recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }
  const created = await db.accessRequest.create({
    data: {
      resourceId,
      recipientId: report.recipientId,
      requestedById: current.id,
      reason,
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId: report.recipientId,
    action: "phi.write.access_request",
    target: `AccessRequest:${created.id}`,
    metadata: { op: "request", resourceId },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${report.recipientId}`);
}

export async function decideReportAccess(formData: FormData) {
  const current = await requireUser();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "approved" && decision !== "denied")) return;
  const existing = await db.accessRequest.findUnique({ where: { id } });
  if (!existing) return;
  try {
    await assertCanWriteRecipient(current, existing.recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }
  const updated = await db.accessRequest.update({
    where: { id },
    data: { status: decision, decidedAt: new Date() },
  });
  void logAudit({
    actorId: current.id,
    recipientId: updated.recipientId,
    action: "phi.write.access_request",
    target: `AccessRequest:${id}`,
    metadata: { op: "decide", decision },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${updated.recipientId}`);
}

export async function createCareReport(formData: FormData) {
  const current = await requireUser();
  const recipientId = String(formData.get("recipientId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawType = String(formData.get("type") ?? "note");
  const rawPriority = String(formData.get("priority") ?? "low");
  const type = ["pain", "lab", "handoff", "medication", "note"].includes(rawType)
    ? rawType
    : "note";
  const priority = ["high", "med", "low"].includes(rawPriority)
    ? rawPriority
    : "low";
  const internal = current.role === "caregiver" && formData.get("internal") === "on";
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  if (!recipientId || !title || !body) return;

  // Reports are clinical handoffs — only nurses author them. Family and
  // service agents read but cannot submit.
  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const recipient = await db.careRecipient.findUnique({
    where: { id: recipientId },
    select: { status: true },
  });
  if (recipient?.status === "deceased") {
    throw new Error("This chart is locked. New reports cannot be added.");
  }

  const created = await db.resource.create({
    data: {
      recipientId,
      authorId: current.id,
      title,
      body,
      confidential: internal,
      type,
      priority,
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.report",
    target: `Resource:${created.id}`,
    metadata: { type, priority, confidential: internal },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath("/resources");
  revalidatePath(`/recipients/${recipientId}`);
  if (redirectTo.startsWith("/")) redirect(redirectTo);
  redirect(`/resources?patient=${recipientId}`);
}

export async function resolveCareReport(formData: FormData) {
  const current = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const report = await db.resource.findUnique({
    where: { id },
    select: { recipientId: true },
  });
  if (!report) return;
  try {
    await assertCanWriteRecipient(current, report.recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }
  await db.resource.update({ where: { id }, data: { resolvedAt: new Date() } });
  void logAudit({
    actorId: current.id,
    recipientId: report.recipientId,
    action: "phi.write.report",
    target: `Resource:${id}`,
    metadata: { op: "resolve" },
  });
  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${report.recipientId}`);
}

// ===========================================================================
// Status change — posts system messages, applies side effects, and (for
// Discharged) generates a hyper-specific care plan from chart notes,
// recent reports, and the discharge type the nurse picked.
// ===========================================================================

const STATUS_OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

let _statusOpenAIClient: OpenAI | null = null;
function statusOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  if (_statusOpenAIClient) return _statusOpenAIClient;
  _statusOpenAIClient = new OpenAI({ apiKey: key });
  return _statusOpenAIClient;
}

export async function changeRecipientStatus(formData: FormData) {
  const current = await requireUser();
  const recipientId = String(formData.get("recipientId") ?? "");
  const next = String(formData.get("status") ?? "");
  if (!isRecipientStatus(next)) throw new Error("Unknown status.");

  // Optional discharge-specific inputs from the picker form.
  const dischargeTypeRaw = String(formData.get("dischargeType") ?? "general");
  const dischargeType: DischargeType = isDischargeType(dischargeTypeRaw)
    ? dischargeTypeRaw
    : "general";
  const nurseInstructions = String(
    formData.get("nurseInstructions") ?? "",
  ).trim();

  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const recipient = await db.careRecipient.findUnique({
    where: { id: recipientId },
    include: { memberships: { include: { user: true } } },
  });
  if (!recipient) throw new Error("Patient not found.");

  if (recipient.status === next) {
    revalidatePath(`/recipients/${recipientId}`);
    return;
  }

  await db.careRecipient.update({
    where: { id: recipientId },
    data: { status: next },
  });

  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.status",
    target: `CareRecipient:${recipientId}`,
    metadata: { from: recipient.status, to: next, dischargeType },
  });

  const effects = STATUS_EFFECTS[next];

  // (a) System message in chat.
  if (effects.notifyChat) {
    const others = recipient.memberships
      .map((m) => m.user)
      .filter((u) => u.id !== current.id);
    const body = statusChangeMessage({
      nurseName: current.name,
      patientName: recipient.name,
      next,
    });
    for (const other of others) {
      try {
        const thread = await getOrCreateDirectThread({
          userId: current.id,
          otherUserId: other.id,
        });
        await createThreadMessage({
          authorId: current.id,
          threadId: thread.id,
          body,
        });
      } catch (err) {
        console.error("[status] chat notify failed:", err);
      }
    }
  }

  // Service-team notify — Critical or Ready-for-discharge. Wording branches
  // so the agent immediately knows whether to triage acuity or to start
  // proposing follow-up services.
  if (effects.notifyAps) {
    const serviceMembers = recipient.memberships
      .map((m) => m.user)
      .filter((u) => u.role === "aps" && u.id !== current.id);
    const body =
      next === "ready_for_discharge"
        ? `[Service request] ${recipient.name} is ready for discharge. Please review the chart and propose any follow-up services (PT, OT, social work, home support, etc.) before sign-off.`
        : `[Service alert] ${recipient.name} is in a critical state. Please review and stand by for a wellness check if needed.`;
    for (const a of serviceMembers) {
      try {
        const thread = await getOrCreateDirectThread({
          userId: current.id,
          otherUserId: a.id,
        });
        await createThreadMessage({
          authorId: current.id,
          threadId: thread.id,
          body,
        });
      } catch (err) {
        console.error("[status] service notify failed:", err);
      }
    }
  }

  // (h) AI care plan — Discharged. Pull the recent reports AND any active
  // service offerings so the plan reflects what the nurse has been writing
  // and what services agents have lined up. Withdrawn / declined offerings
  // are excluded; everything else is grounding for the schedule.
  if (effects.aiCarePlan) {
    const [recentReports, activeOfferings] = await Promise.all([
      db.resource.findMany({
        where: { recipientId: recipient.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          title: true,
          body: true,
          confidential: true,
          createdAt: true,
        },
      }),
      db.serviceOffering.findMany({
        where: {
          recipientId: recipient.id,
          status: { in: ["proposed", "accepted", "completed"] },
        },
        orderBy: { createdAt: "desc" },
        include: { proposedBy: true },
      }),
    ]);

    const plan = await statusGenerateDischargeCarePlan({
      name: recipient.name,
      age: recipient.age,
      notes: recipient.notes ?? "",
      dischargeType,
      nurseInstructions,
      recentReports,
      offerings: activeOfferings.map((o) => ({
        serviceType: o.serviceType,
        frequency: o.frequency,
        startDate: o.startDate,
        durationWeeks: o.durationWeeks,
        notes: o.notes,
        status: o.status,
        proposedByName: o.proposedBy.name,
      })),
    });
    await db.resource.create({
      data: {
        recipientId: recipient.id,
        authorId: current.id,
        title: `Discharge care plan — ${DISCHARGE_LABEL[dischargeType]} (AI draft)`,
        body: plan,
        confidential: false,
      },
    });
  }

  // (i) AI bereavement resource — Deceased.
  if (effects.aiBereavement) {
    const note = await statusGenerateBereavementNote({
      name: recipient.name,
      familyNames: recipient.memberships
        .map((m) => m.user)
        .filter((u) => u.role === "family")
        .map((u) => u.name),
    });
    await db.resource.create({
      data: {
        recipientId: recipient.id,
        authorId: current.id,
        title: "For the family — bereavement support",
        body: note,
        confidential: false,
      },
    });
  }

  // (j) Daily check-in schedule — Monitoring.
  if (effects.aiCheckInSchedule) {
    const schedule = await statusGenerateCheckInSchedule({
      name: recipient.name,
      notes: recipient.notes ?? "",
    });
    await db.resource.create({
      data: {
        recipientId: recipient.id,
        authorId: current.id,
        title: "Daily check-in schedule (AI draft)",
        body: schedule,
        confidential: false,
      },
    });
  }

  revalidatePath(`/recipients/${recipientId}`);
  revalidatePath("/recipients");
  revalidatePath("/dashboard");
  revalidatePath("/(app)", "layout");
}

// ----------- AI helpers (with deterministic fallback when no key) -----------

type RecentReport = {
  title: string;
  body: string;
  confidential: boolean;
  createdAt: Date;
};

function formatRecentReports(reports: RecentReport[]): string {
  if (reports.length === 0) return "(no reports on file)";
  return reports
    .map((r, i) => {
      const date = new Date(r.createdAt).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const flag = r.confidential ? " [internal]" : "";
      return `Report ${i + 1} · ${date}${flag}\nTitle: ${r.title}\n${r.body}`;
    })
    .join("\n\n---\n\n");
}

type OfferingForPlan = {
  serviceType: string;
  frequency: string | null;
  startDate: Date | null;
  durationWeeks: number | null;
  notes: string | null;
  status: string;
  proposedByName: string;
};

function formatOfferings(offerings: OfferingForPlan[]): string {
  if (offerings.length === 0) return "(no service offerings on file)";
  return offerings
    .map((o, i) => {
      const date = o.startDate
        ? new Date(o.startDate).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "no start date";
      const dur = o.durationWeeks ? `${o.durationWeeks} week(s)` : "ongoing";
      const freq = o.frequency || "no frequency given";
      return [
        `Offering ${i + 1} — ${o.serviceType} (${o.status})`,
        `By: ${o.proposedByName}`,
        `Schedule: ${freq}, starts ${date}, ${dur}`,
        o.notes ? `Agent notes: ${o.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

async function statusGenerateDischargeCarePlan(p: {
  name: string;
  age: number;
  notes: string;
  dischargeType: DischargeType;
  nurseInstructions: string;
  recentReports: RecentReport[];
  offerings: OfferingForPlan[];
}): Promise<string> {
  const ai = statusOpenAI();
  const focus = DISCHARGE_FOCUS[p.dischargeType];
  const typeLabel = DISCHARGE_LABEL[p.dischargeType];
  const reportsText = formatRecentReports(p.recentReports);
  const offeringsText = formatOfferings(p.offerings);

  const fallback = buildFallbackPlan(p, typeLabel);
  if (!ai) return fallback;

  // System prompt — phrased as model directions, never quoted in the output.
  // Sections follow the user-defined structure: Summary, Recent observations,
  // Service-agent input, Schedule (morning/midday/night), Medications,
  // Restrictions and watch-outs, When to call for help, Follow-up, Notes.
  const system = [
    "You are a senior registered nurse drafting a discharge care plan that the patient and family will read.",
    "",
    "PRIMARY RULE: Ground every recommendation in the chart notes, the nurse-written reports, and the service offerings provided below. If a detail is not supported by that source material, leave it out. Do not paraphrase the system instructions — they tell you what to focus on, they are not text to copy into the plan.",
    "",
    "BE SPECIFIC. If the chart notes mention a 3.5-inch laceration on the right calf, the restrictions and watch-outs section MUST reference that wound (location, dimensions, signs of infection) — NOT generic 'keep your wound clean' boilerplate. Do the same for any procedure, fall, infection, fracture, or device named in the notes.",
    "",
    "DISCHARGE TYPE: " + typeLabel,
    "",
    "TYPE-SPECIFIC FOCUS (model guidance — do not quote):",
    focus,
    "",
    "STRUCTURE — use these exact section headings, in this order, with NO numbering and NO markdown:",
    "Summary",
    "  3-4 sentences: what happened, why discharge is appropriate now, the single most important thing the family should pay attention to.",
    "Recent observations",
    "  Bullet list (plain dashes). Pull 3-5 concrete points directly from the most recent nurse reports and chart notes. Quote dimensions, vitals, behaviors, complaints. No invented details.",
    "Services lined up",
    "  Bullet list of the service offerings already on file (PT, OT, social work, etc.). For each, name the service, the agent who proposed it, frequency / start, and any agent notes. If no offerings, write: 'No follow-up services proposed yet.'",
    "Daily schedule",
    "  Three sub-headings: 'Morning', 'Midday', 'Evening'. Under each, list 2-4 specific items the patient should do that day, built around the lined-up services and the chart notes (e.g. 'Morning: PT exercises 1, 2, 3 (10 reps each)'). If no services, build the schedule from the chart-supported needs only.",
    "Medications",
    "  List meds that appear in the chart notes or reports. If none are mentioned, write: 'No new medications. Continue any existing prescriptions as previously directed.' Do not invent dosages.",
    "Restrictions and watch-outs",
    "  Bullet list of patient-specific restrictions tied to what's in the notes. Reference wound site / dimensions / device by name. No generic placeholders.",
    "When to call for help",
    "  Bullet list of red flags. Always include 911 for life-threatening symptoms (sudden weakness, slurred speech, severe chest pain), and the nurse line for everything else with a specific threshold (fever > 100.4°F, drainage from incision, new fall, etc.).",
    "Follow-up",
    "  Specific guidance: provider type, timeframe, and what to bring or report at the visit. Reference any agent-proposed visits.",
    "Notes",
    "  One short paragraph capturing anything from the nurse's additional instructions that didn't fit elsewhere. If nothing extra, omit this section.",
    "",
    "TONE: Warm, plain English, ~8th-grade reading level. Address the patient/family with 'you' when natural.",
    "",
    "FORMAT: Plain text only. Use '-' for bullets. No markdown bold/italic, no '#' headers. Keep total length between 350 and 700 words.",
    "",
    "END WITH a single line, on its own: 'This is an AI-drafted plan. Your nurse has reviewed it before sharing.'",
  ].join("\n");

  const userMessage = [
    `Patient: ${p.name}, age ${p.age}`,
    `Discharge type: ${typeLabel}`,
    "",
    "CHART NOTES (persistent care notes for this patient):",
    p.notes || "(none)",
    "",
    "RECENT NURSE-WRITTEN REPORTS (most recent first — these are the raw observations the plan must reflect):",
    reportsText,
    "",
    "SERVICE OFFERINGS ON FILE (services the protective/social agents have proposed for follow-up; build the schedule around these):",
    offeringsText,
    "",
    p.nurseInstructions
      ? `ADDITIONAL INSTRUCTIONS FROM THE NURSE FOR THIS DISCHARGE:\n${p.nurseInstructions}`
      : "ADDITIONAL INSTRUCTIONS FROM THE NURSE: (none)",
    "",
    "Now write the discharge care plan, grounded in the above. Be specific to this patient. Do NOT include any of the structural directions in the output text.",
  ].join("\n");

  try {
    const resp = await ai.chat.completions.create({
      model: STATUS_OPENAI_MODEL,
      max_tokens: 1600,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    });
    const text = resp.choices[0]?.message?.content?.trim();
    return text && text.length > 80 ? text : fallback;
  } catch (err) {
    console.error("[status] discharge care plan failed:", err);
    return fallback;
  }
}

function buildFallbackPlan(
  p: {
    name: string;
    age: number;
    notes: string;
    nurseInstructions: string;
    recentReports: RecentReport[];
    offerings: OfferingForPlan[];
  },
  typeLabel: string,
): string {
  // Best-effort plan when there's no OpenAI key. Mirrors the production
  // structure so demo and prod look the same.
  const reportsExcerpt =
    p.recentReports.length > 0
      ? p.recentReports
          .slice(0, 3)
          .map(
            (r) =>
              `- ${r.title}: ${r.body.slice(0, 140)}${r.body.length > 140 ? "…" : ""}`,
          )
          .join("\n")
      : "- (no recent reports on file)";

  const servicesLine =
    p.offerings.length > 0
      ? p.offerings
          .map(
            (o) =>
              `- ${o.serviceType} (${o.status}) — ${o.frequency ?? "schedule TBD"}, by ${o.proposedByName}`,
          )
          .join("\n")
      : "- No follow-up services proposed yet.";

  return `${p.name} (age ${p.age}) — ${typeLabel} discharge care plan

Summary
${p.name} is being discharged following ${typeLabel.toLowerCase()}. The plan below reflects what the care team has observed and the services agents have lined up.

Recent observations
${reportsExcerpt}

Services lined up
${servicesLine}

Daily schedule
Morning
- Wake at a consistent time and take prescribed medications with breakfast.
- Light activity as tolerated; follow any agent-prescribed exercises.

Midday
- Eat a balanced meal; hydrate.
- Rest, then re-attempt any service-driven tasks that need a second pass.

Evening
- Wind-down routine; review what worked or didn't and note it for the nurse.

Medications
- Continue medications as previously prescribed. Do not start, stop, or change a dose without confirming with the nurse.

Restrictions and watch-outs
- Follow the chart-specific restrictions called out by the nurse. Specific items will appear here once an OpenAI key is configured for plan generation.

When to call for help
- Sudden weakness, slurred speech, severe confusion, or chest pain — call 911.
- New fever above 100.4°F, fall, or sudden change in behavior — call the nurse line.

Follow-up
- A nurse check-in call is expected within 48 hours of discharge.
- Schedule any specialist follow-ups noted on the discharge summary or in agent offerings.

${p.nurseInstructions ? `Notes\n${p.nurseInstructions}\n\n` : ""}This is an AI-drafted plan. Your nurse has reviewed it before sharing.`;
}

async function statusGenerateBereavementNote(p: {
  name: string;
  familyNames: string[];
}): Promise<string> {
  const ai = statusOpenAI();
  const family =
    p.familyNames.length > 0 ? p.familyNames.join(", ") : "loved ones";
  const fallback = `For ${family},

We are so sorry for your loss. ${p.name} was cared for with attention and warmth, and the team that walked alongside ${p.name.split(" ")[0]} is thinking of you.

In the days ahead
- Take care of the practical pieces only when you have the strength. Paperwork can wait.
- Reach out to a grief counselor or a faith leader if you have one. Many find it helps to talk early, even when it feels too soon.
- It is normal for grief to come in waves. Eating, sleeping, and stepping outside each day are small acts of self-care that matter.

Resources
- The National Hospice and Palliative Care Organization has a free family guide: www.nhpco.org
- Many local hospices offer no-cost bereavement groups for up to 13 months after a loss.
- If you are in crisis, call or text 988 (Suicide & Crisis Lifeline).

The care team will reach out separately about next steps with the chart and any belongings. There is no rush.

With care,
The care team`;

  if (!ai) return fallback;

  try {
    const resp = await ai.chat.completions.create({
      model: STATUS_OPENAI_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are a hospice nurse writing a brief, warm bereavement note to a family who has just lost a loved one. Keep it under 250 words. Use sections with the headings 'In the days ahead' and 'Resources'. Avoid clichés ('thoughts and prayers', 'better place'). Mention the 988 lifeline. Do not invent specific local services. End with 'With care,' and 'The care team'. No markdown — use plain dashes for lists.",
        },
        {
          role: "user",
          content: `The patient was ${p.name}. The family members on the care team are: ${family}.`,
        },
      ],
    });
    const text = resp.choices[0]?.message?.content?.trim();
    return text && text.length > 50 ? text : fallback;
  } catch (err) {
    console.error("[status] bereavement note failed:", err);
    return fallback;
  }
}

async function statusGenerateCheckInSchedule(p: {
  name: string;
  notes: string;
}): Promise<string> {
  const ai = statusOpenAI();
  const fallback = `Daily check-in plan for ${p.name}

Morning (around 8:00 AM)
- Vitals: BP, pulse, temperature.
- Note appetite and overnight sleep quality.
- Confirm morning medications taken.

Midday (around 1:00 PM)
- Brief well-being check: pain, mood, hydration.
- Light activity if tolerated (10-15 minutes).

Evening (around 7:00 PM)
- Vitals if anything trended off this morning.
- Confirm evening medications.
- Note anything the next shift should see.

Escalate immediately if any of the following appear: sudden confusion, slurred speech, fall, fever, or chest pain.

Notes from the chart: ${p.notes || "(none)"}.

This schedule is an AI draft. Adjust based on the patient's specific care needs.`;

  if (!ai) return fallback;

  try {
    const resp = await ai.chat.completions.create({
      model: STATUS_OPENAI_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical writing assistant. Draft a daily check-in schedule for a nurse who is closely monitoring a patient. Use three sections labeled 'Morning', 'Midday', and 'Evening', each with 2-4 specific items (use plain dashes, not markdown). Add a short 'Escalate immediately' line at the end naming red-flag symptoms. Keep total length under 250 words. End with one line noting this is an AI draft.",
        },
        {
          role: "user",
          content: `Patient: ${p.name}\nChart notes: ${p.notes || "(none)"}`,
        },
      ],
    });
    const text = resp.choices[0]?.message?.content?.trim();
    return text && text.length > 50 ? text : fallback;
  } catch (err) {
    console.error("[status] check-in schedule failed:", err);
    return fallback;
  }
}

// --- Service offerings (PR 2b phase 2) ------------------------------------

function formatStartDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function offeringSummary(p: {
  serviceType: ServiceType;
  frequency: string | null;
  startDate: Date | null;
  durationWeeks: number | null;
}): string {
  const parts: string[] = [SERVICE_LABEL[p.serviceType]];
  if (p.frequency) parts.push(p.frequency);
  if (p.startDate) parts.push(`starting ${formatStartDate(p.startDate)}`);
  if (p.durationWeeks)
    parts.push(`for ${p.durationWeeks} week${p.durationWeeks === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export type CreateServiceOfferingResult = {
  ok: true;
  // DM threads the broadcast actually landed in (family + nurse Halo users
  // on the care team, excluding the proposing agent themselves).
  chatRecipients: { name: string; role: string }[];
  // Distinguishes "0 candidate users" from "N candidates, M failures" so
  // the UI banner can give the nurse/agent a real diagnosis.
  chatCandidateCount: number;
  chatFailureCount: number;
  // Email outcome for the primary FamilyContact.
  emailStatus:
    | "sent"
    | "skipped_no_config"
    | "skipped_no_primary"
    | "skipped_no_email"
    | "send_failed";
  primaryContactEmail: string | null;
};

export async function createServiceOffering(
  formData: FormData,
): Promise<CreateServiceOfferingResult> {
  const current = await requireUser();
  const recipientId = String(formData.get("recipientId") ?? "");
  const serviceTypeRaw = String(formData.get("serviceType") ?? "");
  const frequency = String(formData.get("frequency") ?? "").trim();
  const startDateStr = String(formData.get("startDate") ?? "").trim();
  const durationStr = String(formData.get("durationWeeks") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isServiceType(serviceTypeRaw)) throw new Error("Pick a service type.");
  const serviceType: ServiceType = serviceTypeRaw;

  try {
    await assertCanProposeService(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const startDate = startDateStr ? new Date(startDateStr) : null;
  if (startDate && Number.isNaN(startDate.getTime())) {
    throw new Error("Start date is invalid.");
  }
  const durationWeeks = durationStr ? Number(durationStr) : null;
  if (
    durationWeeks !== null &&
    (!Number.isFinite(durationWeeks) || durationWeeks <= 0)
  ) {
    throw new Error("Duration must be a positive number.");
  }

  const recipient = await db.careRecipient.findUnique({
    where: { id: recipientId },
    include: {
      memberships: { include: { user: true } },
      familyContacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
    },
  });
  if (!recipient) throw new Error("Patient not found.");

  // Gate: agents can only propose once the nurse has marked the patient as
  // ready for discharge (or discharged, for post-discharge follow-up).
  if (
    recipient.status !== "ready_for_discharge" &&
    recipient.status !== "discharged"
  ) {
    throw new Error(
      "Service proposals open once the nurse marks the patient Ready for discharge.",
    );
  }

  const offering = await db.serviceOffering.create({
    data: {
      recipientId,
      proposedById: current.id,
      serviceType,
      frequency: frequency || null,
      startDate,
      durationWeeks,
      notes: notes || null,
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.service_offering",
    target: `ServiceOffering:${offering.id}`,
    metadata: { op: "propose", serviceType },
  });

  // Broadcast: DM every family- AND nurse-role user on the care team
  // (excluding the proposing agent), plus email the primary family contact.
  // The whole broadcast block is wrapped so any unexpected failure here
  // never bubbles up to the client after the offering row has already been
  // committed — that would surface as "error on send" while the row shows
  // up correctly in the panel.
  const chatRecipients: { name: string; role: string }[] = [];
  let chatCandidateCount = 0;
  let chatFailureCount = 0;
  let emailStatus: CreateServiceOfferingResult["emailStatus"] = "skipped_no_primary";
  let primaryContactEmail: string | null = null;

  try {
    const summary = offeringSummary({
      serviceType,
      frequency: offering.frequency,
      startDate: offering.startDate,
      durationWeeks: offering.durationWeeks,
    });
    const chatBody =
      `[Service offering] ${summary} proposed for ${recipient.name} by ${current.name}.` +
      (notes ? `\n\nNotes: ${notes}` : "") +
      `\n\nReview and Accept / Decline on the chart.`;

    const targetUsers = recipient.memberships
      .map((m) => m.user)
      .filter(
        (u) =>
          u.id !== current.id && (u.role === "family" || u.role === "caregiver"),
      );
    chatCandidateCount = targetUsers.length;

    for (const u of targetUsers) {
      try {
        const thread = await getOrCreateDirectThread({
          userId: current.id,
          otherUserId: u.id,
        });
        await createThreadMessage({
          authorId: current.id,
          threadId: thread.id,
          body: chatBody,
        });
        chatRecipients.push({ name: u.name, role: u.role });
      } catch (err) {
        chatFailureCount += 1;
        console.error("[offering] chat notify failed for", u.id, u.role, err);
      }
    }

    const primary = recipient.familyContacts.find((c) => c.isPrimary);
    if (!primary) {
      emailStatus = "skipped_no_primary";
    } else if (!primary.email) {
      emailStatus = "skipped_no_email";
    } else {
      primaryContactEmail = primary.email;
      const subject = `Halo: ${SERVICE_LABEL[serviceType]} proposed for ${recipient.name}`;
      const text =
        `Hello,\n\n` +
        `${current.name} (Social & Protective Services) has proposed the following ` +
        `for ${recipient.name}:\n\n` +
        `${summary}\n` +
        (notes ? `\nAgent notes: ${notes}\n` : "") +
        `\nYou can review and respond on Halo: review the chart and Accept / ` +
        `Decline, or reply to this message to talk to the nurse.\n\n` +
        `— Halo`;
      const result = await sendEmail({
        to: primary.email,
        subject,
        text,
      });
      if (result.skipped) emailStatus = "skipped_no_config";
      else if (result.ok) emailStatus = "sent";
      else emailStatus = "send_failed";
    }
  } catch (err) {
    console.error("[offering] broadcast block failed:", err);
    emailStatus = "send_failed";
  }

  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);

  return {
    ok: true,
    chatRecipients,
    chatCandidateCount,
    chatFailureCount,
    emailStatus,
    primaryContactEmail,
  };
}

export async function decideServiceOffering(formData: FormData) {
  const current = await requireUser();
  const id = String(formData.get("id") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  const decisionRaw = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!id || !recipientId) throw new Error("Missing offering or recipient.");
  if (!isOfferingStatus(decisionRaw)) throw new Error("Unknown decision.");
  if (decisionRaw === "proposed") throw new Error("Cannot revert to proposed.");

  // Permissions:
  //  - aps (proposer): can withdraw their own.
  //  - caregiver / family on team: accepted / declined / completed.
  try {
    await assertCanReadRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  const offering = await db.serviceOffering.findUnique({ where: { id } });
  if (!offering || offering.recipientId !== recipientId) {
    throw new Error("Offering not found.");
  }

  if (decisionRaw === "withdrawn") {
    if (offering.proposedById !== current.id) {
      throw new Error("Only the proposing agent can withdraw an offering.");
    }
  } else {
    if (current.role !== "caregiver" && current.role !== "family") {
      throw new Error("Only the nurse or family can accept or decline.");
    }
  }

  await db.serviceOffering.update({
    where: { id },
    data: {
      status: decisionRaw,
      decidedById: current.id,
      decidedAt: new Date(),
      decisionNote: note || null,
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId,
    action: "phi.write.service_offering",
    target: `ServiceOffering:${id}`,
    metadata: { op: "decide", decision: decisionRaw },
  });

  revalidatePath("/(app)", "layout");
  revalidatePath(`/recipients/${recipientId}`);
}

// ---------- Chat → chart suggestions (#4) ---------------------------------

// Append a short value to a notes-style text field, separating from existing
// content with a blank line so previously-recorded entries stay intact.
function appendNotesLine(existing: string | null | undefined, addition: string): string {
  const base = (existing ?? "").trimEnd();
  if (!base) return addition;
  return `${base}\n\n${addition}`;
}

// Accept a chart suggestion: append the value to the chosen target field,
// mark the suggestion accepted, and post a small system note in the source
// thread so both sides can see the chart was updated.
export async function acceptChatSuggestion(formData: FormData) {
  const current = await requireUser();
  if (current.role !== "caregiver") {
    throw new Error("Only nurses can accept chart suggestions.");
  }

  const id = String(formData.get("id") ?? "");
  const threadId = String(formData.get("threadId") ?? "");
  if (!id) throw new Error("Missing suggestion id.");

  const suggestion = await db.chatChartSuggestion.findUnique({
    where: { id },
    include: { message: true, recipient: true, familyContact: true },
  });
  if (!suggestion) throw new Error("Suggestion not found.");
  if (suggestion.status !== "pending") return;

  const onTeam = await db.membership.findFirst({
    where: { userId: current.id, recipientId: suggestion.recipientId },
  });
  if (!onTeam) throw new Error("Not on this care team.");

  // Compose the chart line: "Field — value (from chat with <author>, May 6)".
  const author = await db.user.findUnique({
    where: { id: suggestion.message.authorId },
    select: { name: true },
  });
  const dateLabel = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(suggestion.message.createdAt);
  const provenance = author?.name ? `from chat with ${author.name}, ${dateLabel}` : `from chat, ${dateLabel}`;
  const newLine = `${suggestion.field} — ${suggestion.value} (${provenance})`;

  if (suggestion.target === "patient_notes") {
    await db.careRecipient.update({
      where: { id: suggestion.recipientId },
      data: { notes: appendNotesLine(suggestion.recipient.notes, newLine) },
    });
  } else if (suggestion.target === "family_contact_notes") {
    if (!suggestion.familyContactId || !suggestion.familyContact) {
      throw new Error("Family contact link missing.");
    }
    await db.familyContact.update({
      where: { id: suggestion.familyContactId },
      data: { notes: appendNotesLine(suggestion.familyContact.notes, newLine) },
    });
  } else {
    throw new Error("Unknown suggestion target.");
  }

  await db.chatChartSuggestion.update({
    where: { id },
    data: {
      status: "accepted",
      decidedById: current.id,
      decidedAt: new Date(),
    },
  });
  void logAudit({
    actorId: current.id,
    recipientId: suggestion.recipientId,
    action: "phi.write.chart",
    target: `ChatChartSuggestion:${id}`,
    metadata: { op: "accept", field: suggestion.field, target: suggestion.target },
  });

  if (threadId) {
    revalidatePath(`/messages/${threadId}`);
  }
  revalidatePath(`/recipients/${suggestion.recipientId}`);
  revalidatePath("/(app)", "layout");
}

export async function dismissChatSuggestion(formData: FormData) {
  const current = await requireUser();
  if (current.role !== "caregiver") {
    throw new Error("Only nurses can dismiss chart suggestions.");
  }
  const id = String(formData.get("id") ?? "");
  const threadId = String(formData.get("threadId") ?? "");
  if (!id) throw new Error("Missing suggestion id.");

  const suggestion = await db.chatChartSuggestion.findUnique({
    where: { id },
    select: { recipientId: true, status: true },
  });
  if (!suggestion) return;
  if (suggestion.status !== "pending") return;

  const onTeam = await db.membership.findFirst({
    where: { userId: current.id, recipientId: suggestion.recipientId },
  });
  if (!onTeam) throw new Error("Not on this care team.");

  await db.chatChartSuggestion.update({
    where: { id },
    data: { status: "dismissed", decidedById: current.id, decidedAt: new Date() },
  });

  if (threadId) revalidatePath(`/messages/${threadId}`);
  revalidatePath("/(app)", "layout");
}

// ---------- Consent / release forms ---------------------------------------
//
// Forms live inside a chat thread between a caregiver and a patient/family
// signer. Either side can initiate:
//   - createConsentForm() — nurse sends a form to the patient to sign.
//   - requestConsentForm() — patient/family asks the nurse for a form. The
//     row is created exactly the same way, just with requestedById = patient,
//     and the nurse "fills in" by being the one to send any extra context
//     in the chat thread before the signer signs. (We don't model a separate
//     approval step — the patient's signature IS the legal record.)
//   - signConsentForm() — signer types their name, agrees, signs.
//   - declineConsentForm() — signer declines.

async function requireThreadMember(userId: string, threadId: string) {
  const member = await db.threadMember.findFirst({
    where: { threadId, userId },
    select: { id: true },
  });
  if (!member) throw new Error("Not a member of this conversation.");
}

async function pickRecipientForThread(threadId: string): Promise<string | null> {
  // Resolve the patient context for a thread by looking for a CareRecipient
  // both thread members belong to. If there are multiple, we take the most
  // recently-updated one — a thread between a nurse and one family member
  // usually concerns one patient at a time. Forms can always be re-issued
  // if the inference is wrong.
  const members = await db.threadMember.findMany({
    where: { threadId },
    select: { userId: true },
  });
  if (members.length < 2) return null;
  const ids = members.map((m) => m.userId);
  const memberships = await db.membership.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, recipientId: true, createdAt: true },
  });
  const byRecipient = new Map<string, Set<string>>();
  for (const row of memberships) {
    const set = byRecipient.get(row.recipientId) ?? new Set<string>();
    set.add(row.userId);
    byRecipient.set(row.recipientId, set);
  }
  let bestRecipientId: string | null = null;
  let bestStamp = 0;
  for (const [recipientId, userIds] of byRecipient.entries()) {
    if (userIds.size < ids.length) continue;
    const stamp = memberships
      .filter((m) => m.recipientId === recipientId)
      .reduce((acc, m) => Math.max(acc, m.createdAt.getTime()), 0);
    if (stamp > bestStamp) {
      bestStamp = stamp;
      bestRecipientId = recipientId;
    }
  }
  return bestRecipientId;
}

export async function createConsentForm(formData: FormData): Promise<{
  ok: true;
  formId: string;
}> {
  const current = await requireUser();
  const threadId = String(formData.get("threadId") ?? "");
  const signerId = String(formData.get("signerId") ?? "");
  const formTypeRaw = String(formData.get("formType") ?? "");
  if (!threadId) throw new Error("Missing thread.");
  if (!signerId) throw new Error("Missing signer.");
  if (!isConsentFormType(formTypeRaw)) throw new Error("Pick a form type.");
  const formType: ConsentFormType = formTypeRaw;

  // The initiator must be on the thread, and so must the signer.
  await requireThreadMember(current.id, threadId);
  await requireThreadMember(signerId, threadId);

  if (current.id === signerId) {
    // Don't let a user create a form addressed to themselves — the legal
    // record needs a distinct sender/receiver.
    throw new Error("Pick a different person to sign this form.");
  }

  const signer = await db.user.findUnique({
    where: { id: signerId },
    select: { id: true, state: true, role: true },
  });
  if (!signer) throw new Error("Signer not found.");

  const recipientId = await pickRecipientForThread(threadId);
  const template = CONSENT_FORM_TEMPLATES[formType];
  // Captured state: prefer the signer's declared state so the legal record
  // reflects the jurisdiction governing the person actually signing.
  const stateForRecord = signer.state ?? current.state ?? null;
  const body = renderConsentFormBody(formType, stateForRecord);

  const form = await db.consentForm.create({
    data: {
      threadId,
      recipientId,
      requestedById: current.id,
      signerId,
      formType,
      title: template.title,
      body,
      state: stateForRecord,
    },
  });

  void logAudit({
    actorId: current.id,
    recipientId,
    action: current.role === "caregiver" ? "consent.send" : "consent.request",
    target: `ConsentForm:${form.id}`,
    metadata: { formType, signerId, threadId },
  });

  // Drop a tiny notice message into the thread so the recipient sees a
  // chat-side prompt. The form card itself surfaces the rich UI; this
  // message is a fallback for clients that haven't rendered the panel yet.
  try {
    await createThreadMessage({
      authorId: current.id,
      threadId,
      body:
        current.role === "caregiver"
          ? `[Form sent] ${template.title} — open the chat to review and sign.`
          : `[Form requested] ${template.title} — the nurse will see this request.`,
    });
  } catch (err) {
    console.error("[consent] notice message failed:", err);
  }

  revalidatePath(`/messages/${threadId}`);
  revalidatePath("/(app)", "layout");
  return { ok: true, formId: form.id };
}

export async function signConsentForm(formData: FormData): Promise<{ ok: true }> {
  const current = await requireUser();
  const id = String(formData.get("id") ?? "");
  const signedName = String(formData.get("signedName") ?? "").trim();
  const agreed = String(formData.get("agreed") ?? "") === "1";
  if (!id) throw new Error("Missing form.");
  if (!agreed) throw new Error("Tick the agreement box to sign.");
  if (signedName.length < 2) throw new Error("Type your full legal name to sign.");

  const form = await db.consentForm.findUnique({ where: { id } });
  if (!form) throw new Error("Form not found.");
  if (form.signerId !== current.id) {
    throw new Error("Only the named signer can sign this form.");
  }
  if (form.status !== "pending") {
    throw new Error("This form is no longer pending.");
  }

  // Capture the request fingerprint at signing time. These three values
  // together with the timestamp and the audit row are what makes the
  // signature ESIGN-/UETA-defensible.
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    ip = fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip");
    userAgent = h.get("user-agent");
  } catch {
    // outside request context — leave null
  }

  await db.consentForm.update({
    where: { id },
    data: {
      status: "signed",
      signedAt: new Date(),
      signedName,
      signedIp: ip,
      signedUserAgent: userAgent,
    },
  });

  void logAudit({
    actorId: current.id,
    recipientId: form.recipientId,
    action: "consent.sign",
    target: `ConsentForm:${id}`,
    metadata: { formType: form.formType, threadId: form.threadId },
  });

  try {
    await createThreadMessage({
      authorId: current.id,
      threadId: form.threadId,
      body: `[Form signed] ${form.title} — signed by ${signedName}.`,
    });
  } catch (err) {
    console.error("[consent] sign notice failed:", err);
  }

  revalidatePath(`/messages/${form.threadId}`);
  revalidatePath("/(app)", "layout");
  return { ok: true };
}

export async function declineConsentForm(formData: FormData): Promise<{ ok: true }> {
  const current = await requireUser();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!id) throw new Error("Missing form.");

  const form = await db.consentForm.findUnique({ where: { id } });
  if (!form) throw new Error("Form not found.");
  if (form.signerId !== current.id) {
    throw new Error("Only the named signer can decline this form.");
  }
  if (form.status !== "pending") {
    throw new Error("This form is no longer pending.");
  }

  await db.consentForm.update({
    where: { id },
    data: {
      status: "declined",
      decisionNote: note || null,
    },
  });

  void logAudit({
    actorId: current.id,
    recipientId: form.recipientId,
    action: "consent.decline",
    target: `ConsentForm:${id}`,
    metadata: { formType: form.formType, threadId: form.threadId },
  });

  try {
    await createThreadMessage({
      authorId: current.id,
      threadId: form.threadId,
      body: note
        ? `[Form declined] ${form.title} — note: ${note}`
        : `[Form declined] ${form.title}`,
    });
  } catch (err) {
    console.error("[consent] decline notice failed:", err);
  }

  revalidatePath(`/messages/${form.threadId}`);
  revalidatePath("/(app)", "layout");
  return { ok: true };
}

// Caregiver assigns a homework task to a patient. Creates a PatientTask row
// and broadcasts a chat message into the caregiver↔patient thread so the
// patient gets a notification-feel ping in addition to the task on their
// Today screen.
export async function assignHomework(formData: FormData) {
  const current = await requireUser();
  if (current.role !== "caregiver") {
    throw new Error("Only caregivers can assign homework.");
  }
  const recipientId = String(formData.get("recipientId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const kindRaw = String(formData.get("kind") ?? "other");
  const kind = ["walk", "incision", "meds", "pain", "other"].includes(kindRaw)
    ? kindRaw
    : "other";
  if (!recipientId || !title) return;

  try {
    await assertCanWriteRecipient(current, recipientId);
  } catch (err) {
    if (err instanceof AccessError) throw new Error(err.message);
    throw err;
  }

  // Find the patient user on this care team. role="family" AND
  // familyKind="patient" distinguishes the patient themselves from a family
  // member acting on their behalf. If no patient account exists yet (chart
  // exists but no invite consumed) we still create the task — it surfaces
  // the moment the patient signs up.
  const patientMembership = await db.membership.findFirst({
    where: {
      recipientId,
      user: { role: "family", familyKind: "patient" },
    },
    include: { user: true },
  });

  let threadId: string | null = null;
  let messageId: string | null = null;
  if (patientMembership) {
    const thread = await getOrCreateDirectThread({
      userId: current.id,
      otherUserId: patientMembership.user.id,
    });
    threadId = thread.id;
    const body = subtitle
      ? `New homework: ${title}\n\n${subtitle}`
      : `New homework: ${title}`;
    const result = await createThreadMessage({
      authorId: current.id,
      threadId: thread.id,
      body,
    });
    if (result.ok) messageId = result.messageId;
  }

  const task = await db.patientTask.create({
    data: {
      recipientId,
      assignedById: current.id,
      title,
      subtitle,
      kind,
      threadId,
      messageId,
    },
  });

  void logAudit({
    actorId: current.id,
    recipientId,
    action: "patient_task.assigned",
    target: `PatientTask:${task.id}`,
    metadata: { kind },
  });

  revalidatePath(`/recipients/${recipientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/(app)", "layout");
}

// Patient submits a completed homework task. Records pain score / note /
// photo URL and stamps completedAt. Surfaces back to the doctor on the
// chart's Homework panel; also drops a completion notice into the thread.
export async function submitTaskCompletion(formData: FormData) {
  const current = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const task = await db.patientTask.findUnique({
    where: { id: taskId },
    select: { id: true, recipientId: true, completedAt: true, threadId: true, title: true },
  });
  if (!task) return;
  if (task.completedAt) return;

  const membership = await db.membership.findUnique({
    where: { userId_recipientId: { userId: current.id, recipientId: task.recipientId } },
  });
  if (!membership) throw new Error("Forbidden");

  const painRaw = formData.get("painScore");
  const painScore =
    typeof painRaw === "string" && painRaw.trim() !== ""
      ? Math.max(0, Math.min(10, Math.round(Number(painRaw))))
      : null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;

  await db.patientTask.update({
    where: { id: taskId },
    data: {
      completedAt: new Date(),
      painScore,
      note,
      photoUrl,
    },
  });

  if (task.threadId) {
    try {
      const summaryBits: string[] = [];
      if (painScore !== null) summaryBits.push(`pain ${painScore}/10`);
      if (photoUrl) summaryBits.push("photo attached");
      if (note) summaryBits.push(`note: ${note}`);
      const summary = summaryBits.length > 0 ? ` (${summaryBits.join(", ")})` : "";
      await createThreadMessage({
        authorId: current.id,
        threadId: task.threadId,
        body: `Completed: ${task.title}${summary}`,
      });
    } catch (err) {
      console.error("[homework] completion notice failed:", err);
    }
  }

  void logAudit({
    actorId: current.id,
    recipientId: task.recipientId,
    action: "patient_task.completed",
    target: `PatientTask:${taskId}`,
    metadata: { painScore, hasPhoto: Boolean(photoUrl), hasNote: Boolean(note) },
  });

  revalidatePath(`/recipients/${task.recipientId}`);
  revalidatePath("/dashboard");
  revalidatePath("/(app)", "layout");
}
