import { NextResponse } from "next/server";

// Structure of the request body
interface RunWorkflowRequestBody {
  instanceUrl: string;
  apiKey: string;
  workflowJson: object;
}

export async function POST(req: Request) {
  try {
    const { instanceUrl, apiKey, workflowJson }: RunWorkflowRequestBody =
      await req.json();

    // Validate the incoming data
    if (!instanceUrl || !apiKey || !workflowJson) {
      return NextResponse.json(
        {
          error:
            "Faltan parámetros requeridos: instanceUrl, apiKey, or workflowJson.",
        },
        { status: 400 }
      );
    }

    // Build the full API URL for creating a workflow
    // TODO: Implement the possibility to connect to n8n cloud instances
    const apiUrl = `${instanceUrl.replace(/\/$/, "")}/api/v1/workflows`;

    // Make the POST request to the user's n8n instance
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": apiKey,
      },
      body: JSON.stringify(workflowJson),
    });

    // Handle the response from the n8n API
    if (!response.ok) {
      const errorBody = await response.json();
      console.error("n8n API Error:", errorBody);
      return NextResponse.json(
        {
          error: `Fallo al crear el workflow en n8n. Estado: ${
            response.status
          }. Message: ${errorBody.message || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    // Return a success response
    return NextResponse.json({
      message: "Workflow creado exitosamente en n8n!",
      workflowId: responseData.id, // Send back the new workflow ID
    });
  } catch (error) {
    console.error("Error in /api/n8n/run-workflow:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
