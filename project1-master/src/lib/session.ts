import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPrivyDid, isPrivyConfigured } from "@/lib/privy";

export type Role = "caregiver" | "family" | "aps";

export const ROLE_LABEL: Record<Role, string> = {
  caregiver: "Nurse / Care Team",
  family: "Patient / Family",
  // Single role covering both adult and child welfare reviewers plus
  // adjacent social services (PT, OT, social work, home support, etc.).
  aps: "Social & Protective Services",
};

export const ROLE_SHORT: Record<Role, string> = {
  caregiver: "Nurse",
  family: "Patient",
  aps: "Service",
};

const DEMO_COOKIE = "uid";

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1";
}

export type SessionState =
  | { kind: "anon" }
  | { kind: "demo"; user: NonNullable<Awaited<ReturnType<typeof getDemoUser>>> }
  | { kind: "privy"; did: string; user: Awaited<ReturnType<typeof getUserByDid>> };

async function getDemoUser() {
  const c = await cookies();
  const uid = c.get(DEMO_COOKIE)?.value;
  if (!uid) return null;
  return db.user.findUnique({ where: { id: uid } });
}

async function getUserByDid(did: string) {
  return db.user.findUnique({ where: { privyDid: did } });
}

export async function getSession(): Promise<SessionState> {
  if (isPrivyConfigured()) {
    const did = await getPrivyDid();
    if (did) {
      const user = await getUserByDid(did);
      return { kind: "privy", did, user };
    }
  }
  if (isDemoMode()) {
    const u = await getDemoUser();
    if (u) return { kind: "demo", user: u };
  }
  return { kind: "anon" };
}

export async function getCurrentUser() {
  const s = await getSession();
  if (s.kind === "anon") return null;
  return s.user ?? null;
}

export async function getRole(): Promise<Role | null> {
  const u = await getCurrentUser();
  if (!u) return null;
  if (u.role === "caregiver" || u.role === "family" || u.role === "aps") return u.role;
  return null;
}

export async function requireUser() {
  const s = await getSession();
  if (s.kind === "privy" && !s.user) redirect("/onboarding");
  if (s.kind === "anon" || !s.user) redirect("/");
  return s.user;
}

export async function getDirectory() {
  return db.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
}
