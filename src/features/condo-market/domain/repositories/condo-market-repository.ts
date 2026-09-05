import type { CondoMarketStat } from "../entities/condo-market-stat";
import type { CondoSupply } from "../entities/condo-supply";

// Infrastructure層（PrismaCondoMarketRepository）が実装するPort
export interface CondoMarketRepository {
  // 1都3県の新築分譲マンション着工戸数を年度昇順で返す
  findAllCondoSupply(): Promise<CondoSupply[]>;
  // 1都3県の中古マンション取引統計を期間昇順で返す
  findAllCondoMarketStats(): Promise<CondoMarketStat[]>;
}
