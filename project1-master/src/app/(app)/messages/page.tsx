import { requireUser } from "@/lib/session";
import { PatientMobileMessagesList } from "@/components/patient/mobile-messages-list";

export default async function MessagesIndex() {
  const user = await requireUser();

  return (
    <>
      {/* Mobile: actual chat thread list. The Tambo Care Plan now lives on
          its own /plan tab. */}
      <PatientMobileMessagesList user={{ id: user.id, name: user.name }} />

      {/* Desktop: empty state. The chats sidebar (rendered by the app shell)
          remains the entry point — selecting a thread takes over this area. */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center px-6 text-center text-[var(--muted)]">
        <div className="text-[15px] font-semibold text-[var(--ink-2)]">
          Select a chat
        </div>
        <p className="mt-1 max-w-sm text-[12.5px]">
          Pick a thread on the left to see messages, tasks, files, care plan,
          vitals, and notes.
        </p>
      </div>
    </>
  );
}
