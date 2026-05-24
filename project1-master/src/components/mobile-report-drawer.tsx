"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { createCareReport } from "@/app/actions";
import { MobileActionDrawer, MobileDrawerTrigger } from "@/components/mobile-action-drawer";

type PatientOption = {
  id: string;
  name: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full px-4 text-[14px] font-semibold text-black disabled:opacity-50"
      style={{ background: "#d4a847" }}
    >
      {pending ? "Posting" : "Post report"}
    </button>
  );
}

const fieldClass =
  "h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-white/25";

export function MobileReportDrawer({
  patients,
  canMarkInternal = false,
  defaultOpen = false,
}: {
  patients: PatientOption[];
  canMarkInternal?: boolean;
  defaultOpen?: boolean;
}) {
  return (
    <MobileActionDrawer
      title="Post report"
      subtitle="Share a care update"
      defaultOpen={defaultOpen}
      trigger={(open) => (
        <MobileDrawerTrigger label="+ Post" onClick={open} ariaLabel="Post report" />
      )}
    >
      {patients.length === 0 ? (
        <div className="rounded-[20px] border border-white/10 p-4 text-center">
          <div className="text-[15px] font-semibold text-white">No patients yet</div>
          <p className="mt-1 text-[13px] leading-5 text-white/45">
            Add a patient before posting a report.
          </p>
          <Link
            href="/recipients?add=1"
            className="mt-4 inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold text-black"
            style={{ background: "#d4a847" }}
          >
            Add patient
          </Link>
        </div>
      ) : (
        <form
          action={createCareReport}
          className="flex flex-col gap-2.5 rounded-[20px] border border-white/10 p-3"
        >
          <select
            name="recipientId"
            required
            defaultValue={patients[0]?.id ?? ""}
            className={fieldClass}
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          <input
            name="title"
            required
            placeholder="Title"
            className={fieldClass}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <select name="type" required defaultValue="pain" className={fieldClass}>
              <option value="pain">Pain</option>
              <option value="lab">Lab</option>
              <option value="handoff">Handoff</option>
              <option value="medication">Medication</option>
              <option value="note">Note</option>
            </select>
            <select name="priority" required defaultValue="high" className={fieldClass}>
              <option value="high">High</option>
              <option value="med">Med</option>
              <option value="low">Low</option>
            </select>
          </div>
          <textarea
            name="body"
            required
            rows={4}
            placeholder="What should the care team know?"
            className="min-h-[110px] rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] leading-5 text-white outline-none placeholder:text-white/35 focus:border-white/25"
          />
          {canMarkInternal ? (
            <label className="flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-[13px] text-white/80">
              <input type="checkbox" name="internal" className="h-4 w-4 accent-[#d4a847]" />
              Internal team note
            </label>
          ) : null}
          <SubmitButton />
        </form>
      )}
    </MobileActionDrawer>
  );
}
