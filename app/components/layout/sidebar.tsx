"use client";

import { Plus, BookOpenText, MessageCircle } from "lucide-react";
import { useSidebar } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";

const workflowExamples = [
  {
    title: "Guardar archivos adjuntos",
  },
  {
    title: "Copiar archivos subidos",
  },
  {
    title: "Enviar mensaje de Slack",
  },
  {
    title: "Analizar URLS de Gmail",
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
      <div className="flex items-center justify-center mt-1 mb-8">
        <h2 className="text-xl font-semibold">Historial de Chats</h2>
      </div>

      <Separator className="mb-6" />

      {/* New Workflow */}
      {/* TODO: Open new and empty chat interface */}
      <Button variant="default" size="lg">
        <Plus className="w-5 h-5" />
        Nuevo Chat
      </Button>

      <Separator className="my-6" />

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
        Leer Docs de N8N
      </Button>
    </aside>
  );
}
