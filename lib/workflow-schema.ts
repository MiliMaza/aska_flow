import { z } from "zod";

// Schema for individual nodes
const nodeSchema = z.object({
  parameters: z.record(z.any()),
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number(),
  position: z.tuple([z.number(), z.number()]),
  credentials: z.record(z.any()).optional(),
});

// Schemas for connections between nodes
const connectionTargetSchema = z.object({
    node: z.string(),
    type: z.string(),
    index: z.number(),
});

const connectionsSchema = z.record( 
  z.record( 
    z.array(z.array(connectionTargetSchema))
  )
);

// Main workflow schema
export const n8nWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(nodeSchema),
  connections: connectionsSchema,
  active: z.boolean().optional().default(false),
  settings: z.record(z.any()).optional(),
  id: z.string().optional(),
  tags: z.array(z.record(z.any())).optional(),
});

// Type for the workflow
export type N8nWorkflow = z.infer<typeof n8nWorkflowSchema>;

// Function to validate a workflow
export const validateWorkflow = (workflow: unknown) => {
  return n8nWorkflowSchema.safeParse(workflow);
};