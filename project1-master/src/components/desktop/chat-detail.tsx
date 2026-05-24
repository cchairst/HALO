import {
  AtSign,
  BellOff,
  ChevronDown,
  FileText,
  FlaskConical,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Send,
  Smile,
  UserPlus,
  Users,
  Video,
  Wind,
} from "lucide-react";
import { CHAT_311 } from "@/lib/desktop-demo";
import { Avatar, Panel, RiskPill } from "./bits";
import { DesktopTopBar } from "./top-bar";

type ChatThread = {
  id: string;
  members: { user: { id: string; name: string; role: string } }[];
  messages: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: { id: string; name: string; role: string };
  }[];
};

type DesktopChatMessage = {
  kind: "msg";
  author: string;
  role: string;
  time: string;
  body: string;
  attachment?: { name: string; kind: string };
};

type DesktopSystemNoteMessage = {
  kind: "system";
  time: string;
  body: string;
};

type DesktopSystemBlockMessage = {
  kind: "system";
  time: string;
  icon: "users" | "flask" | "wind";
  body: string;
  note: string;
  action?: string;
};

type DesktopDividerMessage = {
  kind: "divider";
  time: string;
  label: string;
};

type DesktopRenderedMessage =
  | DesktopChatMessage
  | DesktopSystemNoteMessage
  | DesktopSystemBlockMessage
  | DesktopDividerMessage;

// Renders the right-rail chat view (image 6). The chat sidebar (left) is
// rendered by the page via <DesktopSidebar variant="chats" />.
export function DesktopChatDetail({
  thread,
  currentUserId,
  send,
}: {
  thread?: ChatThread;
  currentUserId?: string;
  send?: (formData: FormData) => void | Promise<void>;
}) {
  const D = CHAT_311;
  const title = thread ? threadNameFor(thread, currentUserId ?? "") : D.header.title;
  const demoMessages = D.messages as DesktopRenderedMessage[];
  const messageRows: DesktopRenderedMessage[] = thread
    ? [
        ...thread.messages.map((message) => ({
          kind: "msg" as const,
          author: message.author.id === currentUserId ? "You" : message.author.name,
          role: roleLabel(message.author.role),
          time: formatTime(message.createdAt),
          body: message.body,
        })),
        ...demoMessages.filter((message) => message.kind === "system"),
      ]
    : demoMessages;
  return (
    <div className="flex h-screen">
      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-3">
          <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--ink)]">Chats</h1>
          <DesktopTopBar time="7:42 AM" alertsCount={8} />
        </div>

        {/* Chat header */}
        <div className="border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
          <div className="flex items-center gap-3">
            <Avatar initials="RJ" size={36} bg="#272318" fg="#d9b257" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-[16px] font-semibold text-[var(--ink)]">
                  {title}
                </h2>
                <button className="grid size-5 place-items-center text-[var(--muted)]">
                  <Plus className="size-3" />
                </button>
              </div>
              <div className="truncate text-[11.5px] text-[var(--muted)]">
                {thread ? `${thread.members.length} care team members` : D.header.subtitle}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--ink-2)]">
                <Users className="size-3.5" /> {thread?.members.length ?? D.header.participants} participants
              </button>
              <div className="flex items-center -space-x-1.5">
                <Avatar initials="TB" size={22} bg="#272318" fg="#d9b257" />
                <Avatar initials="BV" size={22} bg="#272318" fg="#d9b257" />
                <Avatar initials="DR" size={22} bg="#272318" fg="#d9b257" />
                <span className="grid size-[22px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-semibold text-[var(--muted)]">
                  +3
                </span>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--ink-2)]">
                <span className="text-[var(--muted)]">Room 311</span>
                <span className="text-[var(--muted)]">Med Surg</span>
                <ChevronDown className="size-3 text-[var(--muted)]" />
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--ink-2)]">
                <BellOff className="size-3.5" /> Mute
              </button>
              <button className="grid size-8 place-items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-5 text-[12.5px] font-semibold">
            <span className="border-b-2 border-[var(--gold)] pb-2 text-[var(--gold-soft)]">
              Messages
            </span>
            <span className="text-[var(--muted)]">Tasks <CountBadge>{D.tabs.tasks}</CountBadge></span>
            <span className="text-[var(--muted)]">Files <CountBadge>{D.tabs.files}</CountBadge></span>
            <span className="text-[var(--muted)]">Care Plan</span>
            <span className="text-[var(--muted)]">Vitals</span>
            <span className="text-[var(--muted)]">Notes</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            {messageRows.map((m, i) => {
              if (m.kind === "system") {
                if (isSystemBlock(m)) {
                  return (
                    <SystemBlock
                      key={i}
                      icon={m.icon}
                      title={m.body}
                      note={m.note}
                      action={m.action}
                      time={m.time}
                    />
                  );
                }
                return (
                  <SystemNote key={i} time={m.time} body={m.body} />
                );
              }
              if (m.kind === "divider") {
                return <UnreadDivider key={i} label={m.label} time={m.time} />;
              }
              return <ChatBubble key={i} message={m} />;
            })}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-6 py-3">
          <div className="mb-2 flex items-center gap-4 text-[12.5px] font-semibold">
            <span className="border-b-2 border-[var(--gold)] pb-1 text-[var(--gold-soft)]">Message</span>
            <span className="text-[var(--muted)]">Note</span>
            <span className="text-[var(--muted)]">Alert</span>
            <span className="text-[var(--muted)]">Handoff</span>
          </div>
          <form action={send} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <textarea
              name="body"
              required
              placeholder={`Message ${title}`}
              rows={1}
              className="w-full resize-none bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
            />
            <div className="mt-2 flex items-center gap-2">
              <ComposerIcon><Paperclip className="size-4" /></ComposerIcon>
              <ComposerIcon><Smile className="size-4" /></ComposerIcon>
              <ComposerIcon><AtSign className="size-4" /></ComposerIcon>
              <ComposerIcon><Plus className="size-4" /></ComposerIcon>
              <span className="mx-2 h-5 w-px bg-[var(--border)]" />
              <ComposerButton>
                <Users className="size-3.5" /> Handoff
              </ComposerButton>
              <ComposerButton>
                <FileText className="size-3.5" /> Post report
              </ComposerButton>
              <ComposerButton>
                <UserPlus className="size-3.5" /> Invite family
              </ComposerButton>
              <button
                type="submit"
                aria-label="Send"
                className="ml-auto grid size-8 place-items-center rounded-md"
                style={{ background: "var(--gold)", color: "#1b1712" }}
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right rail */}
      <DesktopChatRightRail />
    </div>
  );
}

