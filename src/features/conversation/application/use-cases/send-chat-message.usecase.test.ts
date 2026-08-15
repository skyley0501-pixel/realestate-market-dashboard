import { AreaMarketSnapshot } from "@/features/market/domain/aggregates/area-market-snapshot";
import { Area } from "@/features/market/domain/entities/area";
import type { AreaRepository } from "@/features/market/domain/repositories/area-repository";
import { PriceStatistics } from "@/features/market/domain/value-objects/price-statistics";
import { TrendRate } from "@/features/market/domain/value-objects/trend-rate";
import type { MunicipalityRepository } from "@/features/transaction/domain/repositories/municipality-repository";
import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import { ChatMessage } from "../../domain/entities/chat-message";
import type { ChatRepository } from "../../domain/repositories/chat-repository";
import type { NaturalLanguageQueryParser, SearchCondition } from "../../domain/services/natural-language-query-parser";
import type { LlmChatMessage, LlmClient } from "../../infrastructure/llm-client";
import { SendChatMessageUseCase } from "./send-chat-message.usecase";

async function collect(stream: AsyncIterable<string>): Promise<string> {
  let result = "";
  for await (const chunk of stream) result += chunk;
  return result;
}

function buildMockChatRepository(overrides: Partial<ChatRepository> = {}): ChatRepository {
  return {
    createSession: vi.fn(),
    findSessionById: vi.fn(),
    addMessage: vi.fn(),
    findMessagesBySessionId: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function buildMockLlmClient(overrides: Partial<LlmClient> = {}): LlmClient {
  return {
    completeStructured: vi.fn(),
    streamChat: vi.fn(),
    ...overrides,
  };
}

function buildMockAreaRepository(overrides: Partial<AreaRepository> = {}): AreaRepository {
  return {
    findLatestSnapshots: vi.fn(),
    findLatestSnapshotByCode: vi.fn(),
    findSnapshotHistoryByCode: vi.fn(),
    findSnapshotHistoryByCodes: vi.fn(),
    findLatestSnapshotsByCodes: vi.fn(),
    ...overrides,
  };
}

function buildMockMunicipalityRepository(
  overrides: Partial<MunicipalityRepository> = {},
): MunicipalityRepository {
  return {
    findByPrefectureCode: vi.fn(),
    findByName: vi.fn(),
    ...overrides,
  };
}

function buildMockParser(overrides: Partial<NaturalLanguageQueryParser> = {}): NaturalLanguageQueryParser {
  return {
    parse: vi.fn().mockResolvedValue({
      municipalityName: null,
      propertyType: null,
      maxBuildingAgeYears: null,
      minPriceYen: null,
      maxPriceYen: null,
    } satisfies SearchCondition),
    ...overrides,
  };
}

async function* fakeStream(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) yield chunk;
}

function buildSnapshot(): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code: "13113", name: "渋谷区", prefectureCode: "13", prefectureName: "東京都" }),
    period: "2025Q4",
    statistics: PriceStatistics.reconstruct(
      Money.fromYen(83_500_000),
      Money.fromYen(85_000_000),
      Money.fromYen(70_000_000),
      Money.fromYen(95_000_000),
      100,
    ),
    trendRate: TrendRate.reconstruct(-7.2),
    avgUnitPriceYenPerSqm: 2_500_000,
    transactionCount: 104,
  });
}

