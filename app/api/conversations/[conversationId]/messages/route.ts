import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getConversationById } from "@/lib/repos/conversations";
import {
  appendMessage,
  listMessagesByConversation,
  MessageRole,
} from "@/lib/repos/messages";

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

// GET conversation details, messages, and workflows
export async function GET(
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

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const messages = await listMessagesByConversation(conversationId, {
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST (append) a new message to the conversation
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
    const role = body?.role as MessageRole | undefined;
    const content = body?.content;

    if (!role || !["user", "assistant", "system"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const message = await appendMessage({
      conversationId,
      role,
      content,
      metadata: body?.metadata ?? null,
      tokens: typeof body?.tokens === "number" ? body.tokens : null,
      error: typeof body?.error === "string" ? body.error : null,
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to append message", error);
    return NextResponse.json(
      { error: "Failed to append message" },
      { status: 500 }
    );
  }
}
