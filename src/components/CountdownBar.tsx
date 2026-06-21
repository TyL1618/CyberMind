// 作答倒數條（視覺）：由滿格在 seconds 秒內遞減為 0
import { motion } from 'framer-motion'

interface Props {
  seconds: number
  /** 用於重置動畫（換題時改變即可重跑） */
  runKey: string | number
}

export function CountdownBar({ seconds, runKey }: Props) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
      <motion.div
        key={runKey}
        className="h-full rounded-full text-neon-cyan box-glow-sm"
        style={{ background: 'linear-gradient(90deg, var(--color-neon-pink), var(--color-neon-cyan))' }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: seconds, ease: 'linear' }}
      />
    </div>
  )
}
