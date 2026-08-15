import { prisma } from "@/shared/infrastructure/prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { ChatMessage } from "../domain/entities/chat-message";
import { ChatSession } from "../domain/entities/chat-session";
import { PrismaChatRepository } from "./prisma-chat-repository";

// 実際のSupabase(PostgreSQL)に対する結合テスト。DATABASE_URL/DIRECT_URLが.envに必要。
describe("PrismaChatRepository (integration)", () => {
  const repository = new PrismaChatRepository(prisma);
  const createdSessionIds: string[] = [];

  afterAll(async () => {
    await prisma.chatMessage.deleteMany({ where: { sessionId: { in: createdSessionIds } } });
    await prisma.chatSession.deleteMany({ where: { id: { in: createdSessionIds } } });
  });

  it("createSessionで作成したセッションをfindSessionByIdで取得できる", async () => {
    const session = ChatSession.create({
      id: `test-session-${Date.now()}-1`,
      userId: null,
      title: null,
      createdAt: new Date(),
    });
    createdSessionIds.push(session.id);

    await repository.createSession(session);
    const found = await repository.findSessionById(session.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(session.id);
    expect(found?.userId).toBeNull();
  });

  it("addMessageで保存したメッセージをfindMessagesBySessionIdで作成順に取得できる", async () => {
    const session = ChatSession.create({
      id: `test-session-${Date.now()}-2`,
      userId: null,
      title: null,
      createdAt: new Date(),
    });
    createdSessionIds.push(session.id);
    await repository.createSession(session);

    const userMessage = ChatMessage.create({
      id: `test-message-${Date.now()}-1`,
      sessionId: session.id,
      role: "user",
      content: "渋谷区の相場を教えて",
      createdAt: new Date("2026-08-15T00:00:00.000Z"),
    });
    const assistantMessage = ChatMessage.create({
      id: `test-message-${Date.now()}-2`,
      sessionId: session.id,
      role: "assistant",
      content: "渋谷区の中央値は約8,350万円です。",
      createdAt: new Date("2026-08-15T00:00:01.000Z"),
    });

    await repository.addMessage(userMessage);
    await repository.addMessage(assistantMessage);

    const messages = await repository.findMessagesBySessionId(session.id);

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("渋谷区の相場を教えて");
    expect(messages[1].role).toBe("assistant");
  });

  it("存在しないセッションIDにはnullを返す", async () => {
    const found = await repository.findSessionById("not-exist-session-id");
    expect(found).toBeNull();
  });
});
