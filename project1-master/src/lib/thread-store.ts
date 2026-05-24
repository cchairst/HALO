import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

type ThreadMemberRow = {
  threadId: string;
  userId: string;
  name: string;
  role: string;
  email: string;
};

type MessageRow = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  authorName: string;
  authorRole: string;
};

type ThreadRow = {
  id: string;
  messageCount: number;
};

export type ThreadUser = {
  id: string;
  name: string;
  role: string;
  email?: string;
};

export type ThreadSummary = {
  id: string;
  members: { user: ThreadUser }[];
  messages: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: ThreadUser;
  }[];
  _count: { messages: number };
};

export type ThreadDetail = {
  id: string;
  members: { user: ThreadUser }[];
  messages: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: ThreadUser;
  }[];
};

function directThreadKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

function mapMessage(row: MessageRow): ThreadSummary["messages"][number] {
  return {
    id: row.id,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      name: row.authorName,
      role: row.authorRole,
    },
  };
}

async function getThreadMembers(threadId: string) {
  const rows = await db.$queryRaw<ThreadMemberRow[]>`
    SELECT
      tm."threadId",
      u.id AS "userId",
      u.name,
      u.role,
      u.email
    FROM "ThreadMember" tm
    JOIN "User" u ON u.id = tm."userId"
    WHERE tm."threadId" = ${threadId}
    ORDER BY tm."joinedAt" ASC
  `;

  return rows.map((row) => ({
    user: {
      id: row.userId,
      name: row.name,
      role: row.role,
      email: row.email,
    },
  }));
}

async function getLatestMessage(threadId: string) {
  const rows = await db.$queryRaw<MessageRow[]>`
    SELECT
      dm.id,
      dm."threadId",
      dm."authorId",
      dm.body,
      dm."createdAt",
      u.name AS "authorName",
      u.role AS "authorRole"
    FROM "DirectMessage" dm
    JOIN "User" u ON u.id = dm."authorId"
    WHERE dm."threadId" = ${threadId}
    ORDER BY dm."createdAt" DESC
    LIMIT 1
  `;

  return rows[0] ? [mapMessage(rows[0])] : [];
}

export async function getThreadSummariesForUser(userId: string, take = 100) {
  const rows = await db.$queryRaw<ThreadRow[]>`
    SELECT
      t.id,
      COUNT(dm.id)::int AS "messageCount"
    FROM "Thread" t
    JOIN "ThreadMember" mine ON mine."threadId" = t.id AND mine."userId" = ${userId}
    LEFT JOIN "DirectMessage" dm ON dm."threadId" = t.id
    GROUP BY t.id
    ORDER BY t."updatedAt" DESC
    LIMIT ${take}
  `;

  return Promise.all(
    rows.map(async (row): Promise<ThreadSummary> => ({
      id: row.id,
      members: await getThreadMembers(row.id),
      messages: await getLatestMessage(row.id),
      _count: { messages: row.messageCount },
    })),
  );
}

export async function getThreadDetailForUser(threadId: string, userId: string) {
  const access = await db.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM "ThreadMember"
    WHERE "threadId" = ${threadId} AND "userId" = ${userId}
    LIMIT 1
  `;
  if (access.length === 0) return null;

  const messages = await db.$queryRaw<MessageRow[]>`
    SELECT
      dm.id,
      dm."threadId",
      dm."authorId",
      dm.body,
      dm."createdAt",
      u.name AS "authorName",
      u.role AS "authorRole"
    FROM "DirectMessage" dm
    JOIN "User" u ON u.id = dm."authorId"
    WHERE dm."threadId" = ${threadId}
    ORDER BY dm."createdAt" ASC
  `;

  return {
    id: threadId,
    members: await getThreadMembers(threadId),
    messages: messages.map(mapMessage),
  } satisfies ThreadDetail;
}

export async function getOrCreateDirectThread({
  userId,
  otherUserId,
}: {
  userId: string;
  otherUserId: string;
}) {
  if (userId === otherUserId) throw new Error("Cannot start a thread with yourself.");

  const key = directThreadKey(userId, otherUserId);

  return db.$transaction(async (tx) => {
    const otherUser = await tx.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    if (!otherUser) throw new Error("User not found.");

    const now = new Date();
    const threadRows = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO "Thread" (id, "directKey", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${key}, ${now}, ${now})
      ON CONFLICT ("directKey") DO UPDATE SET "directKey" = "Thread"."directKey"
      RETURNING id
    `;
    const thread = threadRows[0];
    if (!thread) throw new Error("Could not create thread.");

    await tx.$executeRaw`
      INSERT INTO "ThreadMember" (id, "threadId", "userId", "joinedAt")
      VALUES
        (${randomUUID()}, ${thread.id}, ${userId}, ${now}),
        (${randomUUID()}, ${thread.id}, ${otherUserId}, ${now})
      ON CONFLICT ("threadId", "userId") DO NOTHING
    `;

    return { id: thread.id };
  });
}

export async function insertThreadMessage({
  authorId,
  threadId,
  body,
}: {
  authorId: string;
  threadId: string;
  body: string;
}): Promise<{ ok: true; messageId: string }> {
  return db.$transaction(async (tx) => {
    const membership = await tx.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "ThreadMember"
      WHERE "threadId" = ${threadId} AND "userId" = ${authorId}
      LIMIT 1
    `;
    if (membership.length === 0) throw new Error("Forbidden");

    const now = new Date();
    const messageId = randomUUID();
    await tx.$executeRaw`
      INSERT INTO "DirectMessage" (id, "threadId", "authorId", body, "createdAt")
      VALUES (${messageId}, ${threadId}, ${authorId}, ${body}, ${now})
    `;
    await tx.$executeRaw`
      UPDATE "Thread"
      SET "lastMessageAt" = ${now}, "updatedAt" = ${now}
      WHERE id = ${threadId}
    `;

    return { ok: true as const, messageId };
  });
}
