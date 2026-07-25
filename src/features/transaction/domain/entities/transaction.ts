import { DomainError } from "@/shared/domain/errors/domain-error";
import { Money } from "@/shared/domain/value-objects/money";
import { BuildingAge } from "../value-objects/building-age";
import { FloorPlan } from "../value-objects/floor-plan";

export class InvalidTransactionAreaError extends DomainError {
  readonly code = "INVALID_TRANSACTION_AREA";

  constructor(areaSqm: unknown) {
    super(`不正な面積です: ${String(areaSqm)}`);
  }
}

export interface TransactionProps {
  id: string;
  municipalityCode: string;
  stationId: string | null;
  transactionPeriod: string;
  propertyType: string;
  price: Money;
  areaSqm: number;
  floorPlan: FloorPlan | null;
  buildingAge: BuildingAge;
  structure: string | null;
  use: string | null;
  remarks: string | null;
}

// 不動産取引1件を表すEntity。同一性はidで判定する（価格等の属性が変わっても同じ取引）。
export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  static create(props: TransactionProps): Transaction {
    if (!Number.isFinite(props.areaSqm) || props.areaSqm <= 0) {
      throw new InvalidTransactionAreaError(props.areaSqm);
    }
    return new Transaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get municipalityCode(): string {
    return this.props.municipalityCode;
  }

  get stationId(): string | null {
    return this.props.stationId;
  }

  get transactionPeriod(): string {
    return this.props.transactionPeriod;
  }

  get propertyType(): string {
    return this.props.propertyType;
  }

  get price(): Money {
    return this.props.price;
  }

  get areaSqm(): number {
    return this.props.areaSqm;
  }

  get floorPlan(): FloorPlan | null {
    return this.props.floorPlan;
  }

  get buildingAge(): BuildingAge {
    return this.props.buildingAge;
  }

  get structure(): string | null {
    return this.props.structure;
  }

  get use(): string | null {
    return this.props.use;
  }

  get remarks(): string | null {
    return this.props.remarks;
  }

  // 坪単価等の算出の基礎となる平米単価
  unitPricePerSqm(): Money {
    return this.props.price.divide(this.props.areaSqm);
  }

  equals(other: Transaction): boolean {
    return this.id === other.id;
  }
}
