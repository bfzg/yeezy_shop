import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcHome = "/Users/imac/Desktop/截图/首页.png";
const srcDetail = "/Users/imac/Desktop/截图/商品预览详情.png";
const tmp = path.join(root, ".asset-tmp");
const out = path.join(root, "public", "products");

mkdirSync(tmp, { recursive: true });
mkdirSync(out, { recursive: true });

const crops = [
  ["sl-03.png", srcHome, 340, 650, 80, 300],
  ["pk-01.png", srcHome, 700, 760, 620, 210],
  ["jc-10.png", srcHome, 580, 620, 1480, 250],
  ["jc-11.png", srcHome, 600, 650, 2200, 280],
  ["sg-03.png", srcHome, 440, 360, 2940, 410],
  ["bp-02.png", srcHome, 520, 590, 3600, 290],
  ["pk-02.png", srcHome, 650, 730, 80, 990],
  ["wd-02.png", srcHome, 420, 760, 860, 980],
  ["sl-01.png", srcHome, 520, 330, 1500, 1200],
  ["ct-01.png", srcHome, 560, 760, 2180, 1000],
  ["bg-03.png", srcHome, 650, 470, 2860, 1140],
  ["ts-07.png", srcHome, 520, 520, 3560, 1070],
  ["pk-01-detail.png", srcDetail, 1080, 1180, 1550, 470],
  ["pk-01-alt.png", srcHome, 700, 760, 620, 210]
];

for (const [name, src, height, width, y, x] of crops) {
  const temp = path.join(tmp, name);
  copyFileSync(src, temp);
  execFileSync("sips", ["--cropToHeightWidth", String(height), String(width), "--cropOffset", String(y), String(x), temp], { stdio: "ignore" });
  execFileSync("sips", ["--padToHeightWidth", "900", "900", "--padColor", "FFFFFF", temp, "--out", path.join(out, name)], { stdio: "ignore" });
}

rmSync(tmp, { recursive: true, force: true });
console.log(`Created ${crops.length} product images in ${out}`);
