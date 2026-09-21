// 校验 dist 产物完整性：文件存在、非空、版本占位一致
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["dist/chart-runtime.v1.js", "dist/charts.v1.css", "dist/themes.v1.json"];

let failed = false;
for (const f of files) {
  const p = join(root, f);
  try {
    const size = statSync(p).size;
    if (size === 0) throw new Error("empty file");
    console.log(`ok  ${f} (${size} bytes)`);
  } catch (e) {
    console.error(`FAIL ${f}: ${e.message}`);
    failed = true;
  }
}

const runtime = readFileSync(join(root, "dist/chart-runtime.v1.js"), "utf8");
if (!runtime.includes("ChartsSkill")) {
  console.error("FAIL chart-runtime.v1.js: missing ChartsSkill global");
  failed = true;
}

const themes = JSON.parse(readFileSync(join(root, "dist/themes.v1.json"), "utf8"));
if (!themes.themes || !themes.themes[themes.defaultTheme] || !themes.shared["chart-series-1"]) {
  console.error("FAIL themes.v1.json: missing defaultTheme entry or chart-series tokens");
  failed = true;
}

if (failed) process.exit(1);
console.log("all checks passed");
