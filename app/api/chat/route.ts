import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { n8nWorkflowSchema } from "@/lib/workflow-schema";
import { securityScan } from "@/lib/security-scanner";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Limit input length to prevent excessive usage
const MAX_INPUT_LENGTH = 2000;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const latestUserInput = messages[messages.length - 1]?.parts.find(
    (part) => part.type === "text"
  )?.text;

  if (
    typeof latestUserInput !== "string" ||
    latestUserInput.length > MAX_INPUT_LENGTH
  ) {
    return new Response("Invalid input", { status: 400 });
  }

  const result = streamText({
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
           "executionOrder": "string (v1)",
           "saveExecutionProgress": boolean,
           "saveManualExecutions": boolean,
           "callerPolicy": "string (workflowsFromSameOwner)",
           "errorWorkflow": "string (optional)",
           "timezone": "string (UTC)",
           "saveDataErrorExecution": "string (all)"
         },
         "pinData": {},
         "versionId": number,
         "active": boolean
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

  // To validate the output we need the full text
  const text = await result.text;

  // Extract JSON from the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return new Response(
      JSON.stringify({ error: "Model did not return a valid JSON object." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let workflowJson;
  try {
    // Check if JSON is valid
    workflowJson = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("JSON parsing failed:", error);
    return new Response(
      JSON.stringify({ error: "Generated content is not valid JSON." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate against n8n workflow schema
  const validationResult = n8nWorkflowSchema.safeParse(workflowJson);
  if (!validationResult.success) {
    // If the response is an error message (which means LLM detected non-workflow request)
    if (workflowJson.error) {
      // Stream the error message back to the user
      const responseStream = new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
      });
      const response = await result.toUIMessageStreamResponse();
      if (!response.body) {
        return new Response("No response body", { status: 500 });
      }
      return new Response(response.body.pipeThrough(responseStream), {
        headers: response.headers,
      });
    }

    // If it's a failed workflow generation, log the error
    console.error(
      "Schema validation failed:",
      validationResult.error.flatten()
    );
    return new Response(
      JSON.stringify({
        error: "Generated workflow does not match the required n8n structure.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } // Validate against security rules
  const validationSecurity = securityScan(validationResult.data);
  if (!validationSecurity.isSafe) {
    console.error("Security scan failed:", validationSecurity.reason);
    return new Response(JSON.stringify({ error: validationSecurity.reason }), {
      status: 500,
    });
  }

  // After all validations, stream the response back
  const responseStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });

  const response = await result.toUIMessageStreamResponse();
  if (!response.body) {
    return new Response("No response body", { status: 500 });
  }

  const finalStream = response.body.pipeThrough(responseStream);
  return new Response(finalStream, {
    headers: response.headers,
  });
}
