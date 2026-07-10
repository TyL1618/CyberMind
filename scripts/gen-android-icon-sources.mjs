// 產生 Capacitor Android 圖示來源（給 @capacitor/assets 用）
// 沿用 gen-icons.mjs 同一套 SVG 標誌設計，確保 Android 版圖示跟 PWA 版一致
// 執行：node scripts/gen-android-icon-sources.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources')
mkdirSync(outDir, { recursive: true })

const logo = (transform = '') => `
  <g ${transform ? `transform="${transform}"` : ''} filter="url(#glow)" fill="none"
     stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <rect x="112" y="112" width="288" height="288" rx="56" stroke="#00ffff" />
    <circle cx="192" cy="192" r="26" fill="#ff2d78" stroke="none" />
    <path d="M304 176 l40 32 -40 32" stroke="#39ff14" />
    <path d="M176 320 h160" stroke="#bf5fff" />
  </g>`

const defs = `
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>`

// 一般圖示（舊式 ic_launcher）：圓角深色底 + 標誌
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${defs}
  <rect width="512" height="512" rx="112" fill="#07060f" />
  ${logo()}
</svg>`

// Adaptive icon 前景：透明底，標誌縮進安全區（避免被系統遮罩裁到）
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${defs}
  ${logo('translate(90 90) scale(0.62)')}
</svg>`

// Adaptive icon 背景：純色底
const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#07060f" />
</svg>`

// Splash：深色品牌底 + 置中標誌（跟 index.html 內嵌 splash 用同一套深色底色）
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
  ${defs}
  <rect width="2732" height="2732" fill="#07060f" />
  <g transform="translate(1110 1110) scale(1)">${logo()}</g>
</svg>`

const targets = [
  { svg: iconSvg, file: 'icon.png', size: 1024 },
  { svg: foregroundSvg, file: 'icon-foreground.png', size: 1024 },
  { svg: backgroundSvg, file: 'icon-background.png', size: 1024 },
  { svg: splashSvg, file: 'splash.png', size: 2732 },
]

for (const { svg, file, size } of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, file))
  console.log('wrote', file)
}
