import type { PrismaClient } from "@/generated/prisma/client";
import { JgbYield } from "../domain/entities/jgb-yield";
import { PolicyRate } from "../domain/entities/policy-rate";
import type { InterestRateRepository } from "../domain/repositories/interest-rate-repository";

export class PrismaInterestRateRepository implements InterestRateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findJgbYieldHistory(fromDate?: Date): Promise<JgbYield[]> {
    const rows = await this.prisma.jgbYield.findMany({
      where: fromDate ? { date: { gte: fromDate } } : undefined,
      orderBy: { date: "asc" },
    });
    return rows.map((row) => JgbYield.create({ date: row.date, tenYearRate: row.tenYearRate }));
  }

  async findLatestJgbYield(): Promise<JgbYield | null> {
    const row = await this.prisma.jgbYield.findFirst({ orderBy: { date: "desc" } });
    return row ? JgbYield.create({ date: row.date, tenYearRate: row.tenYearRate }) : null;
  }

  async findPolicyRateHistory(): Promise<PolicyRate[]> {
    const rows = await this.prisma.policyRate.findMany({ orderBy: { effectiveDate: "asc" } });
    return rows.map((row) =>
      PolicyRate.create({ effectiveDate: row.effectiveDate, ratePercent: row.ratePercent, note: row.note }),
    );
  }

  async findLatestPolicyRate(): Promise<PolicyRate | null> {
    const row = await this.prisma.policyRate.findFirst({ orderBy: { effectiveDate: "desc" } });
    return row ? PolicyRate.create({ effectiveDate: row.effectiveDate, ratePercent: row.ratePercent, note: row.note }) : null;
  }
}
