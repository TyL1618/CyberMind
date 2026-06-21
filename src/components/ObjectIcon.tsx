// 物件圖示：把 ObjectKind 畫成發光 SVG（圖形用描邊、符號用填色）
import type { CSSProperties } from 'react'
import type { NeonColor, ObjectKind } from '../game/types'
import { NEON_COLOR_VAR } from '../game/constants'

interface Props {
  kind: ObjectKind
  /** 'neutral' 用於不可洩漏顏色的題目（例如顏色記憶題的提示） */
  color?: NeonColor | 'neutral'
  size?: number
  glow?: boolean
  className?: string
}

const STROKE = 8

function renderKind(kind: ObjectKind) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: STROKE,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  const fill = { fill: 'currentColor', stroke: 'none' }

  switch (kind) {
    // ── 圖形（描邊）──
    case 'circle':
      return <circle cx="50" cy="50" r="33" {...stroke} />
    case 'triangle':
      return <polygon points="50,15 85,80 15,80" {...stroke} />
    case 'square':
      return <rect x="17" y="17" width="66" height="66" rx="10" {...stroke} />
    case 'diamond':
      return <polygon points="50,12 88,50 50,88 12,50" {...stroke} />
    case 'hexagon':
      return <polygon points="30,18 70,18 90,50 70,82 30,82 10,50" {...stroke} />

    // ── 符號（填色）──
    case 'lightning':
      return <path d="M58 6 L26 56 H46 L42 94 L78 40 H56 Z" {...fill} />
    case 'star':
      return (
        <polygon
          points="50,12 59.4,39.1 88,39.6 65.2,56.9 73.5,84.4 50,68 26.5,84.4 34.8,56.9 12,39.6 40.6,39.1"
          {...fill}
        />
      )
    case 'heart':
      return (
        <path
          d="M50 82 C 20 58, 18 32, 36 28 C 45 26, 50 34, 50 38 C 50 34, 55 26, 64 28 C 82 32, 80 58, 50 82 Z"
          {...fill}
        />
      )
    case 'arrow':
      return (
        <g {...stroke}>
          <path d="M16 50 H78" />
          <path d="M58 30 L82 50 L58 70" fill="none" />
        </g>
      )
    case 'plus':
      return (
        <g stroke="currentColor" strokeWidth={16} strokeLinecap="round">
          <path d="M50 18 V82" />
          <path d="M18 50 H82" />
        </g>
      )
    case 'question':
      return (
        <text
          x="50"
          y="74"
          textAnchor="middle"
          fontSize="80"
          fontWeight={900}
          fontFamily="Orbitron, sans-serif"
          fill="currentColor"
        >
          ?
        </text>
      )
  }
}

export function ObjectIcon({ kind, color = 'neutral', size = 64, glow = true, className }: Props) {
  const cssColor = color === 'neutral' ? '#eef0ff' : NEON_COLOR_VAR[color]
  const style: CSSProperties = { color: cssColor }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={style}
      className={glow ? `icon-glow ${className ?? ''}` : className}
      aria-hidden="true"
    >
      {renderKind(kind)}
    </svg>
  )
}
