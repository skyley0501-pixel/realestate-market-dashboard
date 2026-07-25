import { DomainError } from "@/shared/domain/errors/domain-error";

export class InvalidFloorPlanError extends DomainError {
  readonly code = "INVALID_FLOOR_PLAN";

  constructor(raw: unknown) {
    super(`不正な間取り表記です: ${String(raw)}`);
  }
}

// 間取り表記（"3LDK"等）を表す値オブジェクト。表記ゆれの吸収は前後空白の除去に留め、
// 実データの多様な表記（"1R", "2LDK+S", "ワンルーム"等）をそのまま許容する。
export class FloorPlan {
  private constructor(private readonly label: string) {}

  static fromLabel(raw: string): FloorPlan {
    const normalized = raw.trim();
    if (normalized.length === 0) {
      throw new InvalidFloorPlanError(raw);
    }
    return new FloorPlan(normalized);
  }

  toString(): string {
    return this.label;
  }

  equals(other: FloorPlan): boolean {
    return this.label === other.label;
  }
}
