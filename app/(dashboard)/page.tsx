"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { N8NConnectionDialog } from "@/app/components/chat/n8n-connection-dialog";
import Navbar from "@/app/components/layout/navbar";
import Aside from "@/app/components/layout/sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Suggestion, Suggestions } from "@/app/components/ui/suggestion";
import { Actions, Action } from "@/app/components/ui/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/app/components/ui/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/app/components/ui/message";
import { useUser } from "@clerk/nextjs";
import { Loader } from "@/app/components/ui/loader";

// Message structure
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
}

const exampleAutomations = [
  {
    title: "Guardar archivos adjuntos de Gmail en Google Drive",
  },
  {
    title: "Copiar archivos subidos a Dropbox a una carpeta de Google Drive",
  },
  {
    title:
      "Enviar mensaje de Slack cuando se sube un nuevo archivo a Google Drive",
  },
  {
    title: "Analizar URLs adjuntas de Gmail para detectar enlaces maliciosos",
  },
];

function PageContent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExamples] = useState(true);
  const [showN8NDialog, setShowN8NDialog] = useState(false);
  const [workflowToRun, setWorkflowToRun] = useState<object | null>(null);
  const { user } = useUser();
  const { isOpen } = useSidebar();

  // Handle N8N connection
  const handleN8NConnection = async (instanceUrl: string, apiKey: string) => {
    if (!workflowToRun) {
      toast.error("Ningún workflow seleccionado para ejecutar.");
      return;
    }

    try {
      const response = await fetch("/api/n8n/run-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceUrl,
          apiKey,
          workflowJson: workflowToRun,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Fallo al conectarse a n8n.");
        return;
      }

      toast.success(result.message || "Workflow creado exitosamente!");
      setShowN8NDialog(false);
      setWorkflowToRun(null);
    } catch (error) {
      console.error("Failed to run workflow:", error);
      toast.error("Un error inesperado ha ocurrido al conectarse a n8n.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: input }],
    };

    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Ha ocurrido un error desconocido.");
        setMessages(messages);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        parts: [{ type: "text", text: data.content }],
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Failed to fetch:", error);
      toast.error("Fallo al conectarse al servidor.");
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Aside />
      <main
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isOpen ? "lg:pl-72" : ""
        }`}
      >
        <Navbar />
        <N8NConnectionDialog
          isOpen={showN8NDialog}
          onClose={() => setShowN8NDialog(false)}
          onSubmit={handleN8NConnection}
        />
        <div className="flex overflow-y-auto flex-1">
          <Conversation>
            <ConversationContent>
              {showExamples && messages.length === 0 ? (
                // When no messages, show welcome and examples
                <ConversationEmptyState>
                  {/* Logo */}
                  <Image
                    src="/Logo.png"
                    alt="Aska Flow Logo"
                    width={80}
                    height={80}
                    className="mx-auto"
                  />

                  {/* Welcome Message */}
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold">Bienvenido!</h1>
                    <h2 className="text-3xl">
                      Soy Aska, tu asistente con{" "}
                      <span className="font-bold"> flow</span> 👋🏼
                    </h2>
                    <p className="text-2xl">
                      Solo tienes que describir la tarea que deseas automatizar
                      y <br />
                      yo te generaré un flujo de trabajo N8N listo para usar.
                    </p>
                  </div>

                  {/* Example Automations */}
                  <div className="max-w-3xl mx-auto mt-12 text-center space-y-8">
                    <div className="space-y-4">
                      <p className="text-lg italic">
                        Aquí tienes algunos ejemplos para empezar:
                      </p>
                      <div className="w-full max-w-4xl mx-auto">
                        <Suggestions className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                          {exampleAutomations.map((ex, index) => (
                            <Suggestion
                              key={index}
                              suggestion={ex.title}
                              onClick={() => {
                                setInput(ex.title);
                              }}
                              className="w-full"
                            />
                          ))}
                        </Suggestions>
                      </div>
                    </div>
                  </div>
                </ConversationEmptyState>
              ) : (
                // When chat starts, show chat messages
                <div className="max-w-3xl mx-auto space-y-4 text-foreground">
                  {messages.map((message) => (
                    <Message from={message.role} key={message.id}>
                      <MessageContent>
                        <div className="flex items-start gap-4">
                          {message.role === "assistant" && (
                            <MessageAvatar
                              src="/Logo.png"
                              name="Aska Flow Logo"
                            />
                          )}
                          <div
                            className={`p-4 rounded-lg max-w-[90%] border border-main ${
                              message.role === "user"
                                ? "bg-main/10"
                                : "bg-white"
                            }`}
                          >
                            {message.parts.map((part, i) => (
                              <div
                                key={`${message.id}-${i}`}
                                className="space-y-4"
                              >
                                {part.type === "text" && (
                                  <>
                                    {message.role === "assistant" &&
                                    part.text.match(/\{[\s\S]*\}/) ? (
                                      <pre className="overflow-auto p-4 rounded-lg bg-background border border-foreground/20">
                                        <code>
                                          {(() => {
                                            try {
                                              const jsonMatch =
                                                part.text.match(/\{[\s\S]*\}/);
                                              if (!jsonMatch) return part.text;
                                              const parsed = JSON.parse(
                                                jsonMatch[0]
                                              );
                                              return JSON.stringify(
                                                parsed,
                                                null,
                                                2
                                              );
                                            } catch {
                                              return part.text;
                                            }
                                          })()}
                                        </code>
                                      </pre>
                                    ) : (
                                      <div className="whitespace-pre-wrap">
                                        {part.text}
                                      </div>
                                    )}
                                    {message.role === "assistant" &&
                                      part.text.match(/\{[\s\S]*\}/) &&
                                      !/\.\.\.\s*$/.test(part.text) && (
                                        <Actions className="flex gap-2 pt-2 border-t border-foreground/30">
                                          <Action
                                            label="Copiar Workflow"
                                            onClick={() => {
                                              // Find JSON in the message
                                              const jsonMatch =
                                                part.text.match(/\{[\s\S]*\}/);
                                              if (jsonMatch) {
                                                // Copy JSON to clipboard
                                                navigator.clipboard
                                                  .writeText(jsonMatch[0])
                                                  .then(() => {
                                                    toast.success(
                                                      "Workflow copiado!"
                                                    );
                                                  })
                                                  .catch(() => {
                                                    toast.error(
                                                      "Fallo al copiar workflow"
                                                    );
                                                  });
                                              }
                                            }}
                                          >
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Copy className="size-4" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Copiar Workflow</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </Action>
                                          <Action
                                            label="Ejecutar Workflow en N8N"
                                            onClick={() => {
                                              const jsonMatch =
                                                part.text.match(/\{[\s\S]*\}/);
                                              if (jsonMatch) {
                                                try {
                                                  const workflowJson =
                                                    JSON.parse(jsonMatch[0]);
                                                  setWorkflowToRun(
                                                    workflowJson
                                                  );
                                                  setShowN8NDialog(true);
                                                } catch (error) {
                                                  toast.error(
                                                    "Fallo al obtener el JSON del workflow."
                                                  );
                                                  console.error(
                                                    "JSON parsing error:",
                                                    error
                                                  );
                                                }
                                              } else {
                                                toast.error(
                                                  "No se ha encontrado un JSON válido en el mensaje."
                                                );
                                              }
                                            }}
                                          >
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <ExternalLink className="size-4" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Ejecutar Workflow en N8N</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </Action>
                                        </Actions>
                                      )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                          {message.role === "user" && (
                            <div className="flex-shrink-0">
                              <MessageAvatar
                                src={user?.imageUrl || ""}
                                name={user?.fullName || "User"}
                              />
                            </div>
                          )}
                        </div>
                      </MessageContent>
                    </Message>
                  ))}

                  {/* When user is waiting for the LLM's answer... */}
                  {isLoading && (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 text-foreground">
                        <Loader />
                        <span className="italic">
                          Generando su workflow, por favor espere...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Chat Input */}
        <div className="shrink-0 p-6 bg-background">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex gap-4 items-center"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Describe la automatización que quieres conseguir..."
              className="min-h-[50px] max-h-[150px] resize-none"
            />
            <Button
              variant="special"
              size="icon"
              type="submit"
              disabled={!input.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <SidebarProvider>
      <PageContent />
    </SidebarProvider>
  );
}
