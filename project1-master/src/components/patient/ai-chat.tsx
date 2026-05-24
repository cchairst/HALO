"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import {
  HaloLogo,
  I,
  PatientShell,
} from "@/components/patient/primitives";
import {
  MealPlanCard,
  NearbyPlacesCard,
  RecoveryShopCard,
  type MealPlanProps,
  type NearbyPlacesProps,
  type RecoveryShopProps,
} from "@/components/patient/care-plan/cards";
import { HaloTamboProvider, TAMBO_UI_STORAGE_KEY, hasLiveTamboKey } from "@/lib/tambo";

// A scripted Halo AI chat. Real Tambo agent calls would go here when an
// API key is configured; for the demo we match user input against a few
// keyword buckets and stream a matching card after a short typing pause.
//
// The user types something like "find me a walking group" and the bot
// answers with a one-line ack plus a streamed NearbyPlaces card.

type Reply =
  | { kind: "text"; text: string }
  | { kind: "nearby"; props: NearbyPlacesProps }
  | { kind: "shop"; props: RecoveryShopProps }
  | { kind: "meal"; props: MealPlanProps };

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; reply: Reply };

const SUGGESTIONS = [
  "Find a walking group near me",
  "What should I buy for my knee?",
  "Help me eat better this week",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function resolveReply(input: string): Reply {
  const q = input.toLowerCase();

  if (/(walk|group|nearby|near me|clinic|pt|yoga|pool|class)/.test(q)) {
    return {
      kind: "nearby",
      props: {
        title: "Recovery spots near you",
        subtitle: "Picked for your post-op knee, Day 4",
        places: [
          {
            name: "MOTION Physical Therapy",
            kind: "pt_clinic",
            distance: "0.8 mi",
            detail: "Outpatient PT, post-arthroscopy specialists",
            cta: "Book intake",
          },
          {
            name: "Riverside Walking Group",
            kind: "walking_group",
            distance: "12 min walk",
            detail: "Easy pace, meets Tue/Thu 9am",
          },
          {
            name: "Glide Aquatics Center",
            kind: "pool",
            distance: "1.4 mi",
            detail: "Warm pool · low-impact for joint recovery",
          },
        ],
        tone: "green",
      },
    };
  }

  if (/(buy|product|shop|gear|brace|ice|monitor|supplement)/.test(q)) {
    return {
      kind: "shop",
      props: {
        title: "Things to support your recovery",
        subtitle: "Matched to your knee rehab plan",
        items: [
          {
            name: "Reusable gel ice wrap (knee)",
            why: "Daily icing reduces post-arthroscopy swelling",
            price: "$24.99",
            retailer: "Amazon",
          },
          {
            name: "Adjustable hinged knee brace",
            why: "Stability for short walks while you heal",
            price: "Covered by insurance",
            retailer: "CVS",
          },
          {
            name: "Whey + collagen protein blend",
            why: "Supports tissue repair on a high-protein day plan",
            price: "$32.00",
            retailer: "Thorne",
          },
        ],
        tone: "ochre",
      },
    };
  }

  if (/(eat|meal|food|recipe|protein|diet|cook)/.test(q)) {
    return {
      kind: "meal",
      props: {
        title: "High-protein meal plan",
        subtitle: "Today’s recovery meals",
        meals: [
          {
            name: "Greek yogurt bowl",
            sub: "Greek yogurt, berries, almonds, honey",
            kind: "yogurt",
          },
          {
            name: "Lemon herb chicken & quinoa",
            sub: "With roasted vegetables",
            kind: "chicken",
          },
          {
            name: "Cottage cheese & pineapple",
            sub: "With chia seeds",
            kind: "cottage",
          },
        ],
      },
    };
  }

  return {
    kind: "text",
    text: "I can help you find local recovery groups, recommend products, or build a meal plan around your doctor’s plan. What would you like first?",
  };
}

export function PatientAiChat({
  user,
}: {
  user: { id: string; name: string };
}) {
  const [tamboEnabled, setTamboEnabled] = useState(false);
  const tamboAvailable = hasLiveTamboKey();
  const useLiveTambo = tamboAvailable && tamboEnabled;

  useEffect(() => {
    try {
      setTamboEnabled(window.localStorage.getItem(TAMBO_UI_STORAGE_KEY) === "true");
    } catch {
      setTamboEnabled(false);
    }
  }, []);

  function updateTamboEnabled(enabled: boolean) {
    setTamboEnabled(enabled);
    try {
      window.localStorage.setItem(TAMBO_UI_STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage failures; the in-session toggle still works.
    }
  }

  return (
    <HaloTamboProvider userId={user.id} enabled={useLiveTambo}>
      {useLiveTambo ? (
        <LiveTamboAiChat
          tamboAvailable={tamboAvailable}
          tamboEnabled={tamboEnabled}
          onTamboToggle={updateTamboEnabled}
        />
      ) : (
        <ScriptedAiChat
          tamboAvailable={tamboAvailable}
          tamboEnabled={tamboEnabled}
          onTamboToggle={updateTamboEnabled}
        />
      )}
    </HaloTamboProvider>
  );
}

type TamboToggleProps = {
  tamboAvailable: boolean;
  tamboEnabled: boolean;
  onTamboToggle: (enabled: boolean) => void;
};

function ScriptedAiChat({ tamboAvailable, tamboEnabled, onTamboToggle }: TamboToggleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the bottom every time something appends.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setTyping(true);
    // Short pause for the type-indicator feel — long enough to read as
    // "AI is thinking" without dragging the demo.
    window.setTimeout(() => {
      const reply = resolveReply(trimmed);
      setMessages((prev) => [...prev, { id: uid(), role: "ai", reply }]);
      setTyping(false);
    }, 700);
  }

  return (
    <PatientShell>
      <header className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <Link
            href="/plan"
            aria-label="Back to plan"
            className="grid size-9 place-items-center rounded-full"
            style={{
              background: "var(--p-surface)",
              border: "1px solid var(--p-border)",
              color: "var(--p-ink-2)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <HaloLogo size={22} />
            <span
              className="text-[18px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--p-ink)" }}
            >
              Halo AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TamboModeToggle
            tamboAvailable={tamboAvailable}
            tamboEnabled={tamboEnabled}
            onTamboToggle={onTamboToggle}
          />
          <span
            className="patient-chip px-2 py-0.5 text-[10.5px]"
            style={{ background: "var(--p-green-bg)", color: "var(--p-green-bright)" }}
          >
            {I.sparkle} Demo
          </span>
        </div>
      </header>

      {/* Scroll surface — pad-bottom leaves room above the sticky composer. */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pt-4 pb-32"
      >
        {messages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) =>
              m.role === "user" ? (
                <UserBubble key={m.id} text={m.text} />
              ) : (
                <AiBubble key={m.id} reply={m.reply} />
              ),
            )}
            {typing ? <TypingBubble /> : null}
          </div>
        )}
      </div>

      {/* Composer — sticky to the bottom, above the global tab bar. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="fixed bottom-4 left-1/2 z-20 w-[min(94vw,440px)] -translate-x-1/2 px-3"
      >
        <div
          className="flex items-end gap-2 rounded-[24px] px-3 py-2"
          style={{
            background: "var(--p-surface)",
            border: "1px solid var(--p-border)",
            boxShadow: "0 12px 30px -16px rgba(0,0,0,0.35)",
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Ask Halo AI…"
            className="flex-1 resize-none bg-transparent text-[14.5px] leading-snug outline-none"
            style={{ color: "var(--p-ink)", minHeight: 28, maxHeight: 96 }}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send"
            className="grid size-9 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-50"
            style={{
              background: "var(--p-green-bright)",
              color: "#0c1a10",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2 12l20-9-9 20-2-9z" />
            </svg>
          </button>
        </div>
      </form>
    </PatientShell>
  );
}


function LiveTamboAiChat({ tamboAvailable, tamboEnabled, onTamboToggle }: TamboToggleProps) {
  const { messages } = useTambo();
  const { value, setValue, submit, isPending } = useTamboThreadInput();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tamboMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [tamboMessages, isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setValue(trimmed);
    window.setTimeout(() => submit(), 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  return (
    <PatientShell>
      <header className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <Link
            href="/plan"
            aria-label="Back to plan"
            className="grid size-9 place-items-center rounded-full"
            style={{
              background: "var(--p-surface)",
              border: "1px solid var(--p-border)",
              color: "var(--p-ink-2)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <HaloLogo size={22} />
            <span className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: "var(--p-ink)" }}>
              Halo AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TamboModeToggle
            tamboAvailable={tamboAvailable}
            tamboEnabled={tamboEnabled}
            onTamboToggle={onTamboToggle}
          />
          <span className="patient-chip px-2 py-0.5 text-[10.5px]" style={{ background: "var(--p-green-bg)", color: "var(--p-green-bright)" }}>
            {I.sparkle} Tambo live
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-32">
        {tamboMessages.length === 0 ? (
          <EmptyState onPick={send} />
        ) : (
          <div className="flex flex-col gap-3">
            {tamboMessages.map((message: unknown, index: number) => (
              <TamboMessageBubble key={getMessageKey(message, index)} message={message} />
            ))}
            {isPending ? <TypingBubble /> : null}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="fixed bottom-4 left-1/2 z-20 w-[min(94vw,440px)] -translate-x-1/2 px-3">
        <div className="flex items-end gap-2 rounded-[24px] px-3 py-2" style={{ background: "var(--p-surface)", border: "1px solid var(--p-border)", boxShadow: "0 12px 30px -16px rgba(0,0,0,0.35)" }}>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask Halo AI…"
            className="flex-1 resize-none bg-transparent text-[14.5px] leading-snug outline-none"
            style={{ color: "var(--p-ink)", minHeight: 28, maxHeight: 96 }}
          />
          <button type="submit" disabled={!String(value).trim() || isPending} aria-label="Send" className="grid size-9 shrink-0 place-items-center rounded-full transition active:scale-95 disabled:opacity-50" style={{ background: "var(--p-green-bright)", color: "#0c1a10" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 12l20-9-9 20-2-9z" /></svg>
          </button>
        </div>
      </form>
    </PatientShell>
  );
}

function TamboModeToggle({ tamboAvailable, tamboEnabled, onTamboToggle }: TamboToggleProps) {
  const active = tamboAvailable && tamboEnabled;
  return (
    <label
      className="flex items-center gap-2 rounded-full px-2 py-1 text-[10.5px] font-semibold"
      title={tamboAvailable ? "Toggle live Tambo agent mode" : "Add NEXT_PUBLIC_TAMBO_API_KEY to enable Tambo"}
      style={{
        background: active ? "var(--p-green-bg-2)" : "var(--p-surface)",
        border: `1px solid ${active ? "var(--p-green-ring)" : "var(--p-border)"}`,
        color: active ? "var(--p-green-bright)" : "var(--p-muted)",
      }}
    >
      <span>Tambo</span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={!tamboAvailable}
        onClick={() => tamboAvailable && onTamboToggle(!tamboEnabled)}
        className="relative h-5 w-9 rounded-full transition disabled:opacity-50"
        style={{
          background: active ? "var(--p-green-bright)" : "var(--p-border)",
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition"
          style={{ left: active ? 18 : 2 }}
        />
      </button>
    </label>
  );
}

function TamboMessageBubble({ message }: { message: unknown }) {
  const msg = message as { role?: string; content?: unknown; renderedComponent?: ReactNode };
  const text = tamboContentToText(msg.content);
  const isUser = msg.role === "user";

  if (isUser) return <UserBubble text={text} />;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="ml-1 inline-flex w-fit items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--p-muted)" }}>
        {I.sparkle} Halo AI
      </div>
      {text ? <AiBubble reply={{ kind: "text", text }} /> : null}
      {msg.renderedComponent ? <div>{msg.renderedComponent}</div> : null}
    </div>
  );
}

function tamboContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return content == null ? "" : String(content);
}

function getMessageKey(message: unknown, index: number) {
  if (message && typeof message === "object" && "id" in message) {
    return String((message as { id?: unknown }).id ?? index);
  }
  return String(index);
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-8 text-center">
      <span
        className="grid size-14 place-items-center rounded-full"
        style={{
          background: "var(--p-green-bg)",
          color: "var(--p-green-bright)",
          border: "1px solid var(--p-green-ring)",
        }}
      >
        {I.sparkle}
      </span>
      <div>
        <div
          className="text-[18px] font-bold tracking-[-0.02em]"
          style={{ color: "var(--p-ink)" }}
        >
          What can I help with today?
        </div>
        <p
          className="mt-1 text-[13px]"
          style={{ color: "var(--p-muted)" }}
        >
          Local groups, recovery products, meal ideas — anything to stick to
          your plan.
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 self-stretch">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-2xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition active:scale-[0.99]"
            style={{
              background: "var(--p-surface)",
              border: "1px solid var(--p-border)",
              color: "var(--p-ink-2)",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] rounded-[20px] rounded-br-md px-3.5 py-2 text-[14.5px] leading-snug"
        style={{
          background: "var(--p-green-bg-2)",
          color: "var(--p-ink)",
          border: "1px solid var(--p-green-ring)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function AiBubble({ reply }: { reply: Reply }) {
  if (reply.kind === "text") {
    return (
      <div className="flex justify-start">
        <div
          className="max-w-[85%] rounded-[20px] rounded-bl-md px-3.5 py-2 text-[14.5px] leading-snug"
          style={{
            background: "var(--p-surface)",
            color: "var(--p-ink-2)",
            border: "1px solid var(--p-border)",
          }}
        >
          {reply.text}
        </div>
      </div>
    );
  }
  // For card replies we render the card directly (no enclosing bubble) so it
  // reads as a streamed UI element rather than a wrapped chat reply.
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="ml-1 inline-flex w-fit items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.04em]"
        style={{ color: "var(--p-muted)" }}
      >
        {I.sparkle} Halo AI
      </div>
      {reply.kind === "nearby" ? (
        <NearbyPlacesCard {...reply.props} />
      ) : reply.kind === "shop" ? (
        <RecoveryShopCard {...reply.props} />
      ) : (
        <MealPlanCard {...reply.props} />
      )}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 rounded-[18px] rounded-bl-md px-3 py-2"
        style={{
          background: "var(--p-surface)",
          border: "1px solid var(--p-border)",
        }}
      >
        <span className="ai-typing-dot" />
        <span className="ai-typing-dot" style={{ animationDelay: "0.15s" }} />
        <span className="ai-typing-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
