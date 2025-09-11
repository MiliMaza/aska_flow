"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import Image from "next/image";
import { Send, Copy, ExternalLink } from "lucide-react";
import Navbar from "../components/layout/navbar";
import Aside from "../components/layout/sidebar";
import { SidebarProvider } from "@/app/components/layout/side-context";

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
        <main className="flex-1 flex flex-col transition-all duration-300">
          <Navbar />
          <div className="flex-1 overflow-y-auto p-4">
            {showExamples && messages.length === 0 ? (
              // When no messages, show welcome and examples
              <div className="max-w-3xl mx-auto mt-12 text-center space-y-8">
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
                    I&apos;m Aska, your <span className="font-bold">flow</span>{" "}
                    assistant 👋🏼
                  </h2>
                  <p className="text-2xl">
                    Just describe the task you want to automate <br />
                    and I&apos;ll generate a ready-to-use N8N workflow for you.
                  </p>
                </div>

                {/* Example Automations */}
                <div className="space-y-4">
                  <p className="text-lg italic">
                    Here are some examples of what you can ask:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {exampleAutomations.map((example, index) => (
                      <button
                        key={index}
                        className="p-4 text-center border border-main rounded-lg hover:bg-main/10 focus:outline-none focus:ring-1 focus:ring-main transition-colors"
                        onClick={() => {
                          setInput(example.workflow);
                          setShowExamples(false);
                        }}
                      >
                        {example.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // When chat starts, show chat messages
              // TODO: Use shadcn/ui + AI SDK elements for better styling
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src="/Logo.png"
                          alt="Aska"
                          width={32}
                          height={32}
                        />
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-lg max-w-[85%] border border-main text-foreground ${
                        message.role === "user" ? "bg-main/10" : "bg-white"
                      }`}
                    >
                      {message.parts.map((part, i) => (
                        <div key={`${message.id}-${i}`} className="space-y-4">
                          {part.type === "text" && (
                            <>
                              <div className="whitespace-pre-wrap">
                                {part.text}
                              </div>
                              {message.role === "assistant" &&
                                part.text.includes("workflow") && (
                                  <div className="flex gap-2 pt-4 border-t border-foreground/30">
                                    <button
                                      onClick={() => {
                                        /* TODO: Handle copy workflow */
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-sm bg-main text-white rounded hover:bg-accent transition-colors"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Copy Workflow
                                    </button>
                                    <button
                                      onClick={() => {
                                        /* TODO: Handle run in N8N */
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 text-sm bg-main text-white rounded hover:bg-accent transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Run Workflow in N8N
                                    </button>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        {/* TODO: Change the icon based on user's account icon */}
                        <span className="text-background">U</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-6 bg-background">
            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto flex gap-4 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Describe the automation you want to achieve..."
                className="flex-1 p-4 rounded-lg border border-foreground bg-background hover:border-main focus:outline-none focus:ring-1 focus:ring-main transition"
              />
              <button
                type="submit"
                className="p-4 bg-main text-background rounded-lg hover:bg-secondary transition-colors"
                disabled={!input.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
