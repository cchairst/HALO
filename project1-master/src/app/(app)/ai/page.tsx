import { requireUser } from "@/lib/session";
import { PatientAiChat } from "@/components/patient/ai-chat";

export default async function AiChatPage() {
  const user = await requireUser();
  return (
    <>
      <PatientAiChat user={{ id: user.id, name: user.name }} />
      <div className="hidden md:flex flex-1 items-center justify-center px-6 text-center text-[var(--muted)]">
        <p className="max-w-sm text-[13px]">
          Halo AI is a patient-side conversation. Open this page on a phone.
        </p>
      </div>
    </>
  );
}
