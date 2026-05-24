"use client";

import { MobileActionDrawer, MobileDrawerTrigger } from "@/components/mobile-action-drawer";
import { PatientIntakeForm } from "@/components/patient-intake-form";

/**
 * Mobile + Add drawer triggered from the Patients screen header. Uses the
 * same PatientIntakeForm as the bottom-nav plus drawer so chart upload,
 * pronouns, and weight are available everywhere.
 */
export function MobilePatientDrawer({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  return (
    <MobileActionDrawer
      title="Add patient"
      subtitle="Drop a chart or fill in by hand"
      defaultOpen={defaultOpen}
      trigger={(open) => (
        <MobileDrawerTrigger label="+ Add" onClick={open} ariaLabel="Add patient" />
      )}
    >
      <PatientIntakeForm />
    </MobileActionDrawer>
  );
}
