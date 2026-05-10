import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import {
  createConversation,
  listConversationsByUser,
} from "@/lib/repos/conversations";
import { upsertUser } from "@/lib/repos/users";

class UnauthorizedError extends Error {}

async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError("No autorizado");
  }
  return userId;
}

// GET all conversations for the current user
export async function GET() {
  try {
    const userId = await requireUserId();
    const conversations = await listConversationsByUser(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Fallo al cargar las conversaciones", error);
    return NextResponse.json(
      { error: "Fallo al cargar las conversaciones" },
      { status: 500 },
    );
  }
}

// POST (create) a new conversation for the current user
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { title } = (await request.json()) ?? {};

    const profile = await currentUser();
    await upsertUser({
      id: userId,
      email: profile?.primaryEmailAddress?.emailAddress,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      imageUrl: profile?.imageUrl,
    });

    const conversation = await createConversation({
      userId,
      title: typeof title === "string" ? title : null,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Fallo al crear la conversación", error);
    return NextResponse.json(
      { error: "Fallo al crear la conversación" },
      { status: 500 },
    );
  }
}
