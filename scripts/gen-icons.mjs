// 產生 PWA 圖示（從內嵌 SVG 用 sharp 轉 PNG）
// 執行：node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// 標誌本體（512 座標系），可套用 transform 以調整安全區
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

// 一般圖示：圓角深色底
const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${defs}
  <rect width="512" height="512" rx="112" fill="#07060f" />
  ${logo()}
</svg>`

// maskable：填滿方形底，標誌縮入安全區（約 78%）
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${defs}
  <rect width="512" height="512" fill="#07060f" />
  ${logo('translate(56 56) scale(0.78)')}
</svg>`

const targets = [
  { svg: anySvg, size: 192, file: 'pwa-192x192.png' },
  { svg: anySvg, size: 512, file: 'pwa-512x512.png' },
  { svg: maskableSvg, size: 512, file: 'maskable-512x512.png' },
  { svg: anySvg, size: 180, file: 'apple-touch-icon.png' },
]

for (const { svg, size, file } of targets) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, file))
  console.log('wrote', file, size)
}
