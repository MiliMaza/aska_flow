"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import Navbar from "../components/layout/navbar"; 


export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  return (
    <>
    <Navbar />
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((message) => (
        <div key={message.id} className="whitespace-pre-wrap">
          {/* Replace "User" with the username or just the user image */}
          {message.role === "user" ? "User: " : "Aska: "}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-foreground dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Describe the automation you want to get..."
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
    </>
  );
}
