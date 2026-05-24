"use client";

import { useEffect, useState } from "react";
import { MobilePlusDrawer } from "@/components/mobile-plus-drawer";

type Person = { id: string; name: string; role: string };
type Patient = { id: string; name: string };

export function PlusDrawerHost({
  role,
  people,
  patients,
}: {
  role: string;
  people: Person[];
  patients: Patient[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener("halo:open-plus-drawer", handleOpen);
    return () => window.removeEventListener("halo:open-plus-drawer", handleOpen);
  }, []);

  return (
    <MobilePlusDrawer
      open={open}
      onOpenChange={setOpen}
      role={role}
      people={people}
      patients={patients}
    />
  );
}
