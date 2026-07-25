// 不動産情報ライブラリ「不動産価格（取引価格・成約価格）情報取得API」(XIT001) のクライアント兼シード用データ取得スクリプト
// 実行例:
//   node scripts/fetch-reinfolib.ts --area 13 --quarters 4
//   node scripts/fetch-reinfolib.ts --area 13 --quarters 4 --dry-run   # APIキー無しでURL・四半期計算のみ確認
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

const REINFOLIB_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001";

// XIT001 APIレスポンスの1件分。ドキュメント上は全項目文字列で返却される。
// 参考: https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/
export interface ReinfolibTransactionRecord {
  Type: string;
  Region?: string;
  MunicipalityCode: string;
  Prefecture: string;
  Municipality: string;
  DistrictName?: string;
  TradePrice: string;
  PricePerUnit?: string;
  FloorPlan?: string;
  Area?: string;
  UnitPrice?: string;
  LandShape?: string;
  Frontage?: string;
  TotalFloorArea?: string;
  BuildingYear?: string;
  Structure?: string;
  Use?: string;
  Purpose?: string;
  Direction?: string;
  Classification?: string;
  Breadth?: string;
  CityPlanning?: string;
  CoverageRatio?: string;
  FloorAreaRatio?: string;
  Period: string;
  Renovation?: string;
  Remarks?: string;
  PriceCategory?: string;
  DistrictCode?: string;
}

interface ReinfolibApiResponse {
  status: string;
  data: ReinfolibTransactionRecord[];
}

export interface FetchReinfolibParams {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  area: string;
  priceClassification?: "01" | "02";
}

export function buildReinfolibUrl(params: FetchReinfolibParams): string {
  const url = new URL(REINFOLIB_BASE_URL);
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("quarter", String(params.quarter));
  url.searchParams.set("area", params.area);
  if (params.priceClassification) {
    url.searchParams.set("priceClassification", params.priceClassification);
  }
  return url.toString();
}

// APIレスポンスはgzipエンコードされている場合があるため、平文JSONとしてのパースに失敗したらgunzipして再試行する
async function parseReinfolibResponse(res: Response): Promise<ReinfolibApiResponse> {
  const buffer = Buffer.from(await res.arrayBuffer());
  try {
    return JSON.parse(buffer.toString("utf-8")) as ReinfolibApiResponse;
  } catch {
    return JSON.parse(gunzipSync(buffer).toString("utf-8")) as ReinfolibApiResponse;
  }
}

export async function fetchReinfolibTransactions(
  params: FetchReinfolibParams,
  apiKey: string,
): Promise<ReinfolibTransactionRecord[]> {
  const url = buildReinfolibUrl(params);
  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`reinfolib API error: ${res.status} ${res.statusText} (${url})`);
  }
  const body = await parseReinfolibResponse(res);
  return body.data ?? [];
}

// 現在日時を基準に、直近count四半期分の {year, quarter} を新しい順で返す（進行中の四半期は含めない）
export function getRecentQuarters(
  count: number,
  fromDate: Date = new Date(),
): Array<{ year: number; quarter: 1 | 2 | 3 | 4 }> {
  const currentQuarter = (Math.floor(fromDate.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  let year = fromDate.getFullYear();
  let quarter = currentQuarter - 1;
  if (quarter === 0) {
    quarter = 4;
    year -= 1;
  }

  const quarters: Array<{ year: number; quarter: 1 | 2 | 3 | 4 }> = [];
  for (let i = 0; i < count; i++) {
    quarters.push({ year, quarter: quarter as 1 | 2 | 3 | 4 });
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }
  return quarters;
}

interface CliOptions {
  area: string;
  quarters: number;
  dryRun: boolean;
  outDir: string;
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    area: "13", // 東京都
    quarters: 4,
    dryRun: false,
    outDir: path.join(process.cwd(), "data", "reinfolib"),
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--area":
        options.area = argv[++i];
        break;
      case "--quarters":
        options.quarters = Number(argv[++i]);
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--out-dir":
        options.outDir = argv[++i];
        break;
    }
  }
  return options;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const quarters = getRecentQuarters(options.quarters);

  if (options.dryRun) {
    console.log("[dry-run] 取得対象四半期:", quarters);
    for (const q of quarters) {
      console.log("[dry-run]", buildReinfolibUrl({ ...q, area: options.area }));
    }
    return;
  }

  const apiKey = process.env.REINFOLIB_API_KEY;
  if (!apiKey) {
    throw new Error(
      "REINFOLIB_API_KEY が未設定です。.env に設定するか、--dry-run で動作確認してください。",
    );
  }

  await mkdir(options.outDir, { recursive: true });

  for (const q of quarters) {
    console.log(`取得中: area=${options.area} year=${q.year} quarter=${q.quarter}`);
    const records = await fetchReinfolibTransactions({ ...q, area: options.area }, apiKey);
    const outFile = path.join(options.outDir, `${options.area}_${q.year}Q${q.quarter}.json`);
    await writeFile(outFile, JSON.stringify(records, null, 2), "utf-8");
    console.log(`  -> ${records.length}件を ${outFile} に保存`);
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
