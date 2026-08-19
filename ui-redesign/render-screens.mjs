import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const html = resolve(__dirname, "index.html");
const outDir = resolve(__dirname, "screens");

const screens = [
  ["login", "01-login"],
  ["home", "02-home"],
  ["course-list", "03-course-list"],
  ["player", "04-player"],
  ["exam-list", "05-exam-list"],
  ["exam-start", "06-exam-start"],
  ["exam", "07-exam"],
  ["exam-fill", "08-exam-fill"],
  ["exam-result", "09-exam-result"],
  ["exam-result-failed", "10-exam-result-failed"],
  ["certificate", "11-certificate"],
  ["product-guide", "12-product-guide"],
  ["product-detail", "13-product-detail"],
  ["profile", "14-profile"],
  ["dev-debug", "15-dev-debug"],
  ["error", "16-error"]
];

mkdirSync(outDir, { recursive: true });

for (const [screen, name] of screens) {
  const out = resolve(outDir, `${name}.png`);
  const url = `${pathToFileURL(html).href}?screen=${screen}`;
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--window-size=375,812",
    `--screenshot=${out}`,
    url
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }

  console.log(out);
}
