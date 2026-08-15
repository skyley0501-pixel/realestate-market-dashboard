import type { PrismaClient } from "@/generated/prisma/client";
import { ChatMessage, type ChatMessageRole } from "../domain/entities/chat-message";
import { ChatSession } from "../domain/entities/chat-session";
import type { ChatRepository } from "../domain/repositories/chat-repository";

export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSession(session: ChatSession): Promise<void> {
    await this.prisma.chatSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        title: session.title,
        createdAt: session.createdAt,
      },
    });
  }

  async findSessionById(id: string): Promise<ChatSession | null> {
    const row = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!row) return null;

    return ChatSession.create({
      id: row.id,
      userId: row.userId,
      title: row.title,
      createdAt: row.createdAt,
    });
  }

  async addMessage(message: ChatMessage): Promise<void> {
    await this.prisma.chatMessage.create({
      data: {
        id: message.id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  }

  async findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) =>
      ChatMessage.create({
        id: row.id,
        sessionId: row.sessionId,
        role: row.role as ChatMessageRole,
        content: row.content,
        createdAt: row.createdAt,
      }),
    );
  }
}
