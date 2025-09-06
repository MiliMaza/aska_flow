"use client";

import { Plus, BookOpenText, MessageCircle } from "lucide-react";
import { useAside } from "./aside-context";

const workflowExamples = [
  {
    title: "Save Gmail attachments",
    description: "Save Gmail attachments to Google Drive",
  },
  {
    title: "Sync Airtable records",
    description: "Sync Airtable records with Google Sheets",
  },
  {
    title: "Send Slack notifications",
    description: "Send Slack notifications for new Trello cards",
  },
  {
    title: "Analyze Gmail URLs",
    description: "Analyze Gmail URLs to detect malicious links",
  },
];

export default function Aside() {
  const { isOpen } = useAside();

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed lg:fixed flex flex-col w-72 bg-secondary text-background p-6 h-screen transition-transform duration-300 ease-in-out z-50`}
    >
      {/* TODO: Add a collapisble aside */}
      {/* "Chat History + icon to collapse/open it" */}
      <div className="flex items-center justify-center mt-1 mb-8">
        <h2 className="text-xl font-semibold">Chat History</h2>
      </div>

      {/* New Workflow */}
      {/* TODO: Open new chat interface */}
      <button className="flex items-center justify-center gap-2 w-full p-3 mb-6 bg-main rounded-lg hover:bg-accent transition-colors">
        <Plus className="w-5 h-5" />
        New Workflow
      </button>

      {/* Past Conversations */}
      {/* TODO: Implement Chat History */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium px-2">CHATS</h3>
        <div className="space-y-4">
          {workflowExamples.map((workflow, index) => (
            <button
              key={index}
              className="flex items-center justify-center gap-2 w-full p-3 text-foreground rounded-lg bg-background hover:bg-accent hover:text-background transition-colors group"
            >
              <MessageCircle className="" />
              <h4 className="font-medium">{workflow.title}</h4>
            </button>
          ))}
        </div>
      </div>

      {/* N8N Docs */}
      <div className="flex-grow" />
      <button
        className="flex items-center justify-center gap-2 w-full p-2 mb-6 bg-main rounded-lg hover:bg-accent transition-colors"
        onClick={() => window.open("https://docs.n8n.io/", "_blank")}
      >
        <BookOpenText className="w-5 h-5" />
        Check N8N Docs
      </button>
    </aside>
  );
}
