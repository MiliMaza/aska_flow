import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";

export type ConversationRecord = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
};

const mapConversation = (row: ConversationRow): ConversationRecord => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  createdAt: row.created_at,
});

export async function createConversation(input: {
  userId: string;
  title?: string | null;
}): Promise<ConversationRecord> {
  const id = randomUUID();

  const result = await db.execute({
    sql: `
      INSERT INTO conversations (id, user_id, title)
      VALUES (?, ?, ?)
      RETURNING id, user_id, title, created_at
    `,
    args: [id, input.userId, input.title ?? null],
  });

  if (result.rows.length === 0) {
    throw new Error("Failed to create conversation");
  }

  return mapConversation(result.rows[0] as unknown as ConversationRow);
}

export async function getConversationById(
  conversationId: string,
  userId: string
) {
  const result = await db.execute({
    sql: `
      SELECT id, user_id, title, created_at
      FROM conversations
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    args: [conversationId, userId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(result.rows[0] as unknown as ConversationRow);
}

export async function listConversationsByUser(
  userId: string
): Promise<ConversationRecord[]> {
  const result = await db.execute({
    sql: `
      SELECT id, user_id, title, created_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    args: [userId],
  });

  return result.rows.map((row) =>
    mapConversation(row as unknown as ConversationRow)
  );
}

export async function renameConversation(
  conversationId: string,
  userId: string,
  title: string | null
): Promise<ConversationRecord | null> {
  const result = await db.execute({
    sql: `
      UPDATE conversations
      SET title = ?
      WHERE id = ? AND user_id = ?
      RETURNING id, user_id, title, created_at
    `,
    args: [title, conversationId, userId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapConversation(result.rows[0] as unknown as ConversationRow);
}

export async function deleteConversation(
  conversationId: string,
  userId: string
) {
  const result = await db.execute({
    sql: `
      DELETE FROM conversations
      WHERE id = ? AND user_id = ?
    `,
    args: [conversationId, userId],
  });

  return result.rowsAffected > 0;
}
