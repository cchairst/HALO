"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { startDirectThread } from "@/app/actions";
import { MobileActionDrawer, MobileDrawerTrigger } from "@/components/mobile-action-drawer";

type Person = {
  id: string;
  name: string;
  role: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Patient or family";
  if (role === "aps") return "Service";
  return "Care team";
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#d4a847] disabled:opacity-40"
      style={{ border: "0.5px solid #d4a847" }}
    >
      {pending ? "Opening" : "Message"}
    </button>
  );
}

export function MobileNewChatDrawer({
  people,
  defaultOpen = false,
}: {
  people: Person[];
  defaultOpen?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (person) =>
        person.name.toLowerCase().includes(q) ||
        roleLabel(person.role).toLowerCase().includes(q),
    );
  }, [people, query]);

  return (
    <MobileActionDrawer
      title="New chat"
      subtitle="Pick someone on the care team"
      defaultOpen={defaultOpen}
      trigger={(open) => (
        <MobileDrawerTrigger label="+ Chat" onClick={open} ariaLabel="Start chat" />
      )}
    >
      <div className="flex flex-col gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
          className="h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-white/25"
        />

        <div className="overflow-hidden rounded-[18px] border border-white/10">
          {filtered.length === 0 ? (
            <div className="px-4 py-5 text-center text-[13px] leading-5 text-white/45">
              No matches yet. Add or invite people from Patients.
            </div>
          ) : (
            filtered.map((person, index) => (
              <form
                key={person.id}
                action={startDirectThread}
                className={[
                  "flex min-h-[58px] items-center gap-3 px-3 py-2.5",
                  index === filtered.length - 1 ? "" : "border-b border-white/[0.06]",
                ].join(" ")}
              >
                <input type="hidden" name="userId" value={person.id} />
                <div
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {initials(person.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">
                    {person.name}
                  </div>
                  <div className="truncate text-[12px] text-white/45">
                    {roleLabel(person.role)}
                  </div>
                </div>
                <SubmitButton />
              </form>
            ))
          )}
        </div>
      </div>
    </MobileActionDrawer>
  );
}