function DesktopChatRightRail() {
  const D = CHAT_311;
  const p = D.patient;
  return (
    <aside className="hidden md:flex h-screen w-[320px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-[var(--border)] bg-[var(--background)] px-3 py-4">
      <div className="flex items-center justify-end">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--ink-2)]">
          <BellOff className="size-3.5" /> Mute
        </button>
        <button aria-label="More" className="ml-1 grid size-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)]">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <Panel className="!p-3">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Avatar initials="RJ" size={30} bg="#272318" fg="#d9b257" />
            <div>
              <div className="text-[13px] font-semibold text-[var(--ink)]">{p.name}</div>
              <div className="text-[11px] text-[var(--muted)]">{p.mrn}</div>
            </div>
          </div>
          <button aria-label="More" className="grid size-6 place-items-center text-[var(--muted)]">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-[11.5px]">
          <span className="text-[var(--muted)]">Room / Bed</span>
          <span className="text-right text-[var(--ink-2)]">{p.room}</span>
          <span className="text-[var(--muted)]">Unit</span>
          <span className="text-right text-[var(--ink-2)]">{p.unit}</span>
          <span className="text-[var(--muted)]">Status</span>
          <span className="text-right font-semibold text-[#86efac]">{p.status}</span>
          <span className="text-[var(--muted)]">Attending</span>
          <span className="text-right text-[var(--ink-2)]">{p.attending}</span>
          <span className="text-[var(--muted)]">Code Status</span>
          <span className="text-right text-[var(--ink-2)]">{p.codeStatus}</span>
          <span className="text-[var(--muted)]">Allergies</span>
          <span className="text-right font-semibold text-[#f87171]">{p.allergies}</span>
        </div>
      </Panel>

      <Panel className="!p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">Care team <span className="text-[var(--muted)]">7</span></span>
          <a className="text-[11.5px] font-semibold text-[var(--gold-soft)]" href="#">View all</a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {D.rightRail.careTeam.map((m) => (
            <div key={m.initials} className="flex items-center gap-2">
              <Avatar initials={m.initials} size={26} bg="#272318" fg="#d9b257" />
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-semibold text-[var(--ink)]">
                  {m.name}
                </div>
                <div className="truncate text-[10px] text-[var(--muted)]">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-right text-[10.5px] text-[var(--muted)]">+{D.rightRail.careTeamExtra}</div>
      </Panel>

      <Panel className="!p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">Current tasks <span className="text-[var(--muted)]">3</span></span>
          <a className="text-[11.5px] font-semibold text-[var(--gold-soft)]" href="#">View all</a>
        </div>
        <div className="flex flex-col gap-2">
          {D.rightRail.currentTasks.map((t) => (
            <div key={t.title} className="flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 size-3.5 accent-[var(--gold)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-[var(--ink-2)]">{t.title}</div>
                <div className="text-[10.5px] text-[var(--muted)]">{t.time}</div>
              </div>
              <span className="text-[10.5px] text-[var(--muted)]">{t.due}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="!p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">Meds / Labs alerts <span className="text-[var(--muted)]">2</span></span>
          <a className="text-[11.5px] font-semibold text-[var(--gold-soft)]" href="#">View all</a>
        </div>
        <div className="flex flex-col gap-2">
          {D.rightRail.alerts.map((a) => (
            <div key={a.name} className="grid grid-cols-[18px_1fr_60px_auto] items-center gap-2">
              <FlaskConical className="size-3.5 text-[#f87171]" />
              <span className="truncate text-[12px] font-semibold text-[var(--ink)]">{a.name}</span>
              <span className="text-[10.5px] text-[var(--muted)]">{a.time}</span>
              <RiskPill severity="high">High</RiskPill>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="!p-3">
        <div className="mb-3 text-[12.5px] font-semibold text-[var(--ink)]">Quick actions</div>
        <div className="grid grid-cols-3 gap-2">
          <QuickAction icon={<FileText className="size-4" />}>Handoff report</QuickAction>
          <QuickAction icon={<FileText className="size-4" />}>Post report</QuickAction>
          <QuickAction icon={<UserPlus className="size-4" />}>Invite family</QuickAction>
          <QuickAction icon={<Video className="size-4" />}>Start video call</QuickAction>
          <QuickAction icon={<Phone className="size-4" />}>Notify care team</QuickAction>
        </div>
      </Panel>
    </aside>
  );
}

function isSystemBlock(
  message: DesktopSystemNoteMessage | DesktopSystemBlockMessage,
): message is DesktopSystemBlockMessage {
  return "icon" in message;
}

function ChatBubble({
  message,
}: {
  message: DesktopChatMessage;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar initials={initialsFromName(message.author)} size={32} bg="#272318" fg="#d9b257" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">{message.author}</span>
          {message.role && (
            <span
              className="rounded-md border border-[rgba(96,165,250,0.32)] bg-[rgba(96,165,250,0.12)] px-1.5 py-[1px] text-[10px] font-semibold text-[#93c5fd]"
            >
              {message.role}
            </span>
          )}
          <span className="ml-auto text-[10.5px] text-[var(--muted)]">{message.time}</span>
        </div>
        <div className="mt-1 whitespace-pre-wrap text-[13.5px] leading-snug text-[var(--ink-2)]">
          {message.body}
        </div>
        {message.attachment && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-1.5 text-[11.5px] text-[var(--ink-2)]">
            <FileText className="size-3.5 text-[var(--gold-soft)]" />
            <span className="font-semibold">{message.attachment.name}</span>
            <span className="text-[var(--muted)]">{message.attachment.kind}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SystemNote({ time, body }: { time: string; body: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)]/30 px-3 py-2 text-[11.5px] text-[var(--muted)]">
      <Users className="size-3.5" />
      <span className="flex-1">{body}</span>
      <span className="text-[10.5px]">{time}</span>
    </div>
  );
}

function SystemBlock({
  icon,
  title,
  note,
  action,
  time,
}: {
  icon: "users" | "flask" | "wind";
  title: string;
  note: string;
  action?: string;
  time: string;
}) {
  const Icon = icon === "users" ? Users : icon === "flask" ? FlaskConical : Wind;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--gold-soft)]">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-[var(--ink)]">{title}</span>
          <span className="ml-auto text-[10.5px] text-[var(--muted)]">{time}</span>
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ink-2)]">{note}</div>
        {action && (
          <button className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--ink-2)]">
            <FlaskConical className="size-3" /> {action}
          </button>
        )}
      </div>
    </div>
  );
}

function UnreadDivider({ label, time }: { label: string; time: string }) {
  return (
    <div className="my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-[rgba(201,154,50,0.4)]" />
      <span className="rounded-full border border-[rgba(201,154,50,0.4)] bg-[var(--gold-bg)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.05em] text-[var(--gold-soft)]">
        {label}
      </span>
      <span className="text-[10.5px] text-[var(--muted)]">{time}</span>
      <div className="h-px flex-1 bg-[rgba(201,154,50,0.4)]" />
    </div>
  );
}

function ComposerIcon({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="grid size-7 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]">
      {children}
    </button>
  );
}

function ComposerButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)]/40 px-2 py-1 text-[11px] font-semibold text-[var(--ink-2)]">
      {children}
    </button>
  );
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
      {children}
    </span>
  );
}

function QuickAction({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button className="flex flex-col items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-2 py-2 text-[10.5px] font-semibold text-[var(--ink-2)] hover:border-[rgba(201,154,50,0.4)]">
      <span className="grid size-7 place-items-center rounded-md bg-[var(--surface-2)] text-[var(--gold-soft)]">
        {icon}
      </span>
      <span className="text-center leading-tight">{children}</span>
    </button>
  );
}

function initialsFromName(name: string) {
  return name
    .split(",")[0]
    .split(" ")
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
  return role || "Care team";
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function threadNameFor(thread: ChatThread, currentUserId: string) {
  const others = thread.members
    .filter((member) => member.user.id !== currentUserId)
    .map((member) => member.user.name);
  if (others.length === 0) return "Private notes";
  if (others.length === 1) return others[0];
  return others.join(", ");
}
