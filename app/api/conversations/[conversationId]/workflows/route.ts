import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getConversationById } from "@/lib/repos/conversations";
import {
  createWorkflow,
  listWorkflowsByConversation,
  WorkflowStatus,
} from "@/lib/repos/workflows";

class UnauthorizedError extends Error {}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  return userId;
}

// To ensure the conversation exists and belongs to the user
async function ensureConversation(conversationId: string, userId: string) {
  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return null;
  }
  return conversation;
}

// GET all workflows for a conversation
export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { conversationId } = await context.params;
    const conversation = await ensureConversation(conversationId, userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const workflows = await listWorkflowsByConversation(conversationId);
    return NextResponse.json({ workflows });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to fetch workflows", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST (create) a new workflow in a conversation
export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { conversationId } = await context.params;
    const conversation = await ensureConversation(conversationId, userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const status = body?.status as WorkflowStatus | undefined;

    if (
      status &&
      !["pending", "running", "failed", "completed"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const workflow = await createWorkflow({
      conversationId,
      status,
      result: body?.result ?? null,
      error: typeof body?.error === "string" ? body.error : null,
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to create workflow", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}
