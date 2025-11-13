import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, UIMessage, convertToModelMessages } from "ai";
import { n8nWorkflowSchema } from "@/lib/workflow-schema";
import { securityScan } from "@/lib/security-scanner";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createConversation,
  getConversationById,
} from "@/lib/repos/conversations";
import { appendMessage } from "@/lib/repos/messages";
import { upsertUser } from "@/lib/repos/users";
import { createWorkflow } from "@/lib/repos/workflows";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Limit input length to prevent excessive usage
const MAX_INPUT_LENGTH = 2000;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      messages,
      conversationId,
    }: { messages: UIMessage[]; conversationId?: string } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "The storic messages are required." },
        { status: 400 }
      );
    }

    const latestUserInput = messages[messages.length - 1]?.parts.find(
      (part) => part.type === "text"
    )?.text;

    if (
      typeof latestUserInput !== "string" ||
      latestUserInput.length > MAX_INPUT_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const profile = await currentUser();
    await upsertUser({
      id: userId,
      email: profile?.primaryEmailAddress?.emailAddress,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      imageUrl: profile?.imageUrl,
    });

    let conversation: Awaited<ReturnType<typeof createConversation>> | null =
      null;
    if (conversationId && conversationId.length > 0) {
      conversation = await getConversationById(conversationId, userId);

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    if (!conversation) {
      const title = latestUserInput.trim().slice(0, 80) || "Nueva conversación";
      conversation = await createConversation({ userId, title });
    }

    await appendMessage({
      conversationId: conversation.id,
      role: "user",
      content: latestUserInput,
      metadata: { uiMessages: messages },
    });

    const { text } = await generateText({
      model: openrouter.chat("openai/gpt-oss-20b"),
      system: `
    You are an expert n8n workflow creator, specializing in generating precise, production-ready workflows that strictly follow n8n's official specifications.

    Your ONLY purpose is to transform natural language instructions into valid n8n workflows, following these CRITICAL specifications:

    1. WORKFLOW STRUCTURE REQUIREMENTS:
       The generated JSON MUST follow this EXACT structure and types:
       {
         "name": "string (descriptive workflow name)",
         "nodes": [{
           "id": "uuid-v4-string",
           "name": "string (node instance name)",
           "type": "string (official n8n node type)",
           "typeVersion": number (latest stable version),
           "position": [x: number, y: number],
           "parameters": {
             // Node-specific configuration following n8n docs
             // All parameters must be correctly typed
             // No placeholder values allowed
           },
           "continueOnFail": boolean (optional),
           "credentials": {
             "credentialType": { "id": "string", "name": "string" }
           }
         }],
         "connections": {
           "Node-A": {
             "main": [[{ "node": "Node-B", "type": "main", "index": 0 }]]
           }
         },
         "settings": {
           "saveExecutionProgress": boolean,
           "saveManualExecutions": boolean,
           "errorWorkflow": "string (optional)",
           "timezone": "string (UTC)",
           "saveDataErrorExecution": "string (all)"
         },
       }

    2. NODES MUST:
       - Use official n8n node types (no custom nodes)
       - Have unique UUIDs for ids
       - Include all required parameters per node type
       - Use correct parameter types as per n8n docs
       - Have logical x,y positions (start: [100,300], increment +200 x)

    3. CONNECTIONS MUST:
       - Create valid node chains
       - Use correct input/output indices
       - Handle all node outputs

    4. SECURITY REQUIREMENTS:
       - Use ONLY n8n's credential system
       - NEVER include actual API keys/secrets
       - Validate all inputs

    5. VALIDATION:
       - All JSON must be strictly typed
       - No placeholder/example values
       - All required fields must be present
       - All values must match n8n's types
       - Workflow must be logically complete

    If the request is not for workflow creation, respond:
    {"error": "I can only help with creating n8n workflows. Please provide automation instructions."}

    For unsafe/invalid requests, respond:
    {"error": "Request cannot be processed securely."}

    ---
    <user_request>
    ${latestUserInput}
    </user_request>
    ---

    After generating the workflow JSON, include a note about any required credentials or configuration steps.
    `,
      messages: convertToModelMessages(messages),
      maxRetries: 0,
      temperature: 0,
    });

    // Extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Model did not return a valid JSON object." },
        { status: 500 }
      );
    }

    let workflowJson;
    try {
      // Check if JSON is valid
      workflowJson = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("JSON parsing failed:", error);
      return NextResponse.json(
        { error: "Generated content is not valid JSON." },
        { status: 500 }
      );
    }

    // Validate against n8n workflow schema
    const validationResult = n8nWorkflowSchema.safeParse(workflowJson);

    if (!validationResult.success) {
      if (workflowJson.error) {
        const assistantMessage = await appendMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: jsonMatch[0],
        });

        return NextResponse.json({
          content: jsonMatch[0],
          conversation,
          assistantMessage,
        });
      }

      console.error(
        "Schema validation failed:",
        validationResult.error.flatten()
      );

      return NextResponse.json(
        {
          error:
            "Generated workflow does not match the required n8n structure.",
        },
        { status: 500 }
      );
    }

    // Validate against security rules
    const validationSecurity = securityScan(validationResult.data);
    
    if (!validationSecurity.isSafe) {
      console.error("Security scan failed:", validationSecurity.reason);
      return NextResponse.json(
        { error: validationSecurity.reason },
        {
          status: 500,
        }
      );
    }

    const workflowRecord = await createWorkflow({
      conversationId: conversation.id,
      status: "completed",
      result: validationResult.data,
    });

    const assistantMessage = await appendMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: text,
      metadata: { workflowId: workflowRecord.id },
    });

    // After all validations, return full response
    return NextResponse.json({
      content: text,
      conversation,
      assistantMessage,
      workflow: workflowRecord,
    });
  } catch (error) {
    console.error("Error in POST /api/chat:", error);
    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
