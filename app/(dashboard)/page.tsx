"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import Image from "next/image";
import { Send, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { N8NConnectionDialog } from "@/app/components/chat/n8n-connection-dialog";
import Navbar from "@/app/components/layout/navbar";
import Aside from "@/app/components/layout/sidebar";
import { SidebarProvider } from "@/app/components/layout/side-context";
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

const exampleAutomations = [
  {
    title: "Save Gmail attachments to Google Drive",
    workflow: "Save Gmail attachments...",
  },
  {
    title: "Sync Airtable records with Google Sheets",
    workflow: "Sync Airtable records...",
  },
  {
    title: "Send Slack notifications for new Trello cards",
    workflow: "Send Slack notifications...",
  },
  {
    title: "Analyze Gmail URLs to detect malicious links",
    workflow: "Analyze Gmail URLs...",
  },
];

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const [showExamples] = useState(true);
  const [showN8NDialog, setShowN8NDialog] = useState(false);
  const { user } = useUser();

  const handleN8NConnection = (instanceUrl: string, apiKey: string) => {
    // TODO: Implement the connection to N8N
    console.log("Connecting to N8N:", { instanceUrl, apiKey });
    toast.success("Successfully connected to N8N!");
    setShowN8NDialog(false);
  };

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Aside />
        <main className="flex flex-col flex-1 transition-all duration-300">
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
                      <h1 className="text-4xl font-bold">Welcome!</h1>
                      <h2 className="text-3xl">
                        I&apos;m Aska, your{" "}
                        <span className="font-bold">flow</span> assistant 👋🏼
                      </h2>
                      <p className="text-2xl">
                        Just describe the task you want to automate <br />
                        and I&apos;ll generate a ready-to-use N8N workflow for
                        you.
                      </p>
                    </div>

                    {/* Example Automations */}
                    <div className="max-w-3xl mx-auto mt-12 text-center space-y-8">
                      <div className="space-y-4">
                        <p className="text-lg italic">
                          Here are some examples of what you can ask:
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
                                                  part.text.match(
                                                    /\{[\s\S]*\}/
                                                  );
                                                if (!jsonMatch)
                                                  return part.text;
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
                                              label="Copy Workflow"
                                              onClick={() => {
                                                // Find JSON in the message text
                                                const jsonMatch =
                                                  part.text.match(
                                                    /\{[\s\S]*\}/
                                                  );
                                                if (jsonMatch) {
                                                  // Copy JSON to clipboard
                                                  navigator.clipboard
                                                    .writeText(jsonMatch[0])
                                                    .then(() => {
                                                      toast.success(
                                                        "Workflow copied to clipboard!"
                                                      );
                                                    })
                                                    .catch(() => {
                                                      toast.error(
                                                        "Failed to copy workflow"
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
                                                  <p>Copy Workflow</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </Action>
                                            <Action
                                              label="Run Workflow in N8N"
                                              onClick={() =>
                                                setShowN8NDialog(true)
                                              }
                                            >
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <ExternalLink className="size-4" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Run Workflow in N8N</p>
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

                    {isLoading && (
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-foreground">
                          <Loader />
                          <span className="italic">
                            Generating your workflow, please wait...
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
                placeholder="Describe the automation you want to achieve..."
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
    </SidebarProvider>
  );
}
