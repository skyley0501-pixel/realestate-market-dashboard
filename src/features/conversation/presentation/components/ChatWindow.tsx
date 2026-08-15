"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatSuggestionChips } from "./ChatSuggestionChips";

interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SseEvent {
  event: string;
  data: string;
}

// SSEレスポンス（"event: xxx\ndata: yyy\n\n"の連続）をバッファから完成したイベント単位に切り出す。
// 未完成の末尾（次のchunkと繋がる部分）はrestとして呼び出し側がバッファに残す。
function parseSseBuffer(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice("event: ".length);
      if (line.startsWith("data: ")) data = line.slice("data: ".length);
    }
    events.push({ event, data });
  }

  return { events, rest };
}

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setErrorMessage(null);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message: text }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantId: string | null = null;
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const { events, rest } = parseSseBuffer(buffer);
        buffer = rest;

        for (const { event, data } of events) {
          if (event === "session") {
            sessionIdRef.current = (JSON.parse(data) as { sessionId: string }).sessionId;
          } else if (event === "token") {
            assistantContent += (JSON.parse(data) as { token: string }).token;
            if (!assistantId) {
              assistantId = crypto.randomUUID();
              const newMessage: ChatMessageView = { id: assistantId, role: "assistant", content: assistantContent };
              setMessages((prev) => [...prev, newMessage]);
            } else {
              const currentId = assistantId;
              setMessages((prev) =>
                prev.map((m) => (m.id === currentId ? { ...m, content: assistantContent } : m)),
              );
            }
          } else if (event === "error") {
            throw new Error((JSON.parse(data) as { message: string }).message);
          }
        }
      }
    } catch {
      setErrorMessage("チャットの送信に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[300px] flex-col gap-3 rounded-lg border p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
            <p className="text-sm text-muted-foreground">エリアの相場について質問してみましょう</p>
            <ChatSuggestionChips onSelect={(text) => void sendMessage(text)} />
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble key={message.id} role={message.role} content={message.content} />
          ))
        )}
        {isStreaming && messages.at(-1)?.role !== "assistant" && (
          <p className="text-xs text-muted-foreground">回答を生成中…</p>
        )}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例: 渋谷区の相場を教えて"
          aria-label="チャット入力"
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          送信
        </Button>
      </form>
    </div>
  );
}
