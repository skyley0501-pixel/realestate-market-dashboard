import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { Money } from "@/shared/domain/value-objects/money";
import { Transaction } from "../domain/entities/transaction";
import type {
  TransactionRepository,
  TransactionSearchCriteria,
} from "../domain/repositories/transaction-repository";
import { BuildingAge } from "../domain/value-objects/building-age";
import { FloorPlan } from "../domain/value-objects/floor-plan";

type TransactionRow = Awaited<ReturnType<PrismaClient["transaction"]["findFirstOrThrow"]>>;

function toEntity(row: TransactionRow): Transaction {
  return Transaction.create({
    id: row.id,
    municipalityCode: row.municipalityCode,
    stationId: row.stationId,
    transactionPeriod: row.transactionPeriod,
    propertyType: row.propertyType,
    price: Money.fromYen(row.priceYen),
    areaSqm: row.areaSqm,
    floorPlan: row.floorPlan ? FloorPlan.fromLabel(row.floorPlan) : null,
    buildingAge: BuildingAge.fromBuildingYear(row.buildingYear),
    structure: row.structure,
    use: row.use,
    remarks: row.remarks,
  });
}

function buildWhere(criteria: TransactionSearchCriteria): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {};
  if (criteria.municipalityCode) where.municipalityCode = criteria.municipalityCode;
  if (criteria.propertyType) where.propertyType = criteria.propertyType;
  if (criteria.floorPlan) where.floorPlan = criteria.floorPlan;
  if (criteria.minPrice || criteria.maxPrice) {
    where.priceYen = {
      ...(criteria.minPrice ? { gte: criteria.minPrice.yen } : {}),
      ...(criteria.maxPrice ? { lte: criteria.maxPrice.yen } : {}),
    };
  }
  return where;
}

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async search(criteria: TransactionSearchCriteria): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: buildWhere(criteria),
      take: criteria.limit,
      skip: criteria.offset,
      orderBy: { transactionPeriod: "desc" },
    });
    return rows.map(toEntity);
  }

  async count(criteria: TransactionSearchCriteria): Promise<number> {
    return this.prisma.transaction.count({ where: buildWhere(criteria) });
  }
}
