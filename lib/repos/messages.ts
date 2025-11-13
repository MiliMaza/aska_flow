import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";

export type MessageRole = "user" | "assistant" | "system";

export type MessageRecord = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: unknown | null;
  tokens: number | null;
  error: string | null;
  createdAt: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: string | null;
  tokens: number | null;
  error: string | null;
  created_at: string;
};

const parseJson = (value: string | null): unknown | null => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const serializeJson = (value: unknown | null | undefined): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const mapMessage = (row: MessageRow): MessageRecord => ({
  id: row.id,
  conversationId: row.conversation_id,
  role: row.role,
  content: row.content,
  metadata: parseJson(row.metadata),
  tokens: row.tokens,
  error: row.error,
  createdAt: row.created_at,
});

export async function appendMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: unknown | null;
  tokens?: number | null;
  error?: string | null;
}): Promise<MessageRecord> {
  const id = randomUUID();
  const result = await db.execute({
    sql: `
      INSERT INTO messages (id, conversation_id, role, content, metadata, tokens, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id, conversation_id, role, content, metadata, tokens, error, created_at
    `,
    args: [
      id,
      input.conversationId,
      input.role,
      input.content,
      serializeJson(input.metadata),
      input.tokens ?? null,
      input.error ?? null,
    ],
  });

  if (result.rows.length === 0) {
    throw new Error("Failed to insert message");
  }

  return mapMessage(result.rows[0] as unknown as MessageRow);
}

export async function listMessagesByConversation(
  conversationId: string,
  options: { limit?: number } = {}
): Promise<MessageRecord[]> {
  const { limit } = options;
  const sql = `
    SELECT id, conversation_id, role, content, metadata, tokens, error, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    ${limit ? "LIMIT ?" : ""}
  `;
  const args = limit ? [conversationId, limit] : [conversationId];

  const result = await db.execute({ sql, args });

  return result.rows.map((row) => mapMessage(row as unknown as MessageRow));
}

export async function deleteMessagesByConversation(conversationId: string) {
  await db.execute({
    sql: `DELETE FROM messages WHERE conversation_id = ?`,
    args: [conversationId],
  });
}
