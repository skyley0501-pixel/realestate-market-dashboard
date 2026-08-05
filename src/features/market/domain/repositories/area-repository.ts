import type { AreaMarketSnapshot } from "../aggregates/area-market-snapshot";

// Infrastructure層（PrismaAreaRepository、Day22で実装）が実装するPort
export interface AreaRepository {
  // 各エリアの最新期間のスナップショットを一覧で返す
  findLatestSnapshots(): Promise<AreaMarketSnapshot[]>;
  // 指定エリアの最新期間のスナップショットを返す。該当エリアの集計結果が無ければnull
  findLatestSnapshotByCode(code: string): Promise<AreaMarketSnapshot | null>;
  // 指定エリアの全期間のスナップショットを期間昇順で返す（価格推移グラフ用）
  findSnapshotHistoryByCode(code: string): Promise<AreaMarketSnapshot[]>;
  // 複数エリアの全期間のスナップショットをエリアコード・期間昇順で返す（トレンド比較グラフ用）
  findSnapshotHistoryByCodes(codes: string[]): Promise<AreaMarketSnapshot[]>;
  // 複数エリアの最新期間のスナップショットを返す（該当データが無いエリアは結果に含まれない。エリア比較のレーダーチャート用）
  findLatestSnapshotsByCodes(codes: string[]): Promise<AreaMarketSnapshot[]>;
}
