// maplibre-glはバンドラー環境でimport.meta.urlベースのworker URL解決が機能しないことがあるため、
// worker本体をpublicに配置し、MarketMapからsetWorkerUrl()で明示的に指定する（詳細はarticle-notes参照）。
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const destDir = path.join(__dirname, "..", "public");

// maplibre-gl-worker.mjsは同ディレクトリのmaplibre-gl-shared.mjsを相対importするため両方必要
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(destDir, { recursive: true });
for (const file of files) {
  copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  console.log(`Copied ${file} to public/`);
}
