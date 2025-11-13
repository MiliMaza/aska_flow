"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Send, Copy, ExternalLink, Workflow } from "lucide-react";
import { toast } from "sonner";
import { N8NConnectionDialog } from "@/app/components/chat/n8n-connection-dialog";
import Navbar from "@/app/components/layout/navbar";
import Aside from "@/app/components/layout/sidebar";
import { useSidebar } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/app/components/ui/message";
import { useUser } from "@clerk/nextjs";
import { Loader } from "@/app/components/ui/loader";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
  workflowId?: string | null;
}

interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
}

interface PersistedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    workflowId?: string | null;
  } | null;
}

type WorkflowStatus = "pending" | "running" | "failed" | "completed";

interface WorkflowSummary {
  id: string;
  status: WorkflowStatus;
  result: unknown | null;
  error: string | null;
  createdAt: string;
}

const generateMessageId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseWorkflowResult = (result: WorkflowSummary["result"]) => {
  if (!result) return null;
  if (typeof result === "object") return result as Record<string, unknown>;
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
};

const stringifyWorkflowResult = (result: WorkflowSummary["result"]) => {
  if (!result) return null;
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return null;
  }
};

const formatWorkflowDate = (value: string) =>
  new Date(value).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

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

const LONG_RESPONSE_DELAY_MS = 8000;

let conversationsCache: ConversationSummary[] | null = null;

type FetchConversationsOptions = {
  showLoading?: boolean;
};

type PageContentProps = {
  initialConversationId: string | null;
};

