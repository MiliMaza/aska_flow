import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";

export type WorkflowStatus =
  | "pending"
  | "running"
  | "failed"
  | "completed";

export type WorkflowRecord = {
  id: string;
  conversationId: string;
  status: WorkflowStatus;
  result: unknown | null;
  error: string | null;
  createdAt: string;
};

type WorkflowRow = {
  id: string;
  conversation_id: string;
  status: WorkflowStatus;
  result: string | null;
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

const mapWorkflow = (row: WorkflowRow): WorkflowRecord => ({
  id: row.id,
  conversationId: row.conversation_id,
  status: row.status,
  result: parseJson(row.result),
  error: row.error,
  createdAt: row.created_at,
});

export async function createWorkflow(input: {
  conversationId: string;
  status?: WorkflowStatus;
  result?: unknown | null;
  error?: string | null;
}): Promise<WorkflowRecord> {
  const id = randomUUID();

  const result = await db.execute({
    sql: `
      INSERT INTO workflows (id, conversation_id, status, result, error)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, conversation_id, status, result, error, created_at
    `,
    args: [
      id,
      input.conversationId,
      input.status ?? "pending",
      serializeJson(input.result),
      input.error ?? null,
    ],
  });

  if (result.rows.length === 0) {
    throw new Error("Failed to create workflow");
  }

  return mapWorkflow(result.rows[0] as unknown as WorkflowRow);
}

export async function updateWorkflowStatus(
  workflowId: string,
  updates: {
    status?: WorkflowStatus;
    result?: unknown | null;
    error?: string | null;
  }
): Promise<WorkflowRecord | null> {
  if (
    !updates.status &&
    updates.result === undefined &&
    updates.error === undefined
  ) {
    return null;
  }

  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  if (updates.status) {
    fields.push("status = ?");
    args.push(updates.status);
  }

  if (updates.result !== undefined) {
    fields.push("result = ?");
    args.push(serializeJson(updates.result));
  }

  if (updates.error !== undefined) {
    fields.push("error = ?");
    args.push(updates.error);
  }

  args.push(workflowId);

  const result = await db.execute({
    sql: `
      UPDATE workflows
      SET ${fields.join(", ")}
      WHERE id = ?
      RETURNING id, conversation_id, status, result, error, created_at
    `,
    args,
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapWorkflow(result.rows[0] as unknown as WorkflowRow);
}

export async function listWorkflowsByConversation(
  conversationId: string
): Promise<WorkflowRecord[]> {
  const result = await db.execute({
    sql: `
      SELECT id, conversation_id, status, result, error, created_at
      FROM workflows
      WHERE conversation_id = ?
      ORDER BY created_at DESC
    `,
    args: [conversationId],
  });

  return result.rows.map((row) => mapWorkflow(row as unknown as WorkflowRow));
}

export async function getWorkflowById(
  workflowId: string
): Promise<WorkflowRecord | null> {
  const result = await db.execute({
    sql: `
      SELECT id, conversation_id, status, result, error, created_at
      FROM workflows
      WHERE id = ?
      LIMIT 1
    `,
    args: [workflowId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  return mapWorkflow(result.rows[0] as unknown as WorkflowRow);
}
