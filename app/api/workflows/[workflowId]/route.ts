import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getConversationById } from "@/lib/repos/conversations";
import {
  getWorkflowById,
  updateWorkflowStatus,
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

// PATCH (update) workflow's status
export async function PATCH(
  request: Request,
  context: { params: Promise<{ workflowId: string }> }
) {
  try {
    const userId = await requireUserId();
    const { workflowId } = await context.params;
    const workflow = await getWorkflowById(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const conversation = await getConversationById(
      workflow.conversationId,
      userId
    );
    if (!conversation) {
      return NextResponse.json(
        { error: "Not authorized to update this workflow" },
        { status: 403 }
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

    const result = body?.result !== undefined ? body.result : undefined;
    const errorMessage =
      body?.error !== undefined
        ? typeof body.error === "string"
          ? body.error
          : JSON.stringify(body.error)
        : undefined;

    const updated = await updateWorkflowStatus(workflowId, {
      status,
      result,
      error: errorMessage,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "No update payload provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({ workflow: updated });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Failed to update workflow", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}
