import type { Transaction } from "../../domain/entities/transaction";

// JSON.stringifyはbigintを扱えないため、priceYenは文字列として返す
export interface TransactionSummaryDto {
  id: string;
  municipalityCode: string;
  stationId: string | null;
  transactionPeriod: string;
  propertyType: string;
  priceYen: string;
  areaSqm: number;
  floorPlan: string | null;
  buildingAgeYears: number | null;
  structure: string | null;
  use: string | null;
  remarks: string | null;
}

export function toTransactionSummary(transaction: Transaction): TransactionSummaryDto {
  return {
    id: transaction.id,
    municipalityCode: transaction.municipalityCode,
    stationId: transaction.stationId,
    transactionPeriod: transaction.transactionPeriod,
    propertyType: transaction.propertyType,
    priceYen: transaction.price.yen.toString(),
    areaSqm: transaction.areaSqm,
    floorPlan: transaction.floorPlan?.toString() ?? null,
    buildingAgeYears: transaction.buildingAge.years,
    structure: transaction.structure,
    use: transaction.use,
    remarks: transaction.remarks,
  };
}