describe("SendChatMessageUseCase", () => {
  it("sessionId未指定なら新規セッションを作成し、ユーザーメッセージを保存する", async () => {
    const chatRepository = buildMockChatRepository();
    const llmClient = buildMockLlmClient({ streamChat: vi.fn().mockReturnValue(fakeStream(["こん", "にちは"])) });
    const useCase = new SendChatMessageUseCase(
      chatRepository,
      llmClient,
      buildMockAreaRepository(),
      buildMockMunicipalityRepository(),
      buildMockParser(),
    );

    const result = await useCase.execute({ sessionId: null, message: "こんにちは" });

    expect(chatRepository.createSession).toHaveBeenCalledTimes(1);
    result.match(
      async (output) => {
        expect(chatRepository.addMessage).toHaveBeenCalledWith(
          expect.objectContaining({ role: "user", content: "こんにちは" }),
        );
        expect(await collect(output.stream)).toBe("こんにちは");
      },
      () => {
        throw new Error("unreachable");
      },
    );
  });

  it("既存sessionIdが指定された場合は新規セッションを作成しない", async () => {
    const chatRepository = buildMockChatRepository();
    const llmClient = buildMockLlmClient({ streamChat: vi.fn().mockReturnValue(fakeStream(["ok"])) });
    const useCase = new SendChatMessageUseCase(
      chatRepository,
      llmClient,
      buildMockAreaRepository(),
      buildMockMunicipalityRepository(),
      buildMockParser(),
    );

    await useCase.execute({ sessionId: "existing-session", message: "続きです" });

    expect(chatRepository.createSession).not.toHaveBeenCalled();
  });

  it("エリア名が抽出できた場合、統計データをコンテキストとして直近のユーザーメッセージに前置する", async () => {
    const chatRepository = buildMockChatRepository({
      findMessagesBySessionId: vi.fn().mockResolvedValue([
        ChatMessage.create({
          id: "m1",
          sessionId: "s1",
          role: "user",
          content: "渋谷区の相場を教えて",
          createdAt: new Date(),
        }),
      ]),
    });
    let capturedMessages: LlmChatMessage[] = [];
    const llmClient = buildMockLlmClient({
      streamChat: vi.fn().mockImplementation((messages: LlmChatMessage[]) => {
        capturedMessages = messages;
        return fakeStream(["渋谷区は下落傾向です"]);
      }),
    });
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(buildSnapshot()),
    });
    const municipalityRepository = buildMockMunicipalityRepository({
      findByName: vi.fn().mockResolvedValue({ code: "13113", name: "渋谷区" }),
    });
    const parser = buildMockParser({
      parse: vi.fn().mockResolvedValue({
        municipalityName: "渋谷区",
        propertyType: null,
        maxBuildingAgeYears: null,
        minPriceYen: null,
        maxPriceYen: null,
      } satisfies SearchCondition),
    });
    const useCase = new SendChatMessageUseCase(
      chatRepository,
      llmClient,
      areaRepository,
      municipalityRepository,
      parser,
    );

    const result = await useCase.execute({ sessionId: "s1", message: "渋谷区の相場を教えて" });
    result.match(
      async (output) => {
        await collect(output.stream);
      },
      () => {
        throw new Error("unreachable");
      },
    );

    expect(capturedMessages[0].content).toContain("エリア: 東京都渋谷区");
    expect(capturedMessages[0].content).toContain("渋谷区の相場を教えて");
  });

  it("ストリーム消費後にアシスタントの回答全文をDBへ保存する", async () => {
    const chatRepository = buildMockChatRepository();
    const llmClient = buildMockLlmClient({ streamChat: vi.fn().mockReturnValue(fakeStream(["こん", "にちは"])) });
    const useCase = new SendChatMessageUseCase(
      chatRepository,
      llmClient,
      buildMockAreaRepository(),
      buildMockMunicipalityRepository(),
      buildMockParser(),
    );

    const result = await useCase.execute({ sessionId: null, message: "こんにちは" });
    await result.match(
      async (output) => {
        await collect(output.stream);
      },
      () => {
        throw new Error("unreachable");
      },
    );

    expect(chatRepository.addMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: "assistant", content: "こんにちは" }),
    );
  });

  it("セッション作成が失敗した場合はCHAT_MESSAGE_FAILEDのResult.errを返す", async () => {
    const chatRepository = buildMockChatRepository({
      createSession: vi.fn().mockRejectedValue(new Error("DB down")),
    });
    const useCase = new SendChatMessageUseCase(
      chatRepository,
      buildMockLlmClient(),
      buildMockAreaRepository(),
      buildMockMunicipalityRepository(),
      buildMockParser(),
    );

    const result = await useCase.execute({ sessionId: null, message: "こんにちは" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("CHAT_MESSAGE_FAILED"),
    );
  });
});
