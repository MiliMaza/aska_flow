import ChatPage from "@/app/chat/chat-page";

type ChatConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { conversationId } = await params;
  return <ChatPage initialConversationId={conversationId} />;
}
