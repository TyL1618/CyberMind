// 盤面：在 N×N 格子上顯示物件，可選逐一進場動畫
import { motion } from 'framer-motion'
import type { GameObject } from '../game/types'
import { ObjectIcon } from './ObjectIcon'

interface Props {
  objects: GameObject[]
  gridSize: number
  /** 逐一出現間隔（秒）；0 代表同時顯示 */
  revealInterval?: number
  /** 是否播放進場動畫 */
  animate?: boolean
}

export function Board({ objects, gridSize, revealInterval = 0, animate = true }: Props) {
  const byCell = new Map<number, GameObject>()
  for (const o of objects) byCell.set(o.pos.row * gridSize + o.pos.col, o)

  return (
    <div
      className="grid w-full max-w-[440px] aspect-square gap-2 rounded-2xl bg-surface/40 p-3"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        // 同時固定行高,讓每格都是完美正方形(否則空格被內容撐成不等高)
        gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: gridSize * gridSize }, (_, i) => {
        const obj = byCell.get(i)
        return (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg border-2 border-white/20 bg-bg-soft/40"
          >
            {obj && (
              <motion.div
                className="flex h-full w-full items-center justify-center p-1"
                initial={animate ? { opacity: 0, scale: 0.3 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: animate ? obj.order * revealInterval : 0,
                  type: 'spring',
                  stiffness: 320,
                  damping: 20,
                }}
              >
                <ObjectIcon kind={obj.kind} color={obj.color} size={64} className="h-[78%] w-[78%]" />
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
