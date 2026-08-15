import { ChatWindow } from "@/features/conversation/presentation/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">AIチャット相談</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        エリアの相場についてAIに質問できます。実際の統計データを踏まえて回答します。
      </p>
      <ChatWindow />
    </div>
  );
}
