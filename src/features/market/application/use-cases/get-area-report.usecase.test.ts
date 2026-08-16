import type { LlmClient } from "@/features/conversation/infrastructure/llm-client";
import { Money } from "@/shared/domain/value-objects/money";
import { describe, expect, it, vi } from "vitest";
import { AreaMarketSnapshot } from "../../domain/aggregates/area-market-snapshot";
import { AiAreaReport } from "../../domain/entities/ai-area-report";
import { Area } from "../../domain/entities/area";
import type { AiAreaReportRepository } from "../../domain/repositories/ai-area-report-repository";
import type { AreaRepository } from "../../domain/repositories/area-repository";
import { PriceStatistics } from "../../domain/value-objects/price-statistics";
import { TrendRate } from "../../domain/value-objects/trend-rate";
import { GetAreaReportUseCase } from "./get-area-report.usecase";

function buildSnapshot(code: string, period = "2025Q4"): AreaMarketSnapshot {
  return AreaMarketSnapshot.create({
    area: Area.create({ code, name: "千代田区", prefectureCode: "13", prefectureName: "東京都" }),
    period,
    statistics: PriceStatistics.reconstruct(
      Money.fromYen(50_000_000),
      Money.fromYen(52_000_000),
      Money.fromYen(40_000_000),
      Money.fromYen(60_000_000),
      100,
    ),
    trendRate: TrendRate.reconstruct(11.11),
    avgUnitPriceYenPerSqm: 800_000,
    transactionCount: 110,
  });
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

function buildMockAiAreaReportRepository(
  overrides: Partial<AiAreaReportRepository> = {},
): AiAreaReportRepository {
  return {
    findByAreaCodeAndPeriod: vi.fn(),
    save: vi.fn(),
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

describe("GetAreaReportUseCase", () => {
  it("最新期間と一致するキャッシュ済みレポートがあればLLMを呼ばずにそれを返す", async () => {
    const snapshot = buildSnapshot("13101", "2025Q4");
    const cached = AiAreaReport.create({
      areaCode: "13101",
      period: "2025Q4",
      content: "既存の講評",
      generatedAt: new Date(),
    });
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(snapshot),
    });
    const aiAreaReportRepository = buildMockAiAreaReportRepository({
      findByAreaCodeAndPeriod: vi.fn().mockResolvedValue(cached),
    });
    const llmClient = buildMockLlmClient();
    const useCase = new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, llmClient);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      (value) => expect(value.content).toBe("既存の講評"),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(llmClient.completeStructured).not.toHaveBeenCalled();
    expect(aiAreaReportRepository.findByAreaCodeAndPeriod).toHaveBeenCalledWith("13101", "2025Q4");
  });

  it("統計の対象期間が進んでいる場合はキャッシュを無視して再生成する（古い期間のキャッシュを返さない）", async () => {
    const latestSnapshot = buildSnapshot("13101", "2026Q1");
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(latestSnapshot),
    });
    // findByAreaCodeAndPeriodには最新期間("2026Q1")で問い合わせるため、古い期間のキャッシュしか
    // 無いケースをシミュレートするとnullが返る想定
    const aiAreaReportRepository = buildMockAiAreaReportRepository({
      findByAreaCodeAndPeriod: vi.fn().mockResolvedValue(null),
    });
    const llmClient = buildMockLlmClient({
      completeStructured: vi.fn().mockResolvedValue({ content: "2026Q1向けの新しい講評" }),
    });
    const useCase = new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, llmClient);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      (value) => {
        expect(value.content).toBe("2026Q1向けの新しい講評");
        expect(value.period).toBe("2026Q1");
      },
      () => {
        throw new Error("unreachable");
      },
    );
    expect(aiAreaReportRepository.findByAreaCodeAndPeriod).toHaveBeenCalledWith("13101", "2026Q1");
    expect(aiAreaReportRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ period: "2026Q1" }),
    );
  });

  it("キャッシュが無ければ統計データからLLMで生成し、保存してから返す", async () => {
    const snapshot = buildSnapshot("13101");
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(snapshot),
    });
    const aiAreaReportRepository = buildMockAiAreaReportRepository({
      findByAreaCodeAndPeriod: vi.fn().mockResolvedValue(null),
    });
    const llmClient = buildMockLlmClient({
      completeStructured: vi.fn().mockResolvedValue({ content: "生成された講評" }),
    });
    const useCase = new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, llmClient);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      (value) => expect(value.content).toBe("生成された講評"),
      () => {
        throw new Error("unreachable");
      },
    );
    expect(llmClient.completeStructured).toHaveBeenCalledTimes(1);
    expect(aiAreaReportRepository.save).toHaveBeenCalledTimes(1);
  });

  it("エリアが存在しない場合はAREA_NOT_FOUNDのResult.errを返す", async () => {
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(null),
    });
    const aiAreaReportRepository = buildMockAiAreaReportRepository();
    const llmClient = buildMockLlmClient();
    const useCase = new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, llmClient);

    const result = await useCase.execute({ code: "not-exist" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_NOT_FOUND"),
    );
    expect(llmClient.completeStructured).not.toHaveBeenCalled();
    expect(aiAreaReportRepository.findByAreaCodeAndPeriod).not.toHaveBeenCalled();
  });

  it("LLM呼び出しが失敗した場合はAREA_REPORT_FAILEDのResult.errを返す", async () => {
    const snapshot = buildSnapshot("13101");
    const areaRepository = buildMockAreaRepository({
      findLatestSnapshotByCode: vi.fn().mockResolvedValue(snapshot),
    });
    const aiAreaReportRepository = buildMockAiAreaReportRepository({
      findByAreaCodeAndPeriod: vi.fn().mockResolvedValue(null),
    });
    const llmClient = buildMockLlmClient({
      completeStructured: vi.fn().mockRejectedValue(new Error("Gemini APIエラー")),
    });
    const useCase = new GetAreaReportUseCase(areaRepository, aiAreaReportRepository, llmClient);

    const result = await useCase.execute({ code: "13101" });

    result.match(
      () => {
        throw new Error("unreachable");
      },
      (error) => expect(error.code).toBe("AREA_REPORT_FAILED"),
    );
    expect(aiAreaReportRepository.save).not.toHaveBeenCalled();
  });
});
