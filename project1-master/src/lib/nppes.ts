import "server-only";

// NPPES verification — CMS's public NPI Registry.
//
// API docs: https://npiregistry.cms.hhs.gov/registry/help-api
// The endpoint requires no auth, returns JSON, and lets us look up a
// provider by their 10-digit NPI. We use it on nurse sign-up to verify the
// caregiver actually exists in the federal registry; an invalid number
// blocks account creation.
//
// We deliberately do NOT verify name-matching against the registry record
// (someone's display name can legitimately differ from their NPPES legal
// name — RN spouses change names, etc.). Existence + credential type is
// enough at sign-up.

const NPPES_URL = "https://npiregistry.cms.hhs.gov/api/";

export type NppesResult =
  | {
      ok: true;
      npi: string;
      // Credential code from NPPES (e.g. "RN", "LPN", "MD", "PA"). Empty
      // string when NPPES has no credential on file — still counts as
      // verified existence-wise.
      credential: string;
      // First + last name from NPPES, for the audit row only — we don't
      // overwrite the user's display name with it.
      registryName: string;
    }
  | { ok: false; reason: "not-found" | "invalid-format" | "lookup-failed" };

const NPI_LENGTH = 10;

/** Luhn-style checksum NPPES uses to detect typos before hitting the API. */
function npiChecksumValid(raw: string): boolean {
  if (!/^\d{10}$/.test(raw)) return false;
  // NPI uses a Luhn check with constant prefix 80840.
  const digits = ("80840" + raw.slice(0, 9)).split("").map(Number);
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if ((digits.length - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(raw[9]);
}

export async function verifyNpi(rawNpi: string): Promise<NppesResult> {
  const npi = rawNpi.trim();
  if (npi.length !== NPI_LENGTH || !/^\d{10}$/.test(npi) || !npiChecksumValid(npi)) {
    return { ok: false, reason: "invalid-format" };
  }

  // NPPES rate-limits aggressive callers — for sign-up this is fine. We
  // give it a 6s budget so a slow upstream doesn't stall the whole form.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `${NPPES_URL}?number=${encodeURIComponent(npi)}&version=2.1`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false, reason: "lookup-failed" };
    const body = (await res.json()) as {
      result_count?: number;
      results?: Array<{
        basic?: {
          credential?: string;
          first_name?: string;
          last_name?: string;
          organization_name?: string;
          status?: string;
        };
      }>;
    };
    if (!body.result_count || !body.results?.length) {
      return { ok: false, reason: "not-found" };
    }
    const basic = body.results[0].basic ?? {};
    // Inactive NPIs (status "D" = deactivated) should not pass.
    if (basic.status && basic.status !== "A") {
      return { ok: false, reason: "not-found" };
    }
    const registryName =
      basic.organization_name ??
      [basic.first_name, basic.last_name].filter(Boolean).join(" ").trim();
    return {
      ok: true,
      npi,
      credential: (basic.credential ?? "").trim(),
      registryName,
    };
  } catch {
    return { ok: false, reason: "lookup-failed" };
  } finally {
    clearTimeout(timeout);
  }
}
