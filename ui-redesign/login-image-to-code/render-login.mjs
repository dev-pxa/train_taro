import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const page = `file://${resolve("index.html")}`;

for (const [name, width, height, modalOpen] of [
  ["render-750", 750, 1385, false],
  ["render-375", 375, 693, false],
  ["render-390", 390, 721, false],
  ["render-modal-750", 750, 1385, true],
  ["render-modal-375", 375, 693, true]
]) {
  const output = resolve("qa", `${name}.png`);
  const rawOutput = width < 500 ? resolve("qa", `${name}-raw.png`) : output;
  const renderWidth = Math.max(500, width);
  const query = new URLSearchParams();
  if (width < 500) query.set("qaWidth", String(width));
  if (modalOpen) query.set("modal", "1");
  const renderPage = query.size ? `${page}?${query}` : page;
  const result = spawnSync(chrome, [
    "--headless=new",
    "--hide-scrollbars",
    "--disable-gpu",
    "--no-sandbox",
    `--window-size=${renderWidth},${height}`,
    `--screenshot=${rawOutput}`,
    renderPage
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  if (width < 500) {
    const crop = spawnSync("/opt/homebrew/bin/ffmpeg", [
      "-y", "-i", rawOutput,
      "-vf", `crop=${width}:${height}:0:0`,
      "-frames:v", "1", "-update", "1", output
    ], { encoding: "utf8" });
    if (crop.status !== 0) {
      console.error(crop.stderr || crop.stdout);
      process.exit(crop.status || 1);
    }
  }
  console.log(`${name}: ${output}`);
}
