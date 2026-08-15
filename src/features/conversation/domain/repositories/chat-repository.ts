import type { ChatMessage } from "../entities/chat-message";
import type { ChatSession } from "../entities/chat-session";

// Infrastructure層（PrismaChatRepository、Day41で実装）が実装するPort
export interface ChatRepository {
  createSession(session: ChatSession): Promise<void>;
  findSessionById(id: string): Promise<ChatSession | null>;
  addMessage(message: ChatMessage): Promise<void>;
  // セッション内のメッセージを作成日時の昇順（会話順）で返す
  findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
}
