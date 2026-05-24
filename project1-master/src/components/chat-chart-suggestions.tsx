import Link from "next/link";
import { Check, FileText, Sparkles, X } from "lucide-react";
import { acceptChatSuggestion, dismissChatSuggestion } from "@/app/actions";

export type ChatChartSuggestionRow = {
  id: string;
  field: string;
  value: string;
  target: string;
  recipientId: string;
  recipientName: string;
  // Snippet of the source message — kept short so the nurse sees what the
  // suggestion was extracted from without leaving the thread.
  sourceSnippet: string;
};

// Card that floats just above the composer with a list of pending chart
// suggestions for this thread. The nurse accepts → value lands on the chart
// with provenance, dismisses → it's gone. There is no auto-write path.
export function ChatChartSuggestions({
  threadId,
  suggestions,
}: {
  threadId: string;
  suggestions: ChatChartSuggestionRow[];
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mx-2 my-2 rounded-xl border border-[rgba(246,189,71,0.35)] bg-[var(--gold-bg)] px-3 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--gold-soft)]">
        <Sparkles className="size-3.5" />
        SUGGESTIONS FROM THIS CHAT
      </div>
      <ul className="flex flex-col gap-1.5">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink)]">
                <FileText className="size-3.5 text-[var(--gold-soft)]" />
                {s.field}
                <span className="text-[10px] font-normal text-[var(--muted)]">
                  → {targetLabel(s.target, s.recipientName)}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] text-[var(--ink-2)]">
                &ldquo;{s.value}&rdquo;
              </div>
              {s.sourceSnippet && (
                <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  from: {s.sourceSnippet}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <form action={acceptChatSuggestion}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="threadId" value={threadId} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md border border-[rgba(246,189,71,0.55)] bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)]"
                >
                  <Check className="size-3.5" />
                  Add to chart
                </button>
              </form>
              <form action={dismissChatSuggestion}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="threadId" value={threadId} />
                <button
                  type="submit"
                  aria-label="Dismiss suggestion"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--ink-2)]"
                >
                  <X className="size-3.5" />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 px-1 text-[10.5px] text-[var(--muted)]">
        Suggestions are drafted from the chat. Nothing is added to the chart
        until you tap{" "}
        <span className="font-semibold text-[var(--ink-2)]">Add to chart</span>.
        {" "}
        <Link
          href={`/recipients/${suggestions[0].recipientId}`}
          className="underline-offset-2 hover:underline"
        >
          Open chart
        </Link>
      </div>
    </div>
  );
}

function targetLabel(target: string, recipientName: string): string {
  if (target === "patient_notes") return `${recipientName}'s chart`;
  if (target === "family_contact_notes") return "family contact notes";
  return target;
}
