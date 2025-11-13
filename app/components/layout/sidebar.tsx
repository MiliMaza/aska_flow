"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  BookOpenText,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSidebar } from "@/app/components/layout/side-context";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

type SidebarProps = {
  conversations: Array<{
    id: string;
    title: string | null;
    createdAt: string;
  }>;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  isLoadingConversations?: boolean;
};

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isLoadingConversations,
}: SidebarProps) {
  const { isOpen, toggle } = useSidebar();
  const isMobile = useIsMobile();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:fixed flex flex-col w-72 bg-secondary text-background p-6 h-screen transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex items-center justify-center mt-1 mb-8">
          <h2 className="text-xl font-semibold">Historial de Chats</h2>
        </div>

        <Separator className="mb-6" />

        <Button variant="default" size="lg" onClick={onNewConversation}>
          <Plus className="w-5 h-5" />
          Nuevo Chat
        </Button>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="text-sm font-medium px-2">CHATS</h3>
          {isLoadingConversations && conversations.length === 0 ? (
            <p className="text-sm text-background/70 px-2">Cargando...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-background/70 px-2">
              Aún no tienes conversaciones guardadas.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                const isMenuOpen = openMenuId === conversation.id;
                return (
                  <div key={conversation.id} className="relative">
                    <Button
                      variant={isActive ? "default" : "secondary"}
                      size="md"
                      className="w-full group justify-start gap-2 pr-10 pl-3 py-6"
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <div className="flex flex-col items-start overflow-hidden">
                        <h4 className="font-medium text-sm truncate w-full">
                          {conversation.title || "Conversación sin título"}
                        </h4>
                        <span className="text-xs opacity-70">
                          {new Date(conversation.createdAt).toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </Button>
                    {/* TODO: Replace these buttons for a predefine component */}
                    <button
                      type="button"
                      className="absolute group right-2 top-1/2 -translate-y-1/2 p-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.nativeEvent.stopImmediatePropagation();
                        setOpenMenuId(isMenuOpen ? null : conversation.id);
                      }}
                    >
                      {/* TODO: Change color when hover the conversation button */}
                      <MoreHorizontal className="w-5 h-5 text-foreground hover:scale-125" />
                    </button>
                    {isMenuOpen ? (
                      <div
                        className="absolute text-sm right-0 top-full z-20 mt-2 w-40 rounded-lg border border-background/30 bg-secondary/90 p-2 shadow-lg backdrop-blur"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.nativeEvent.stopImmediatePropagation();
                        }}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-background/10"
                          onClick={() => {
                            setOpenMenuId(null);
                            onRenameConversation(conversation.id);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                          Renombrar
                        </button>
                        <button
                          type="button"
                          className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-background/10"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
      {isMobile && isOpen ? (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggle}
        />
      ) : null}
    </>
  );
}
