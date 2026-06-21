// 頭銜徽章
import type { Title } from '../game/types'

interface Props {
  title: Title
  className?: string
}

export function TitleBadge({ title, className }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/70 px-3 py-1 text-sm font-semibold tracking-wide ${className ?? ''}`}
    >
      <span className="text-base leading-none">{title.emoji}</span>
      <span className="font-[Orbitron] uppercase">{title.tier}</span>
    </span>
  )
}
