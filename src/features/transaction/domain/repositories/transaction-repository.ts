import type { Money } from "@/shared/domain/value-objects/money";
import type { Transaction } from "../entities/transaction";

export interface TransactionSearchCriteria {
  municipalityCode?: string;
  propertyType?: string;
  floorPlan?: string;
  minPrice?: Money;
  maxPrice?: Money;
  minAreaSqm?: number;
  maxAreaSqm?: number; // 上限は含まない（〜未満）
  minBuildingYear?: number;
  maxBuildingYear?: number;
  limit?: number;
  offset?: number;
}

// Infrastructure層（PrismaTransactionRepository等、Day11で実装）が実装するPort
export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  search(criteria: TransactionSearchCriteria): Promise<Transaction[]>;
  count(criteria: TransactionSearchCriteria): Promise<number>;
  findDistinctFloorPlans(): Promise<string[]>;
}
