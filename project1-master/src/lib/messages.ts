import "server-only";

import { extractChartSuggestionsForMessage } from "@/lib/chart-suggestions";
import {
  getOrCreateDirectThread as getOrCreateDirectThreadRecord,
  insertThreadMessage,
} from "@/lib/thread-store";

export const MAX_MESSAGE_LENGTH = 4000;

export async function getOrCreateDirectThread({
  userId,
  otherUserId,
}: {
  userId: string;
  otherUserId: string;
}) {
  return getOrCreateDirectThreadRecord({
    userId,
    otherUserId,
  });
}

export async function createThreadMessage({
  authorId,
  threadId,
  body,
}: {
  authorId: string;
  threadId: string;
  body: string;
}) {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false as const, reason: "empty" };
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const result = await insertThreadMessage({
    authorId,
    threadId,
    body: trimmed,
  });

  // Run the chart-suggestion extractor inline. It catches its own errors
  // so a failure here can never block a chat send. Inline (rather than
  // fire-and-forget) because Next runtimes don't reliably finish dangling
  // work after the response stream closes.
  await extractChartSuggestionsForMessage({
    messageId: result.messageId,
    threadId,
    authorId,
    body: trimmed,
  });

  return result;
}
