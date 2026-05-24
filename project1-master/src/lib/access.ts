import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import type { Role } from "@/lib/session";

// ---------------------------------------------------------------------------
// Row-level RBAC for protected health information.
//
// Every server-side read or write that touches a patient (CareRecipient or
// anything pinned to one — Resource, ConsentForm, ServiceOffering, etc.)
// MUST first call one of the assert helpers below. The helpers throw a
// distinguishable `AccessError` on denial; callers either let it bubble (so
// Next renders a 500) or catch and `notFound()` the route.
//
// Rules:
//   - caregiver  → can read + write any patient where Membership(userId, recipientId) exists.
//   - family     → can read patients they're a member of. Cannot write to the chart
//                  itself; can sign consent forms addressed to them.
//   - aps        → can read patients they're a member of. Limited write rights
//                  (propose service offerings, request report access).
// ---------------------------------------------------------------------------

export class AccessError extends Error {
  readonly code: "not-on-team" | "wrong-role" | "anon";
  constructor(code: AccessError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AccessError";
  }
}

type SessionUser = {
  id: string;
  role: string;
};

/**
 * Throws if the user is not on the care team. Returns the membership row
 * so callers don't need to re-query it.
 */
export async function assertCanReadRecipient(
  user: SessionUser,
  recipientId: string,
): Promise<void> {
  if (!recipientId) {
    throw new AccessError("not-on-team", "Missing recipient.");
  }
  const m = await db.membership.findFirst({
    where: { userId: user.id, recipientId },
    select: { id: true },
  });
  if (!m) {
    throw new AccessError("not-on-team", "Not on this care team.");
  }
}

/**
 * Throws unless the user is a caregiver on the team. Writes to the chart
 * itself (notes, status, family contacts, reports) are caregiver-only;
 * narrower role-restricted writes call their own helper below.
 */
export async function assertCanWriteRecipient(
  user: SessionUser,
  recipientId: string,
): Promise<void> {
  if (user.role !== "caregiver") {
    throw new AccessError(
      "wrong-role",
      "Only nurses can edit a patient's chart.",
    );
  }
  await assertCanReadRecipient(user, recipientId);
}

/**
 * Service-agent (aps) variant: must be on the team AND have the aps role.
 * Used for actions like "propose a service offering" / "request report access".
 */
export async function assertCanProposeService(
  user: SessionUser,
  recipientId: string,
): Promise<void> {
  if (user.role !== "aps") {
    throw new AccessError(
      "wrong-role",
      "Only Social & Protective Services agents can do that.",
    );
  }
  await assertCanReadRecipient(user, recipientId);
}

/**
 * Convenience for the patient-list pages: returns the CareRecipient ids the
 * current user is allowed to see. family-role hides discharged patients to
 * match the legacy /recipients listing.
 */
export async function getReadableRecipientIds(
  user: SessionUser,
): Promise<string[]> {
  const rows = await db.membership.findMany({
    where: {
      userId: user.id,
      ...(user.role === "family"
        ? { recipient: { status: { not: "discharged" } } }
        : {}),
    },
    select: { recipientId: true },
  });
  return rows.map((r) => r.recipientId);
}

// ---------------------------------------------------------------------------
// Audit log — required by HIPAA's audit-control standard. Records are
// append-only; never updated, never deleted from application code.
// ---------------------------------------------------------------------------

export type AuditAction =
  // Authentication / account lifecycle.
  | "auth.signup"
  | "auth.signin"
  | "auth.signout"
  | "auth.idle_lock"
  // PHI reads — fired by route handlers when a user lands on a chart view.
  | "phi.read.chart"
  | "phi.read.timeline"
  | "phi.read.thread"
  | "phi.read.report"
  // PHI writes.
  | "phi.write.chart"
  | "phi.write.report"
  | "phi.write.status"
  | "phi.write.family_contact"
  | "phi.write.membership"
  | "phi.write.service_offering"
  | "phi.write.access_request"
  // Consent forms.
  | "consent.request"
  | "consent.send"
  | "consent.sign"
  | "consent.decline"
  | "consent.revoke"
  // NPPES validation result.
  | "npi.verified"
  | "npi.rejected"
  // Doctor-assigned homework tasks.
  | "patient_task.assigned"
  | "patient_task.completed";

export async function logAudit(opts: {
  actorId?: string | null;
  recipientId?: string | null;
  action: AuditAction;
  target?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Best-effort request fingerprint. headers() throws outside a request
  // context (e.g. background workers), so guard it.
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    ip = fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip");
    userAgent = h.get("user-agent");
  } catch {
    // not in a request — leave as null
  }

  try {
    await db.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        recipientId: opts.recipientId ?? null,
        action: opts.action,
        target: opts.target ?? null,
        ip,
        userAgent,
        metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : null,
      },
    });
  } catch (err) {
    // Audit failures must NEVER block the user action. Log and continue —
    // a missed audit row is preferable to a broken chart save.
    console.error("[audit] write failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Role narrowing helper so callers don't have to widen the session-user type.
// ---------------------------------------------------------------------------
export function isRole(value: string, role: Role): boolean {
  return value === role;
}
