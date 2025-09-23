"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import Image from "next/image";
import { Send, Copy, ExternalLink } from "lucide-react";
import Navbar from "@/app/components/layout/navbar";
import Aside from "@/app/components/layout/sidebar";
import { SidebarProvider } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
  const { messages, sendMessage } = useChat();
  const [showExamples, setShowExamples] = useState(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
    setShowExamples(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Aside />
        <main className="flex flex-col flex-1 transition-all duration-300">
          <Navbar/>
          <div className="flex overflow-y-auto flex-1">
            <Conversation >
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
                                  setShowExamples(false);
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
                              className={`p-4 rounded-lg max-w-max border border-main ${
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
                                      <div className="whitespace-pre-wrap">
                                        {part.text}
                                      </div>
                                      {message.role === "assistant" &&
                                        part.text.includes("workflow") && (
                                          <Actions className="flex gap-2 pt-2 border-t border-foreground/30">
                                            <Action
                                              label="Copy Workflow"
                                              onClick={() => {}}
                                            >
                                              <Tooltip>
                                                <TooltipTrigger>
                                                  <Copy className="size-4" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Copy Workflow</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </Action>
                                            <Action
                                              label="Run Workflow in N8N"
                                              onClick={() => {}}
                                            >
                                              <Tooltip>
                                                <TooltipTrigger>
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
                              // TODO: Change the icon based on user's account icon
                              <div className="flex-shrink-0">
                                <MessageAvatar src="" name="User" />
                              </div>
                            )}
                          </div>
                        </MessageContent>
                      </Message>
                    ))}
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
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Describe the automation you want to achieve..."
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
