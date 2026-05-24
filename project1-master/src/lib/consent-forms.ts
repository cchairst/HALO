// Consent / release form templates. Lives outside the database so updating
// boilerplate text doesn't migrate any signed records — signed forms always
// keep their original body, captured at the time of signing. New form-type
// codes can be added here without a schema migration; ConsentForm.formType
// is a free-text string discriminator.

export type ConsentFormType =
  | "treatment_consent"
  | "records_release"
  | "photo_recording"
  | "telehealth_consent"
  | "general_release";

export type ConsentFormDirection =
  // Nurse sends the form to the patient/family to sign.
  | "nurse_to_signer"
  // Patient/family asks the nurse to issue a form (e.g. "release my records
  // to Dr. X"). The nurse fills in the specifics, then it lands on the
  // signer's side as a pending form.
  | "signer_request";

export type ConsentFormTemplate = {
  type: ConsentFormType;
  title: string;
  // Short one-liner shown on the picker before the form is selected.
  description: string;
  // The body text the signer is agreeing to. Plain text; rendered with
  // whitespace preserved. The {state} token is replaced with the signer's
  // declared U.S. state at the moment the form is sent, so the legal
  // record reflects the right jurisdiction.
  body: string;
  // Which side may originate this form.
  initiator: "nurse" | "signer" | "either";
};

const TREATMENT_CONSENT: ConsentFormTemplate = {
  type: "treatment_consent",
  title: "Consent to treatment",
  description: "Authorizes the care team to provide nursing care and related services.",
  body: `Consent to Treatment

I authorize the nurses and care team identified on my Halo account to provide nursing care, monitoring, and clinical services in connection with my care plan.

I understand:
- I may withdraw this consent at any time by notifying my nurse in writing or through Halo.
- This consent does not waive my rights under the U.S. Health Insurance Portability and Accountability Act (HIPAA) or the privacy laws of {state}.
- Emergency care may be provided without further consent when required to protect my health and safety.

By signing below I acknowledge that I have read and agree to the above.`,
  initiator: "nurse",
};

const RECORDS_RELEASE: ConsentFormTemplate = {
  type: "records_release",
  title: "Authorization to release medical records",
  description:
    "Releases the patient's records to a named recipient (another provider, attorney, family member, etc.).",
  body: `Authorization for Release of Protected Health Information

I authorize the care team to disclose protected health information (PHI) about the patient named on this Halo account.

Records covered: nursing notes, care reports, status changes, vitals, and any service-offering history during the period the patient has been on Halo. The receiving party and the purpose of the release will be specified in the chat message accompanying this form.

I understand:
- This authorization is voluntary. Treatment will not be conditioned on signing it.
- I may revoke this authorization at any time by sending a written revocation through Halo. Revocation does not affect disclosures already made in reliance on it.
- The information disclosed may no longer be protected by HIPAA after it leaves the care team, and could be re-disclosed by the recipient.
- This authorization expires one (1) year from the date of signing unless an earlier expiration is recorded in the chat.

State of signing: {state}

By signing below I confirm I am authorized to release these records and that I have read the terms above.`,
  initiator: "either",
};

const PHOTO_RECORDING: ConsentFormTemplate = {
  type: "photo_recording",
  title: "Consent to photo / audio recording",
  description:
    "Authorizes the care team to capture wound photos, video, or audio for clinical or training purposes.",
  body: `Consent for Photo, Video, or Audio Recording

I authorize members of the Halo care team to capture photographs, video, or audio recordings of the patient for the following purposes:
- Clinical documentation of wounds, mobility, behavior, or other care-relevant observations.
- Internal quality review and care-team handoff.

I understand:
- Recordings are stored alongside the patient's chart and are subject to the same HIPAA protections as other PHI.
- Recordings will not be used for marketing, public-facing publication, or research without a separate, specific authorization.
- I may withdraw this consent at any time. Recordings already captured remain part of the chart unless I separately request deletion.

State of signing: {state}

By signing below I agree to the terms above.`,
  initiator: "nurse",
};

const TELEHEALTH_CONSENT: ConsentFormTemplate = {
  type: "telehealth_consent",
  title: "Consent to telehealth communication",
  description:
    "Acknowledges that chat / video / asynchronous messaging are forms of telehealth and outlines the associated risks.",
  body: `Telehealth Consent

I understand that nursing care, advice, and care-team communication delivered through Halo (including chat messages, video, and asynchronous notes) constitute telehealth services.

I acknowledge:
- Telehealth may involve risks not present in in-person care, including technical failures, delayed responses, and limits on what the clinician can observe.
- Halo messages are sent over encrypted channels and stored in compliance with HIPAA and the laws of {state}, but no electronic system can be guaranteed against all forms of compromise.
- Emergencies should not be reported through Halo. Call 911 or your local emergency services for life-threatening situations.

By signing below I consent to receive care through Halo and acknowledge the items above.`,
  initiator: "nurse",
};

const GENERAL_RELEASE: ConsentFormTemplate = {
  type: "general_release",
  title: "General release / revocation",
  description:
    "Use for any release or revocation that doesn't fit a more specific template. The nurse fills in the body with the details.",
  body: `General Release

The specific terms of this release are recorded in the chat message accompanying this form and in the body completed by the care team.

State of signing: {state}

By signing below I agree to the terms recorded for this release.`,
  initiator: "either",
};

export const CONSENT_FORM_TEMPLATES: Record<ConsentFormType, ConsentFormTemplate> = {
  treatment_consent: TREATMENT_CONSENT,
  records_release: RECORDS_RELEASE,
  photo_recording: PHOTO_RECORDING,
  telehealth_consent: TELEHEALTH_CONSENT,
  general_release: GENERAL_RELEASE,
};

export function isConsentFormType(value: unknown): value is ConsentFormType {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(CONSENT_FORM_TEMPLATES, value)
  );
}

/**
 * Returns the body for `type` with the {state} token replaced by the
 * signer's declared U.S. state at form-creation time. Captured into the
 * row so the legal record never drifts if templates are later updated.
 */
export function renderConsentFormBody(
  type: ConsentFormType,
  state: string | null,
): string {
  const tpl = CONSENT_FORM_TEMPLATES[type];
  return tpl.body.replace(/\{state\}/g, state || "your state");
}

export function consentTemplatesForInitiator(role: "caregiver" | "family" | "aps") {
  // Caregivers can send anything; family/patients can request release-type
  // forms but can't issue a treatment/photo consent to the nurse.
  const initiator = role === "caregiver" ? "nurse" : "signer";
  return Object.values(CONSENT_FORM_TEMPLATES).filter(
    (t) => t.initiator === "either" || t.initiator === initiator,
  );
}
