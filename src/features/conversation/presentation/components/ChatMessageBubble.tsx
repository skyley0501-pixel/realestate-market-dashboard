interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessageBubble({ role, content }: ChatMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
