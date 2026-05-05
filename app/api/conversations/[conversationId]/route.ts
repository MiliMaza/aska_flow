import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  deleteConversation,
  getConversationById,
  renameConversation,
} from "@/lib/repos/conversations";
import { listMessagesByConversation } from "@/lib/repos/messages";
import { listWorkflowsByConversation } from "@/lib/repos/workflows";

class UnauthorizedError extends Error {}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  return userId;
}

// GET a conversation by ID, including its messages and workflows
export async function GET(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { conversationId } = await context.params;
    const conversation = await getConversationById(conversationId, userId);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const [messages, workflows] = await Promise.all([
      listMessagesByConversation(conversationId),
      listWorkflowsByConversation(conversationId),
    ]);

    return NextResponse.json({
      conversation,
      messages,
      workflows,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to fetch conversation", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PATCH (rename) a conversation
export async function PATCH(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { conversationId } = await context.params;
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : null;

    const updated = await renameConversation(conversationId, userId, title);
    if (!updated) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to rename conversation", error);
    return NextResponse.json(
      { error: "Failed to rename conversation" },
      { status: 500 }
    );
  }
}

// DELETE a conversation
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { conversationId } = await context.params;
    const removed = await deleteConversation(conversationId, userId);

    if (!removed) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to delete conversation", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
