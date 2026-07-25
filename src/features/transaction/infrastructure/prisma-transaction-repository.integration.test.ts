import { prisma } from "@/shared/infrastructure/prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaTransactionRepository } from "./prisma-transaction-repository";

// 実際のSupabase(PostgreSQL)に対する結合テスト。DATABASE_URL/DIRECT_URLが.envに必要。
describe("PrismaTransactionRepository (integration)", () => {
  const repository = new PrismaTransactionRepository(prisma);
  const testMunicipalityCode = "13113";
  let createdTransactionId: string;

  beforeAll(async () => {
    await prisma.prefecture.upsert({
      where: { code: "13" },
      create: { code: "13", name: "東京都" },
      update: {},
    });
    await prisma.municipality.upsert({
      where: { code: testMunicipalityCode },
      create: { code: testMunicipalityCode, name: "渋谷区", prefectureCode: "13" },
      update: {},
    });
    const row = await prisma.transaction.create({
      data: {
        municipalityCode: testMunicipalityCode,
        transactionPeriod: "2015Q2",
        propertyType: "中古マンション等",
        priceYen: 85000000n,
        areaSqm: 70,
        floorPlan: "3LDK",
        buildingYear: 2005,
        structure: "RC",
        use: "住宅",
      },
    });
    createdTransactionId = row.id;
  });

  afterAll(async () => {
    await prisma.transaction.delete({ where: { id: createdTransactionId } });
  });

  it("findByIdでDBから取得しEntityへ正しくマッピングする", async () => {
    const transaction = await repository.findById(createdTransactionId);

    expect(transaction).not.toBeNull();
    expect(transaction?.price.yen).toBe(85000000n);
    expect(transaction?.areaSqm).toBe(70);
    expect(transaction?.floorPlan?.toString()).toBe("3LDK");
    expect(transaction?.buildingAge.years).not.toBeNull();
    expect(transaction?.municipalityCode).toBe(testMunicipalityCode);
  });

  it("存在しないIDはnullを返す", async () => {
    const transaction = await repository.findById("non-existent-id");
    expect(transaction).toBeNull();
  });

  it("searchで市区町村コードによる絞り込みができる", async () => {
    const results = await repository.search({ municipalityCode: testMunicipalityCode });
    expect(results.some((t) => t.id === createdTransactionId)).toBe(true);
  });

  it("countで対象件数を取得できる", async () => {
    const count = await repository.count({ municipalityCode: testMunicipalityCode });
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
