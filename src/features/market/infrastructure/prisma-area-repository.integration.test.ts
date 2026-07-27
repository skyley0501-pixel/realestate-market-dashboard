import { prisma } from "@/shared/infrastructure/prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaAreaRepository } from "./prisma-area-repository";

// 実際のSupabase(PostgreSQL)に対する結合テスト。DATABASE_URL/DIRECT_URLが.envに必要。
describe("PrismaAreaRepository (integration)", () => {
  const repository = new PrismaAreaRepository(prisma);
  const testMunicipalityCode = "13199"; // 実データと衝突しないテスト専用コード
  // 実データの最新期間（2025Q4等）より確実に新しくなるよう、テスト専用の未来の期間を使う
  const previousPeriod = "9999Q1";
  const latestPeriod = "9999Q2";
  const createdIds: string[] = [];

  beforeAll(async () => {
    await prisma.prefecture.upsert({
      where: { code: "13" },
      create: { code: "13", name: "東京都" },
      update: {},
    });
    await prisma.municipality.upsert({
      where: { code: testMunicipalityCode },
      create: { code: testMunicipalityCode, name: "テスト区", prefectureCode: "13" },
      update: {},
    });

    const previous = await prisma.areaStatistics.create({
      data: {
        municipalityCode: testMunicipalityCode,
        period: previousPeriod,
        medianPriceYen: 45_000_000n,
        averagePriceYen: 46_000_000n,
        q1PriceYen: 40_000_000n,
        q3PriceYen: 50_000_000n,
        avgUnitPriceYenPerSqm: 800_000,
        sampleSize: 10,
        transactionCount: 12,
        yoyChangeRatePercent: null,
      },
    });
    const latest = await prisma.areaStatistics.create({
      data: {
        municipalityCode: testMunicipalityCode,
        period: latestPeriod,
        medianPriceYen: 50_000_000n,
        averagePriceYen: 52_000_000n,
        q1PriceYen: 44_000_000n,
        q3PriceYen: 60_000_000n,
        avgUnitPriceYenPerSqm: 850_000,
        sampleSize: 12,
        transactionCount: 14,
        yoyChangeRatePercent: 11.111,
      },
    });
    createdIds.push(previous.id, latest.id);
  });

  afterAll(async () => {
    await prisma.areaStatistics.deleteMany({ where: { id: { in: createdIds } } });
  });

  it("findLatestSnapshotsは最新期間のスナップショットのみを返す", async () => {
    const snapshots = await repository.findLatestSnapshots();
    const target = snapshots.find((s) => s.area.code === testMunicipalityCode);

    expect(target).toBeDefined();
    expect(target?.period).toBe(latestPeriod);
    expect(target?.statistics.median.yen).toBe(50_000_000n);
    expect(target?.trendRate?.percent).toBeCloseTo(11.111, 3);
  });

  it("findLatestSnapshotByCodeで最新期間のスナップショットをEntityへ正しくマッピングする", async () => {
    const snapshot = await repository.findLatestSnapshotByCode(testMunicipalityCode);

    expect(snapshot).not.toBeNull();
    expect(snapshot?.area.name).toBe("テスト区");
    expect(snapshot?.area.prefectureName).toBe("東京都");
    expect(snapshot?.period).toBe(latestPeriod);
    expect(snapshot?.statistics.q1.yen).toBe(44_000_000n);
  });

  it("存在しないコードはnullを返す", async () => {
    const snapshot = await repository.findLatestSnapshotByCode("non-existent-code");
    expect(snapshot).toBeNull();
  });
});
