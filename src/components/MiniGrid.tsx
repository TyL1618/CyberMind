// 迷你盤面：位置記憶題的選項，標示某一格
import type { GridPos } from '../game/types'

interface Props {
  gridSize: number
  highlight: GridPos
  /** 整體邊長（px） */
  size?: number
}

export function MiniGrid({ gridSize, highlight, size = 96 }: Props) {
  const hi = highlight.row * gridSize + highlight.col
  return (
    <div
      className="grid gap-[3px]"
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: gridSize * gridSize }, (_, i) => {
        const on = i === hi
        return (
          <div
            key={i}
            className={
              on
                ? 'rounded-[3px] bg-neon-cyan text-neon-cyan box-glow-sm'
                : 'rounded-[3px] border border-surface-border/70 bg-bg-soft/50'
            }
          />
        )
      })}
    </div>
  )
}