function PageContent({ initialConversationId }: PageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    () => conversationsCache ?? []
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(initialConversationId);
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);
  const [isHydratingConversation, setIsHydratingConversation] = useState(() =>
    Boolean(initialConversationId)
  );
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [showExamples] = useState(true);
  const [showN8NDialog, setShowN8NDialog] = useState(false);
  const [workflowToRun, setWorkflowToRun] = useState<object | null>(null);
  const [workflowToRunId, setWorkflowToRunId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [highlightedWorkflowId, setHighlightedWorkflowId] = useState<
    string | null
  >(null);
  const [conversationPendingRename, setConversationPendingRename] =
    useState<Pick<ConversationSummary, "id" | "title"> | null>(null);
  const [conversationPendingDelete, setConversationPendingDelete] =
    useState<Pick<ConversationSummary, "id" | "title"> | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [isRenamingConversation, setIsRenamingConversation] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const workflowRefs = useRef(new Map<string, HTMLDivElement>());
  const { user } = useUser();
  const { isOpen } = useSidebar();

  useEffect(() => {
    conversationsCache = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!isLoading) {
      setIsTakingLonger(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsTakingLonger(true);
    }, LONG_RESPONSE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const navigateToConversation = useCallback(
    (conversationId: string | null) => {
      const target = conversationId ? `/chat/${conversationId}` : "/";
      if (target === pathname) {
        return;
      }
      router.push(target);
    },
    [pathname, router]
  );

  const fetchConversations = useCallback(
    async (options?: FetchConversationsOptions) => {
      const shouldShowLoading = options?.showLoading ?? false;
      if (shouldShowLoading) {
        setIsFetchingConversations(true);
      }
      try {
        const response = await fetch("/api/conversations", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("The conversations did not load.");
        }

        const data = await response.json();
        setConversations(data.conversations ?? []);
      } catch (error) {
        console.error("Failed to fetch conversations", error);
        toast.error("No se pudieron cargar tus conversaciones.");
      } finally {
        if (shouldShowLoading) {
          setIsFetchingConversations(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchConversations({ showLoading: conversationsCache === null });
  }, [fetchConversations]);

  const hydrateConversation = useCallback(async (conversationId: string) => {
    setIsHydratingConversation(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Conversation not found.");
      }

      const data = await response.json();
      const persistedMessages: PersistedMessage[] = data.messages ?? [];
      setMessages(
        persistedMessages.map((message) => ({
          id: message.id,
          role: message.role === "user" ? "user" : "assistant",
          parts: [{ type: "text", text: message.content }],
          workflowId: message.metadata?.workflowId ?? null,
        }))
      );
      const orderedWorkflows = [...(data.workflows ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setWorkflows(orderedWorkflows);
      setActiveConversationId(conversationId);
    } catch (error) {
      console.error("Failed to hydrate conversation", error);
      toast.error("No se pudo cargar la conversación seleccionada.");
    } finally {
      setIsHydratingConversation(false);
    }
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
      hydrateConversation(initialConversationId);
    } else {
      setActiveConversationId(null);
      setMessages([]);
      setWorkflows([]);
    }
  }, [initialConversationId, hydrateConversation]);

  const closeRenameDialog = useCallback(() => {
    setConversationPendingRename(null);
    setRenameInputValue("");
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setConversationPendingDelete(null);
  }, []);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (!conversationId || conversationId === activeConversationId) {
        return;
      }
      navigateToConversation(conversationId);
    },
    [activeConversationId, navigateToConversation]
  );

  const upsertConversationInState = useCallback(
    (conversation: ConversationSummary) => {
      setConversations((prev) => {
        const index = prev.findIndex((item) => item.id === conversation.id);
        if (index === -1) {
          return [conversation, ...prev];
        }
        const updated = [...prev];
        updated.splice(index, 1);
        return [conversation, ...updated];
      });
    },
    []
  );

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setWorkflows([]);
    navigateToConversation(null);
  }, [navigateToConversation]);

  const handleRenameConversation = useCallback(
    (conversationId: string) => {
      const target = conversations.find((item) => item.id === conversationId);
      setConversationPendingRename({
        id: conversationId,
        title: target?.title ?? null,
      });
      setRenameInputValue(target?.title ?? "");
    },
    [conversations]
  );

  const handleConfirmRenameConversation = useCallback(async () => {
    if (!conversationPendingRename) return;
    setIsRenamingConversation(true);
    const trimmed = renameInputValue.trim();

    try {
      const response = await fetch(
        `/api/conversations/${conversationPendingRename.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: trimmed || null }),
        }
      );

      if (!response.ok) {
        throw new Error("The conversation could not be rename.");
      }

      const data = await response.json();
      upsertConversationInState(data.conversation);
      toast.success("Conversación renombrada.");
      closeRenameDialog();
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo renombrar la conversación."
      );
    } finally {
      setIsRenamingConversation(false);
    }
  }, [
    closeRenameDialog,
    conversationPendingRename,
    renameInputValue,
    upsertConversationInState,
  ]);

  const handleDeleteConversation = useCallback(
    (conversationId: string) => {
      const target = conversations.find((item) => item.id === conversationId);
      setConversationPendingDelete({
        id: conversationId,
        title: target?.title ?? null,
      });
    },
    [conversations]
  );

  const handleConfirmDeleteConversation = useCallback(async () => {
    if (!conversationPendingDelete) return;
    setIsDeletingConversation(true);
    const conversationId = conversationPendingDelete.id;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("The conversation could not be delete.");
      }

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversationId)
      );

      if (activeConversationId === conversationId) {
        handleNewConversation();
      }

      toast.success("Conversación eliminada.");
      closeDeleteDialog();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la conversación."
      );
    } finally {
      setIsDeletingConversation(false);
    }
  }, [
    activeConversationId,
    closeDeleteDialog,
    conversationPendingDelete,
    handleNewConversation,
  ]);

  const upsertWorkflow = useCallback((workflow: WorkflowSummary) => {
    setWorkflows((prev) => {
      const filtered = prev.filter((item) => item.id !== workflow.id);
      return [workflow, ...filtered];
    });
  }, []);

  const ensureConversationForWorkflow = useCallback(async () => {
    if (activeConversationId) {
      return activeConversationId;
    }

    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Workflow manual" }),
    });

    if (!response.ok) {
      throw new Error(
        "It was not possible to create a conversation to save the workflow."
      );
    }

    const data = await response.json();
    const conversation = data.conversation as ConversationSummary;
    upsertConversationInState(conversation);
    setActiveConversationId(conversation.id);
    setMessages([]);
    setWorkflows([]);
    navigateToConversation(conversation.id);
    return conversation.id;
  }, [
    activeConversationId,
    navigateToConversation,
    upsertConversationInState,
    setMessages,
    setWorkflows,
  ]);

  const prepareWorkflowRun = useCallback(
    (payload: object, options?: { workflowId?: string | null }) => {
      setWorkflowToRun(payload);
      setWorkflowToRunId(options?.workflowId ?? null);
      setShowN8NDialog(true);
    },
    [setWorkflowToRun, setWorkflowToRunId, setShowN8NDialog]
  );

  const workflowMessageMap = useMemo(() => {
    const map = new Map<string, string>();
    messages.forEach((message) => {
      if (message.workflowId) {
        map.set(message.workflowId, message.id);
      }
    });
    return map;
  }, [messages]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const node = messageRefs.current.get(messageId);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMessageId(messageId);
        setTimeout(() => {
          setHighlightedMessageId((current) =>
            current === messageId ? null : current
          );
        }, 2000);
      }
    },
    [messageRefs]
  );

  const scrollToWorkflow = useCallback(
    (workflowId: string) => {
      const node = workflowRefs.current.get(workflowId);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightedWorkflowId(workflowId);
        setTimeout(() => {
          setHighlightedWorkflowId((current) =>
            current === workflowId ? null : current
          );
        }, 2000);
      }
    },
    [workflowRefs]
  );

  const handleCopyWorkflow = useCallback((workflow: WorkflowSummary) => {
    const serialized = stringifyWorkflowResult(workflow.result);
    if (!serialized) {
      toast.error("No se pudo copiar el workflow.");
      return;
    }

    navigator.clipboard
      .writeText(serialized)
      .then(() => toast.success("Workflow copiado!"))
      .catch(() => toast.error("Fallo al copiar workflow."));
  }, []);

  const handleExecuteWorkflow = useCallback(
    (workflow: WorkflowSummary) => {
      const payload = parseWorkflowResult(workflow.result);
      if (!payload) {
        toast.error("No se pudo preparar el workflow.");
        return;
      }
      prepareWorkflowRun(payload, { workflowId: workflow.id });
    },
    [prepareWorkflowRun]
  );

  const getWorkflowTitle = useCallback((workflow: WorkflowSummary) => {
    const payload = parseWorkflowResult(workflow.result);
    if (payload && typeof payload.name === "string") {
      return payload.name as string;
    }
    return "Workflow generado";
  }, []);

  // Handle N8N connection
  const handleN8NConnection = async (instanceUrl: string, apiKey: string) => {
    if (!workflowToRun) {
      toast.error("Ningún workflow seleccionado para ejecutar.");
      return;
    }

    let workflowRecord: WorkflowSummary | null = null;

    const finalizeWorkflow = async (
      status: WorkflowStatus,
      errorMessage?: string | null
    ) => {
      if (!workflowRecord) return;
      try {
        const response = await fetch(`/api/workflows/${workflowRecord.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            result: workflowToRun,
            error: errorMessage ?? null,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          workflowRecord = data.workflow;
          upsertWorkflow(data.workflow);
        }
      } catch (error) {
        console.error("Failed to update workflow status", error);
      }
    };

    const ensureWorkflowRecord = async () => {
      if (workflowToRunId) {
        const response = await fetch(`/api/workflows/${workflowToRunId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "running",
            result: workflowToRun,
            error: null,
          }),
        });

        if (!response.ok) {
          throw new Error("The workflow could not be update.");
        }

        const data = await response.json();
        upsertWorkflow(data.workflow);
        return data.workflow as WorkflowSummary;
      }

      const conversationId = await ensureConversationForWorkflow();

      const response = await fetch(
        `/api/conversations/${conversationId}/workflows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "running",
            result: workflowToRun,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("The workflow could not be save before the execution.");
      }

      const data = await response.json();
      upsertWorkflow(data.workflow);
      setWorkflowToRunId(data.workflow.id);
      return data.workflow as WorkflowSummary;
    };

    try {
      workflowRecord = await ensureWorkflowRecord();
    } catch (error) {
      console.error("Workflow persistence failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el workflow antes de ejecutarlo."
      );
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
        await finalizeWorkflow(
          "failed",
          result.error || "Error in the n8n conection."
        );
        toast.error(result.error || "Fallo al conectarse a n8n.");
        return;
      }

      await finalizeWorkflow("completed");

      toast.success(result.message || "Workflow ejecutado exitosamente!");
      setShowN8NDialog(false);
      setWorkflowToRun(null);
      setWorkflowToRunId(null);
    } catch (error) {
      console.error("Failed to run workflow:", error);
      await finalizeWorkflow(
        "failed",
        error instanceof Error
          ? error.message
          : "Unexpected error while executing the workflow."
      );
      toast.error("Un error inesperado ha ocurrido al conectarse a n8n.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const newUserMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      parts: [{ type: "text", text: trimmedInput }],
    };

    const optimisticMessages = [...messages, newUserMessage];
    setMessages(optimisticMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: optimisticMessages,
          conversationId: activeConversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occured.");
      }

      const data = await response.json();
      const serverConversation = data.conversation as
        | ConversationSummary
        | undefined;
      const assistantContent: string =
        data?.assistantMessage?.content ?? data?.content ?? "";

      if (serverConversation) {
        upsertConversationInState(serverConversation);
        setActiveConversationId(serverConversation.id);
        if (serverConversation.id !== activeConversationId) {
          navigateToConversation(serverConversation.id);
        }
      }

      const assistantMessage: ChatMessage = {
        id: data?.assistantMessage?.id ?? generateMessageId(),
        role: "assistant",
        parts: [{ type: "text", text: assistantContent }],
        workflowId:
          data?.workflow?.id ??
          data?.assistantMessage?.metadata?.workflowId ??
          null,
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      if (data.workflow) {
        upsertWorkflow(data.workflow);
      }
    } catch (error) {
      console.error("Failed to process chat message:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Fallo al conectarse al servidor."
      );
      fetchConversations();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Aside
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoadingConversations={isFetchingConversations}
      />
      <main
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isOpen ? "lg:pl-72" : ""
        }`}
      >
        <Navbar />
        <N8NConnectionDialog
          isOpen={showN8NDialog}
          onClose={() => {
            setShowN8NDialog(false);
            setWorkflowToRun(null);
            setWorkflowToRunId(null);
          }}
          onSubmit={handleN8NConnection}
        />
        <div className="flex overflow-y-auto flex-1">
          <Conversation>
            <ConversationContent>
              {isHydratingConversation ? (
                <div className="flex items-center justify-center py-12 text-foreground/80 gap-3">
                  <Loader />
                  <span>Cargando conversación...</span>
                </div>
              ) : showExamples && messages.length === 0 ? (
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
                  {messages.map((message) => {
                    const isHighlighted = highlightedMessageId === message.id;
                    return (
                      <div
                        key={message.id}
                        ref={(node) => {
                          if (node) {
                            messageRefs.current.set(message.id, node);
                          } else {
                            messageRefs.current.delete(message.id);
                          }
                        }}
                        className={
                          isHighlighted
                            ? "ring-2 ring-main rounded-xl p-1"
                            : "rounded-xl"
                        }
                      >
                        <Message from={message.role}>
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
                                                label="Copiar Workflow"
                                                onClick={() => {
                                                  // Find JSON in the message
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
                                                    part.text.match(
                                                      /\{[\s\S]*\}/
                                                    );
                                                  if (jsonMatch) {
                                                    try {
                                                      const workflowJson =
                                                        JSON.parse(
                                                          jsonMatch[0]
                                                        );
                                                      prepareWorkflowRun(
                                                        workflowJson,
                                                        {
                                                          workflowId:
                                                            message.workflowId,
                                                        }
                                                      );
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
                                                    <p>
                                                      Ejecutar Workflow en N8N
                                                    </p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </Action>
                                              {message.workflowId && (
                                                <Action
                                                  label="Ver Workflow guardado"
                                                  onClick={() =>
                                                    scrollToWorkflow(
                                                      message.workflowId!
                                                    )
                                                  }
                                                >
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Workflow className="size-4" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                      <p>
                                                        Ver Workflow guardado
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </Action>
                                              )}
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
                      </div>
                    );
                  })}

                  {/* When user is waiting for the LLM's answer */}
                  {isLoading && (
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2 text-foreground">
                        <Loader />
                        <span className="italic">
                          {isTakingLonger
                            ? "Esto puede tomar algunos segundos más..."
                            : "Generando su workflow, por favor espere..."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {workflows.length > 0 && (
                <div className="max-w-3xl mx-auto mt-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Workflows guardados
                    </h3>
                    <span className="text-sm text-foreground/70">
                      {workflows.length}{" "}
                      {workflows.length === 1 ? "workflow" : "workflows"}
                    </span>
                  </div>
                  {workflows.map((workflow) => {
                    const workflowName = getWorkflowTitle(workflow);
                    const messageId = workflowMessageMap.get(workflow.id);
                    const isHighlighted = highlightedWorkflowId === workflow.id;
                    return (
                      <div
                        key={workflow.id}
                        ref={(node) => {
                          if (node) {
                            workflowRefs.current.set(workflow.id, node);
                          } else {
                            workflowRefs.current.delete(workflow.id);
                          }
                        }}
                        className={`rounded-xl border border-foreground/10 bg-white/80 p-4 shadow-sm space-y-3 ${
                          isHighlighted ? "ring-2 ring-main" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-lg leading-tight">
                              {workflowName}
                            </p>
                            <p className="text-sm text-foreground/60">
                              Generado el{" "}
                              {formatWorkflowDate(workflow.createdAt)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-main">
                            {workflow.status}
                          </span>
                        </div>
                        {workflow.error ? (
                          <p className="text-sm text-main">
                            Error: {workflow.error}
                          </p>
                        ) : (
                          <p className="text-sm text-foreground/70">
                            Workflow listo para copiar o ejecutar en tu
                            instancia de n8n.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 pt-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyWorkflow(workflow)}
                            className="flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar JSON
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleExecuteWorkflow(workflow)}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ejecutar en n8n
                          </Button>
                          {messageId && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => scrollToMessage(messageId)}
                              className="flex items-center gap-2"
                            >
                              Ver mensaje
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
      <Dialog
        open={Boolean(conversationPendingRename)}
        onOpenChange={(open) => {
          if (!open) {
            closeRenameDialog();
          }
        }}
      >
        <DialogContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleConfirmRenameConversation();
            }}
          >
            <DialogHeader>
              <DialogTitle>Renombrar conversación</DialogTitle>
              <DialogDescription>
                Actualiza el nombre para identificar este chat
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={renameInputValue}
              placeholder="Conversación sin título"
              onChange={(event) => setRenameInputValue(event.target.value)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeRenameDialog}
                disabled={isRenamingConversation}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isRenamingConversation}>
                {isRenamingConversation ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(conversationPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todos los mensajes vinculados a este chat
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-foreground/90">
            ¿Desea eliminar &quot;
            {conversationPendingDelete?.title || "Conversación sin título"}
            &quot; y sus mensajes?
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeletingConversation}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleConfirmDeleteConversation}
              disabled={isDeletingConversation}
            >
              {isDeletingConversation ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ChatPageProps = {
  initialConversationId: string | null;
};

export default function ChatPage({ initialConversationId }: ChatPageProps) {
  return <PageContent initialConversationId={initialConversationId} />;
}
