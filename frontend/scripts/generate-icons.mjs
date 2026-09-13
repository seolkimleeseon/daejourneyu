// 앱 아이콘(발바닥 마크) SVG를 PWA/Apple 홈 화면용 PNG로 래스터화한다.
// app/icon.svg 를 단일 소스로 삼아 실행: `node scripts/generate-icons.mjs`
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = dirname(fileURLToPath(import.meta.url)) + "/..";
const svgPath = join(rootDir, "app/icon.svg");
const svg = readFileSync(svgPath);

const targets = [
  { out: "public/icons/icon-192.png", size: 192 },
  { out: "public/icons/icon-512.png", size: 512 },
  { out: "app/apple-icon.png", size: 180 },
];

mkdirSync(join(rootDir, "public/icons"), { recursive: true });

for (const target of targets) {
  const outPath = join(rootDir, target.out);
  await sharp(svg, { density: 384 })
    .resize(target.size, target.size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${target.out} (${target.size}x${target.size})`);
}
