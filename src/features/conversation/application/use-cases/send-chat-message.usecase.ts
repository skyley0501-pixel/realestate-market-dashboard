import type { AreaRepository } from "@/features/market/domain/repositories/area-repository";
import type { MunicipalityRepository } from "@/features/transaction/domain/repositories/municipality-repository";
import { ApplicationError } from "@/shared/application/application-error";
import { Result } from "@/shared/application/result";
import { ChatMessage } from "../../domain/entities/chat-message";
import { ChatSession } from "../../domain/entities/chat-session";
import type { ChatRepository } from "../../domain/repositories/chat-repository";
import type { NaturalLanguageQueryParser } from "../../domain/services/natural-language-query-parser";
import type { LlmChatMessage, LlmClient } from "../../infrastructure/llm-client";

export interface SendChatMessageInput {
  // 未指定（初回メッセージ）ならUseCaseが新規セッションを作成する
  sessionId: string | null;
  message: string;
}

export interface SendChatMessageOutput {
  sessionId: string;
  // ストリーミングしながら末尾でアシスタントの回答をDBへ保存する
  stream: AsyncIterable<string>;
}

export class SendChatMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly llmClient: LlmClient,
    private readonly areaRepository: AreaRepository,
    private readonly municipalityRepository: MunicipalityRepository,
    private readonly naturalLanguageQueryParser: NaturalLanguageQueryParser,
  ) {}

  async execute(input: SendChatMessageInput): Promise<Result<SendChatMessageOutput, ApplicationError>> {
    try {
      const sessionId = input.sessionId ?? crypto.randomUUID();
      if (!input.sessionId) {
        await this.chatRepository.createSession(
          ChatSession.create({ id: sessionId, userId: null, title: null, createdAt: new Date() }),
        );
      }

      await this.chatRepository.addMessage(
        ChatMessage.create({
          id: crypto.randomUUID(),
          sessionId,
          role: "user",
          content: input.message,
          createdAt: new Date(),
        }),
      );

      const context = await this.buildAreaContext(input.message);
      const history = await this.chatRepository.findMessagesBySessionId(sessionId);
      const llmMessages: LlmChatMessage[] = history.map((m, index) => ({
        role: m.role,
        // 直近のユーザーメッセージ（＝今回の入力）にのみ統計コンテキストを前置する
        content: context && index === history.length - 1 ? `${context}\n\n---\n\n${m.content}` : m.content,
      }));

      return Result.ok({ sessionId, stream: this.streamAndPersist(sessionId, llmMessages) });
    } catch (error) {
      return Result.err(
        new ApplicationError(
          "CHAT_MESSAGE_FAILED",
          `チャットメッセージの送信に失敗しました: ${String(error)}`,
          "チャットの送信に失敗しました。しばらくしてから再度お試しください。",
        ),
      );
    }
  }

  // ユーザーメッセージから言及エリアを抽出し、統計データをコンテキスト文字列として組み立てる（RAG的処理）。
  // 該当エリアが特定できない場合はnull（コンテキスト無しでLLMに回答させる）
  private async buildAreaContext(message: string): Promise<string | null> {
    const condition = await this.naturalLanguageQueryParser.parse(message);
    if (!condition.municipalityName) return null;

    const municipality = await this.municipalityRepository.findByName(condition.municipalityName);
    if (!municipality) return null;

    const snapshot = await this.areaRepository.findLatestSnapshotByCode(municipality.code);
    if (!snapshot) return null;

    const trendText = snapshot.trendRate ? `${snapshot.trendRate.percent.toFixed(1)}%` : "データなし";
    return [
      "あなたは不動産市場アシスタントです。以下の統計データを踏まえてユーザーの質問に日本語で回答してください。",
      `エリア: ${snapshot.area.prefectureName}${snapshot.area.name}`,
      `対象期間: ${snapshot.period}`,
      `中央価格: ${snapshot.statistics.median.yen}円`,
      `平均坪単価: ${snapshot.avgUnitPriceYenPerSqm}円/㎡`,
      `前期比: ${trendText}`,
      `取引件数: ${snapshot.transactionCount}件`,
    ].join("\n");
  }

  private async *streamAndPersist(sessionId: string, messages: LlmChatMessage[]): AsyncGenerator<string> {
    let fullContent = "";
    for await (const chunk of this.llmClient.streamChat(messages)) {
      fullContent += chunk;
      yield chunk;
    }

    await this.chatRepository.addMessage(
      ChatMessage.create({
        id: crypto.randomUUID(),
        sessionId,
        role: "assistant",
        content: fullContent,
        createdAt: new Date(),
      }),
    );
  }
}
