// 首頁
import { AnimatePresence, motion } from 'framer-motion'
import type { Title } from '../game/types'
import { useI18n } from '../i18n'
import { TitleBadge } from '../components/TitleBadge'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

interface Props {
  bestRound: number
  title: Title
  onStart: () => void
  onOpenSettings: () => void
}

export function HomeScreen({ bestRound, title, onStart, onOpenSettings }: Props) {
  const { t } = useI18n()
  const { canInstall, install, dismiss } = useInstallPrompt()
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t('settings')}
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
        <p className="font-[Orbitron] text-xs tracking-[0.35em] text-white/40">MEMORY · PUZZLE</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="font-[Orbitron] text-base font-bold tracking-[0.25em] text-neon-cyan text-glow">{t('best')}</span>
        <span className="font-[Orbitron] text-8xl font-bold text-neon-cyan text-glow">{bestRound}</span>
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
        {t('start')}
      </motion.button>

      {/* A2HS 安裝橫幅：只在瀏覽器中、未安裝、未忽略時出現 */}
      <AnimatePresence>
        {canInstall && (
          <motion.div
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute bottom-6 left-3 right-3 flex items-center gap-3 rounded-2xl border border-surface-border bg-surface px-4 py-3 shadow-lg"
          >
            <span className="text-2xl leading-none">📲</span>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="font-[Orbitron] text-xs font-bold tracking-wide text-neon-cyan">
                {t('installTitle')}
              </span>
              <span className="truncate text-[11px] text-white/45">{t('installDesc')}</span>
            </div>
            <button
              type="button"
              onClick={install}
              className="shrink-0 rounded-full border border-neon-cyan px-3 py-1.5 font-[Orbitron] text-xs font-bold text-neon-cyan active:scale-95"
            >
              {t('install')}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="dismiss"
              className="shrink-0 text-base text-white/30 hover:text-white/60 active:scale-90"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
