import { ChatView } from '@/components/chat-view';

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatView chatId={id} />;
}
