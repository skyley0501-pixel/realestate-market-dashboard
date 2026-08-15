import { prisma } from "@/shared/infrastructure/prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AiAreaReport } from "../domain/entities/ai-area-report";
import { PrismaAiAreaReportRepository } from "./prisma-ai-area-report-repository";

// 実際のSupabase(PostgreSQL)に対する結合テスト。DATABASE_URL/DIRECT_URLが.envに必要。
describe("PrismaAiAreaReportRepository (integration)", () => {
  const repository = new PrismaAiAreaReportRepository(prisma);
  const testMunicipalityCode = "13299"; // 実データ・他テストと衝突しないテスト専用コード

  beforeAll(async () => {
    await prisma.prefecture.upsert({
      where: { code: "13" },
      create: { code: "13", name: "東京都" },
      update: {},
    });
    await prisma.municipality.upsert({
      where: { code: testMunicipalityCode },
      create: { code: testMunicipalityCode, name: "テストAI区", prefectureCode: "13" },
      update: {},
    });
  });

  afterAll(async () => {
    await prisma.aiAreaReport.deleteMany({ where: { municipalityCode: testMunicipalityCode } });
    await prisma.municipality.deleteMany({ where: { code: testMunicipalityCode } });
  });

  it("saveで保存した内容をfindByAreaCodeで取得できる", async () => {
    const report = AiAreaReport.create({
      areaCode: testMunicipalityCode,
      content: "テスト用の講評文です。",
      generatedAt: new Date("2026-08-15T00:00:00.000Z"),
    });

    await repository.save(report);
    const found = await repository.findByAreaCode(testMunicipalityCode);

    expect(found).not.toBeNull();
    expect(found?.content).toBe("テスト用の講評文です。");
  });

  it("saveを2回呼ぶと洗い替えされる（エリアごとに最新1件のみ保持）", async () => {
    await repository.save(
      AiAreaReport.create({ areaCode: testMunicipalityCode, content: "1回目", generatedAt: new Date() }),
    );
    await repository.save(
      AiAreaReport.create({ areaCode: testMunicipalityCode, content: "2回目", generatedAt: new Date() }),
    );

    const found = await repository.findByAreaCode(testMunicipalityCode);
    const count = await prisma.aiAreaReport.count({ where: { municipalityCode: testMunicipalityCode } });

    expect(found?.content).toBe("2回目");
    expect(count).toBe(1);
  });

  it("未生成のエリアコードにはnullを返す", async () => {
    const found = await repository.findByAreaCode("not-exist-code");
    expect(found).toBeNull();
  });
});
