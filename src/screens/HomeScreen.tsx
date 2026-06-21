// 首頁
import { motion } from 'framer-motion'
import type { Title } from '../game/types'
import { TitleBadge } from '../components/TitleBadge'

interface Props {
  bestRound: number
  title: Title
  onStart: () => void
  onOpenSettings: () => void
}

export function HomeScreen({ bestRound, title, onStart, onOpenSettings }: Props) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-10 px-6 text-center">
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="設定"
        className="absolute right-5 top-5 text-2xl text-white/50 transition active:scale-90 hover:text-neon-cyan"
      >
        ⚙
      </button>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-3"
      >
        <h1 className="font-[Orbitron] text-5xl font-black tracking-tight text-neon-cyan text-glow sm:text-6xl">
          CYBER
          <span className="text-neon-pink">MIND</span>
        </h1>
        <p className="font-[Orbitron] text-xs tracking-[0.35em] text-white/40">MEMORY · NEON · PUZZLE</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="font-[Orbitron] text-xs tracking-[0.25em] text-white/40">BEST</span>
        <span className="font-[Orbitron] text-7xl font-bold text-white text-glow">{bestRound}</span>
        {bestRound > 0 && <TitleBadge title={title} />}
      </motion.div>

      <motion.button
        type="button"
        onClick={onStart}
        whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-full border-2 border-neon-cyan px-12 py-4 font-[Orbitron] text-lg font-bold tracking-widest text-neon-cyan box-glow active:scale-95"
      >
        START
      </motion.button>
    </div>
  )
}
