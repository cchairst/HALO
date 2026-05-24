import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Inbox,
  Paperclip,
  PhoneCall,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Users,
  Video,
} from "lucide-react";
import { DesktopChatDetail } from "@/components/desktop/chat-detail";
import { MobileChatActions } from "@/components/mobile-chat-actions";
import { MobileChatDetail } from "@/components/mobile-chat-detail";
import { LiveTranslatePanel } from "@/components/live-translate-panel";
import { TranslateMessageButton } from "@/components/translate-message-button";
import {
  ChatChartSuggestions,
  type ChatChartSuggestionRow,
} from "@/components/chat-chart-suggestions";
import {
  ConsentFormPanel,
  type ConsentFormCounterpart,
  type ConsentFormRow,
} from "@/components/consent-form-panel";
import { isConsentFormType } from "@/lib/consent-forms";
import { createThreadMessage, MAX_MESSAGE_LENGTH } from "@/lib/messages";
import { Pill } from "@/components/glass";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/access";
import { getThreadDetailForUser } from "@/lib/thread-store";

type Author = { id: string; name: string; role: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function avatarBg(role: string): string {
  if (role === "caregiver") return "#efe3c7";
  if (role === "family") return "#e7ddcc";
  if (role === "aps") return "#ded6c8";
  return "#f4ead1";
}

function roleLabel(role: string) {
  if (role === "caregiver") return "Nurse";
  if (role === "family") return "Patient";
  if (role === "aps") return "Service";
  return "Care team";
}

function formatTime(d: Date) {
  return new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateHeader(d: Date) {
  const today = new Date();
  const dt = new Date(d);
  const sameDay =
    dt.getFullYear() === today.getFullYear() &&
    dt.getMonth() === today.getMonth() &&
    dt.getDate() === today.getDate();
  if (sameDay) return "Today";
  return dt.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function threadNameFor(
  members: { user: { id: string; name: string } }[],
  currentUserId: string,
) {
  const others = members.filter((m) => m.user.id !== currentUserId).map((m) => m.user.name);
  if (others.length === 0) return "Private notes";
  if (others.length === 1) return others[0];
  return others.join(", ");
}

export default async function MessageThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const thread = await getThreadDetailForUser(id, user.id);
  if (!thread) notFound();

  void logAudit({
    actorId: user.id,
    action: "phi.read.thread",
    target: `Thread:${id}`,
    metadata: { memberCount: thread.members.length },
  });

  async function post(formData: FormData) {
    "use server";
    const author = await requireUser();
    const result = await createThreadMessage({
      body: String(formData.get("body") ?? ""),
      authorId: author.id,
      threadId: id,
    });
    if (!result.ok) return;
    revalidatePath("/(app)", "layout");
    revalidatePath("/messages");
    revalidatePath(`/messages/${id}`);
    redirect(`/messages/${id}#bottom`);
  }

  type Group = {
    author: Author;
    mine: boolean;
    createdAt: Date;
    bodies: { id: string; body: string; createdAt: Date }[];
  };
  const rendered: (
    | { kind: "group"; group: Group }
    | { kind: "datebreak"; label: string; key: string }
  )[] = [];
  let last: Group | null = null;
  let lastDay = "";
  for (const message of thread.messages) {
    const dayLabel = formatDateHeader(message.createdAt);
    if (dayLabel !== lastDay) {
      rendered.push({ kind: "datebreak", label: dayLabel, key: `d-${dayLabel}` });
      lastDay = dayLabel;
      last = null;
    }
    const within5 =
      last &&
      +new Date(message.createdAt) - +new Date(last.createdAt) < 5 * 60 * 1000 &&
      last.author.id === message.author.id;
    if (within5 && last) {
      last.bodies.push({ id: message.id, body: message.body, createdAt: message.createdAt });
    } else {
      const group: Group = {
        author: message.author,
        mine: message.author.id === user.id,
        createdAt: message.createdAt,
        bodies: [{ id: message.id, body: message.body, createdAt: message.createdAt }],
      };
      rendered.push({ kind: "group", group });
      last = group;
    }
  }

  const title = threadNameFor(thread.members, user.id);
  const counterpart = thread.members.find((m) => m.user.id !== user.id)?.user ?? user;

  // Consent / release forms for this thread. We fetch every form (pending,
  // signed, declined, revoked) and pass them to the panel; the panel groups
  // them visually. Only narrow to the current thread — forms in other
  // threads must remain invisible here.
  const consentFormsRaw = await db.consentForm.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { id: true, name: true } },
      signer: { select: { id: true, name: true } },
    },
  });
  const consentForms: ConsentFormRow[] = consentFormsRaw
    .filter((f) => isConsentFormType(f.formType))
    .map((f) => ({
      id: f.id,
      formType: f.formType as ConsentFormRow["formType"],
      title: f.title,
      body: f.body,
      status:
        f.status === "signed" || f.status === "declined" || f.status === "revoked"
          ? f.status
          : "pending",
      requestedById: f.requestedBy.id,
      requestedByName: f.requestedBy.name,
      signerId: f.signer.id,
      signerName: f.signer.name,
      signedAt: f.signedAt,
      signedName: f.signedName,
      decisionNote: f.decisionNote,
      createdAt: f.createdAt,
    }));

  // Other thread members the current user can address a form to. We filter
  // out the current user themselves — the action also rejects self-addressed
  // forms but the picker should never offer them in the first place.
  const consentCounterparts: ConsentFormCounterpart[] = thread.members
    .filter((m) => m.user.id !== user.id)
    .map((m) => ({
      id: m.user.id,
      name: m.user.name,
      role: m.user.role,
    }));

  const currentRoleForPanel: "caregiver" | "family" | "aps" =
    user.role === "caregiver" || user.role === "family" || user.role === "aps"
      ? user.role
      : "family";

  // Pending chart suggestions for this thread — surfaced only to caregivers.
  // We pull bodies of the source messages along so each chip can show a
  // short snippet of where the suggestion came from.
  const pendingSuggestions: ChatChartSuggestionRow[] =
    user.role === "caregiver"
      ? await (async () => {
          const messageIds = thread.messages.map((m) => m.id);
          if (messageIds.length === 0) return [];
          const rows = await db.chatChartSuggestion.findMany({
            where: { status: "pending", messageId: { in: messageIds } },
            include: {
              recipient: { select: { id: true, name: true } },
              message: { select: { body: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 6,
          });
          return rows.map((r) => ({
            id: r.id,
            field: r.field,
            value: r.value,
            target: r.target,
            recipientId: r.recipientId,
            recipientName: r.recipient.name,
            sourceSnippet:
              r.message.body.length > 80
                ? `${r.message.body.slice(0, 80)}...`
                : r.message.body,
          }));
        })()
      : [];
  const subtitle = thread.members
    .map((m) => `${m.user.name.split(",")[0]} (${roleLabel(m.user.role)})`)
    .join(" | ");
  const mobileSubtitle =
    thread.members
      .filter((m) => m.user.id !== user.id)
      .map((m) => roleLabel(m.user.role))
      .join(" | ") || "Private notes";

  return (
    <>
      {/* Consent / release forms — mobile placement. Sits above the mobile
          chat surface so a pending signature is always one tap away. */}
      <div className="md:hidden">
        <ConsentFormPanel
          threadId={id}
          currentUserId={user.id}
          currentUserRole={currentRoleForPanel}
          counterparts={consentCounterparts}
          forms={consentForms}
        />
      </div>
      <MobileChatDetail thread={thread} currentUserId={user.id} send={post} />
      <div className="hidden mobile-chat-shell md:hidden -mx-4 -mt-4 min-h-[calc(100dvh-5rem)] overflow-hidden rounded-b-[1.5rem] border-b border-[var(--mobile-line)]">
        <div className="relative z-10">
          <header className="sticky top-0 z-20 border-b border-[var(--mobile-line)] bg-[var(--mobile-cream)] px-3 pb-2 pt-3">
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                aria-label="Back to messages"
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--mobile-line)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--mobile-ink)] transition hover:bg-[var(--surface-2)] active:scale-95"
              >
                <ArrowLeft className="size-4 text-[var(--mobile-gold)]" />
                Chats
              </Link>
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--mobile-line)] bg-[var(--surface)] px-2 py-1">
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--mobile-line)] text-[11px] font-bold text-[#17120b]"
                  style={{ background: avatarBg(counterpart.role) }}
                >
                  {initials(title)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-[15px] font-bold leading-tight tracking-[-0.02em] text-[var(--mobile-ink)]">
                    {title}
                  </h1>
                  <p className="truncate text-[11px] font-medium text-[var(--mobile-muted)]">
                    {mobileSubtitle}
                  </p>
                </div>
              </div>
              <div className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--mobile-line)] bg-[var(--surface)] px-2.5 text-[12px] font-bold text-[var(--mobile-gold-deep)]">
                <Users className="size-4" />
                <span>{thread.members.length}</span>
              </div>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto px-1">
              <Pill tone="live" className="shrink-0">
                <ShieldCheck className="size-3" />
                Connected
              </Pill>
              <Pill tone="neutral" className="shrink-0">
                Care team
              </Pill>
            </div>
          </header>

          <LiveTranslatePanel compact />

          <section className="flex min-h-[calc(100dvh-22rem)] flex-col gap-3 px-4 pb-2 pt-4">
            {rendered.length === 0 && (
              <div className="mobile-chat-enter mx-auto mt-6 max-w-[280px] rounded-2xl border border-[var(--mobile-line)] bg-[var(--surface)] px-5 py-7 text-center">
                <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--mobile-gold)] text-[#1b1712]">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="text-[15px] font-extrabold text-[var(--mobile-ink)]">
                  Start the care chat
                </div>
                <p className="mt-1 text-[13px] leading-5 text-[var(--mobile-muted)]">
                  Send the first message or tap a quick need.
                </p>
              </div>
            )}

            {rendered.map((row, i) => {
              if (row.kind === "datebreak") {
                return (
                  <div
                    key={row.key}
                    className="mobile-chat-enter mx-auto rounded-full border border-[var(--mobile-line)] bg-[var(--surface)] px-3 py-1 text-[12px] font-semibold text-[var(--mobile-muted)]"
                  >
                    {row.label}
                  </div>
                );
              }

              const group = row.group;
              if (group.mine) {
                return (
                  <div
                    key={`m-${i}-${group.bodies[0].id}`}
                    className="mobile-chat-enter flex flex-col items-end gap-1"
                  >
                    <div className="flex max-w-[80%] flex-col items-end gap-1">
                      {group.bodies.map((body) => (
                        <div
                          key={body.id}
                          className="rounded-[20px] rounded-br-lg border border-[rgba(201,154,50,0.32)] px-4 py-2.5 text-[16px] leading-[1.3] text-[var(--mobile-bubble-mine-fg)] whitespace-pre-wrap [background:var(--mobile-bubble-mine)]"
                        >
                          {body.body}
                        </div>
                      ))}
                    </div>
                    <div className="mr-1 flex items-center gap-1 text-[11px] font-medium text-[var(--mobile-muted)]">
                      <span>{formatTime(group.createdAt)}</span>
                      <CheckCheck className="size-3.5 text-[var(--mobile-gold)]" />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`o-${i}-${group.bodies[0].id}`}
                  className="mobile-chat-enter flex items-end gap-2"
                >
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--mobile-line)] text-[10px] font-bold text-[#17120b]"
                    style={{ background: avatarBg(group.author.role) }}
                  >
                    {initials(group.author.name)}
                  </div>
                  <div className="min-w-0 max-w-[80%]">
                    <div className="mb-1 px-1 text-[11px] font-bold text-[var(--mobile-muted)]">
                      {group.author.name.split(",")[0]}
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.bodies.map((body) => (
                        <div
                          key={body.id}
                          className="rounded-[20px] rounded-bl-lg border border-[var(--mobile-line)] bg-[var(--bubble-other-bg)] px-4 py-2.5 text-[16px] leading-[1.3] text-[var(--mobile-ink)] whitespace-pre-wrap"
                        >
                          {body.body}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 px-1 text-[11px] font-medium text-[var(--mobile-muted)]">
                      {formatTime(group.createdAt)}
                    </div>
                    <TranslateMessageButton text={group.bodies.map((body) => body.body).join("\n")} />
                  </div>
                </div>
              );
            })}
          </section>

          <ChatChartSuggestions threadId={id} suggestions={pendingSuggestions} />

          <MobileChatActions
            action={post}
            placeholder={`Message ${title}`}
            maxLength={MAX_MESSAGE_LENGTH}
          />
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col">
        {/* Consent / release forms — desktop placement. Renders inside the
            same flex column as the chat detail so it scrolls with the page,
            not as a fixed pill on top. */}
        <ConsentFormPanel
          threadId={id}
          currentUserId={user.id}
          currentUserRole={currentRoleForPanel}
          counterparts={consentCounterparts}
          forms={consentForms}
        />
        <DesktopChatDetail thread={thread} currentUserId={user.id} send={post} />
      </div>
      <div className="hidden flex-col gap-0 -mx-4 md:-mx-8 -mt-4 md:-mt-6">
        <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="size-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-xs font-semibold text-[var(--ink)] shrink-0"
              style={{ background: avatarBg(counterpart.role) }}
            >
              {initials(title)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-semibold text-[var(--ink)] truncate">
                  {title}
                </h1>
                <span className="status-dot" />
              </div>
              <div className="text-[11px] text-[var(--muted)] truncate">{subtitle}</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <HeaderIcon icon={<PhoneCall className="size-4" />} label="Call" />
            <HeaderIcon icon={<Video className="size-4" />} label="Video" />
            <HeaderIcon icon={<Users className="size-4" />} label="Team" badge={thread.members.length} />
            <HeaderIcon icon={<Inbox className="size-4" />} label="Inbox" />
            <div className="ml-1 hidden lg:flex relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" />
              <input
                placeholder="Search chat"
                className="w-44 pl-7 pr-2 py-1 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] focus:border-[var(--ink)]/40 outline-none min-h-7"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2 md:px-6">
          <LiveTranslatePanel />
        </div>

        <div className="flex-1 px-2 md:px-4 py-4 flex flex-col gap-1.5">
          {rendered.length === 0 && (
            <div className="text-center text-sm text-[var(--muted)] py-10">
              No messages yet. Start the conversation.
            </div>
          )}
          {rendered.map((row, i) => {
            if (row.kind === "datebreak") {
              return (
                <div key={row.key} className="flex items-center gap-3 my-3 px-2">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <div className="text-[11px] tracking-[-0.01em] font-medium text-[var(--muted)]">
                    {row.label}
                  </div>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              );
            }

            const group = row.group;
            if (group.mine) {
              return (
                <div
                  key={`g-${i}-${group.bodies[0].id}`}
                  className="flex flex-col items-end gap-0.5 px-2 py-1"
                >
                  <div className="flex flex-col items-end gap-1 max-w-[78%]">
                    {group.bodies.map((body, bodyIndex) => (
                      <div
                        key={body.id}
                        className="rounded-2xl rounded-br-md border border-[rgba(201,154,50,0.3)] bg-[var(--bubble-mine-bg)] text-[var(--bubble-mine-fg)] px-3.5 py-2 text-[15px] leading-[1.4] whitespace-pre-wrap"
                        style={bodyIndex === 0 ? undefined : { borderTopRightRadius: "10px" }}
                      >
                        {body.body}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] mr-1 mt-0.5">
                    You - {formatTime(group.createdAt)}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`g-${i}-${group.bodies[0].id}`}
                className="flex items-end gap-2 px-2 py-1"
              >
                <div
                  className="size-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[10px] font-semibold text-[var(--ink)] shrink-0"
                  style={{ background: avatarBg(group.author.role) }}
                >
                  {initials(group.author.name)}
                </div>
                <div className="min-w-0 max-w-[78%] flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[12px] font-semibold text-[var(--ink)]">
                      {group.author.name.split(",")[0]}
                    </span>
                    <Pill
                      tone={
                        group.author.role === "aps"
                          ? "aps"
                          : group.author.role === "caregiver"
                            ? "open"
                            : "neutral"
                      }
                      className="!text-[9px] !py-0 !px-1.5"
                    >
                        {roleLabel(group.author.role)}
                    </Pill>
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.bodies.map((body) => (
                      <div
                        key={body.id}
                        className="rounded-2xl rounded-bl-md bg-[var(--bubble-other-bg)] border border-[var(--border)] text-[var(--bubble-other-fg)] px-3.5 py-2 text-[15px] leading-[1.4] whitespace-pre-wrap"
                      >
                        {body.body}
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] px-1 mt-0.5">
                    {formatTime(group.createdAt)}
                  </div>
                  <TranslateMessageButton text={group.bodies.map((body) => body.body).join("\n")} />
                </div>
              </div>
            );
          })}
        </div>

        <ChatChartSuggestions threadId={id} suggestions={pendingSuggestions} />

        <form action={post} className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--background)] px-3 pb-3 pt-2 md:px-6 md:pb-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-end gap-1 px-2 py-1.5">
            <button
              type="button"
              aria-label="Attach"
              className="size-8 rounded-md text-[var(--muted)] hover:text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex items-center justify-center transition"
            >
              <Plus className="size-4.5" />
            </button>
            <textarea
              name="body"
              required
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              placeholder={`Message ${title}`}
              className="flex-1 resize-none bg-transparent border-0 outline-none px-1 py-2 text-[14.5px] placeholder:text-[var(--muted-2)] min-h-9 max-h-32"
            />
            <button
              type="button"
              aria-label="Attach file"
              className="size-8 rounded-md text-[var(--muted)] hover:text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex items-center justify-center transition"
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Emoji"
              className="size-8 rounded-md text-[var(--muted)] hover:text-[var(--ink-2)] hover:bg-[var(--surface-2)] flex items-center justify-center transition"
            >
              <Smile className="size-4" />
            </button>
            <button
              type="submit"
              aria-label="Send"
              className="size-8 rounded-md bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] flex items-center justify-center transition"
            >
              <Send className="size-4" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-1.5 px-1 text-[10px] text-[var(--muted)]">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] font-mono">
                Enter
              </kbd>{" "}
              to send - visible to the care team
            </span>
            <span className="hidden sm:inline">{thread.messages.length} messages</span>
          </div>
        </form>
      </div>

      <div id="bottom" className="h-px" />
    </>
  );
}

function HeaderIcon({
  icon,
  label,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      aria-label={label}
      className="relative inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] font-semibold text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
      title={label}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="ml-0.5 min-w-4 rounded-full bg-[var(--accent)] px-1 text-center text-[9px] font-bold leading-4 text-[var(--accent-fg)]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
