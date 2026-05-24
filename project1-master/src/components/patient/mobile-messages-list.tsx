import Link from "next/link";
import { db } from "@/lib/db";
import { HaloLogo, PatientShell } from "@/components/patient/primitives";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleLabel(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Family";
  if (role === "aps") return "Service";
  return "Care team";
}

function previewBody(body: string) {
  const trimmed = body.replace(/\s+/g, " ").trim();
  return trimmed.length > 90 ? `${trimmed.slice(0, 90)}…` : trimmed;
}

function formatStamp(d: Date | null) {
  if (!d) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export async function PatientMobileMessagesList({
  user,
}: {
  user: { id: string; name: string };
}) {
  // One thread row per direct thread the user is on. Pull the most recent
  // message body for each so the list reads like an SMS inbox.
  const threads = await db.thread.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      members: { include: { user: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const rows = threads.map((t) => {
    const others = t.members
      .map((m) => m.user)
      .filter((u) => u.id !== user.id);
    const last = t.messages[0] ?? null;
    return {
      id: t.id,
      title:
        others.length === 0
          ? "Private notes"
          : others.length === 1
            ? others[0].name
            : others.map((u) => u.name.split(" ")[0]).join(", "),
      role: others[0]?.role ?? "caregiver",
      lastBody: last?.body ?? null,
      lastAt: last?.createdAt ?? t.lastMessageAt ?? t.updatedAt,
    };
  });

  return (
    <PatientShell>
      <header className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <HaloLogo size={26} />
          <span
            className="text-[22px] font-semibold tracking-[-0.02em]"
            style={{ color: "var(--p-ink)" }}
          >
            Halo
          </span>
        </div>
      </header>

      <div className="px-5 pt-3">
        <h1
          className="text-[24px] font-bold leading-tight tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          Messages
        </h1>
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4 pb-6">
        {rows.length === 0 ? (
          <div
            className="rounded-2xl px-4 py-6 text-center text-[13px]"
            style={{
              color: "var(--p-muted)",
              background: "var(--p-surface)",
              border: "1px solid var(--p-border)",
            }}
          >
            No messages yet. Your care team will reach out here.
          </div>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/messages/${r.id}`}
              className="flex items-start gap-3 rounded-2xl px-3.5 py-3 active:scale-[0.99] transition"
              style={{
                background: "var(--p-surface)",
                border: "1px solid var(--p-border)",
              }}
            >
              <div
                className="grid size-10 shrink-0 place-items-center rounded-full text-[12px] font-bold"
                style={{
                  background: "#27201a",
                  color: "#f5c97a",
                  border: "1px solid var(--p-border)",
                }}
              >
                {initials(r.title)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="truncate text-[14.5px] font-semibold"
                    style={{ color: "var(--p-ink)" }}
                  >
                    {r.title}
                  </div>
                  <div
                    className="shrink-0 text-[11px] font-medium"
                    style={{ color: "var(--p-muted)" }}
                  >
                    {formatStamp(r.lastAt)}
                  </div>
                </div>
                <div
                  className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.04em]"
                  style={{ color: "var(--p-muted)" }}
                >
                  {roleLabel(r.role)}
                </div>
                {r.lastBody ? (
                  <p
                    className="mt-1 text-[12.5px] leading-snug"
                    style={{ color: "var(--p-ink-2)" }}
                  >
                    {previewBody(r.lastBody)}
                  </p>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </PatientShell>
  );
}
