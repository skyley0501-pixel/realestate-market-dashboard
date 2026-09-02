import type { JgbYield } from "../entities/jgb-yield";
import type { PolicyRate } from "../entities/policy-rate";
import type { RateNews } from "../entities/rate-news";

// Infrastructure層（PrismaInterestRateRepository）が実装するPort
export interface InterestRateRepository {
  // 国債10年利回りを日付昇順で返す。fromDateを指定すると以降のみに絞る（グラフの表示期間調整用）
  findJgbYieldHistory(fromDate?: Date): Promise<JgbYield[]>;
  // 直近の国債10年利回りを1件返す（データが無ければnull）
  findLatestJgbYield(): Promise<JgbYield | null>;
  // 政策金利の改定履歴を適用日昇順で返す
  findPolicyRateHistory(): Promise<PolicyRate[]>;
  // 直近の政策金利を1件返す（データが無ければnull）
  findLatestPolicyRate(): Promise<PolicyRate | null>;
  // 金融政策関連ニュースの見出しを公開日降順（新しい順）でlimit件返す
  findLatestRateNews(limit: number): Promise<RateNews[]>;
}
