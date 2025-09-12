"use client";

import { Plus, BookOpenText, MessageCircle } from "lucide-react";
import { useSidebar } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";

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

export default function Sidebar() {
  const { isOpen } = useSidebar();

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
      <Button variant="default" size="lg" className="mb-6">
        <Plus className="w-5 h-5" />
        New Workflow
      </Button>

      {/* Past Conversations */}
      {/* TODO: Implement Chat History */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium px-2">CHATS</h3>
        <div className="space-y-4">
          {workflowExamples.map((workflow, index) => (
            <Button
              variant="secondary"
              size="md"
              key={index}
              className="w-full group"
            >
              <MessageCircle className="" />
              <h4 className="font-medium">{workflow.title}</h4>
            </Button>
          ))}
        </div>
      </div>

      {/* N8N Docs */}
      <div className="flex-grow" />
      <Button
        variant="default"
        size="md"
        onClick={() => window.open("https://docs.n8n.io/", "_blank")}
      >
        <BookOpenText className="w-5 h-5" />
        Check N8N Docs
      </Button>
    </aside>
  );
}
