// 頭銜升級儀式：衝擊波 + 粒子爆炸 + emoji 彈入 + 金字標題
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { Title } from '../game/types'
import { useI18n } from '../i18n'

const NEON = ['#00ffff', '#bf5fff', '#ff6b35', '#ff2d78', '#39ff14', '#ffd23f']

interface ParticleProps {
  angle: number
  dist: number
  color: string
  delay: number
  size: number
}

function Particle({ angle, dist, color, delay, size }: ParticleProps) {
  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 0, opacity: 0 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: '50%',
        top: '42%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2.5}px ${color}`,
      }}
    />
  )
}

interface Props {
  title: Title | null
  visible: boolean
}

export function TitleUpOverlay({ title, visible }: Props) {
  const { t } = useI18n()

  const particles = useMemo<ParticleProps[]>(() => {
    const COUNT = 26
    return Array.from({ length: COUNT }, (_, i) => ({
      angle: (i / COUNT) * Math.PI * 2 + (i % 3 - 1) * 0.22,
      dist: 90 + (i % 4) * 38,
      color: NEON[i % NEON.length],
      delay: (i % 5) * 0.03,
      size: 5 + (i % 3) * 3,
    }))
  }, [])

  return (
    <AnimatePresence>
      {visible && title && (
        <motion.div
          key={`titleup-${title.tier}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/92"
        >
          {/* Shockwave ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.85 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 72,
              height: 72,
              left: 'calc(50% - 36px)',
              top: 'calc(42% - 36px)',
              border: '3px solid #ffd23f',
              boxShadow: '0 0 18px #ffd23f, inset 0 0 18px #ffd23f40',
            }}
          />

          {/* Particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((p, i) => (
              <Particle key={i} {...p} />
            ))}
          </div>

          {/* Emoji */}
          <motion.span
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: [0, 1.28, 1], rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.12 }}
            className="relative z-10 select-none text-[5.5rem] leading-none"
            style={{ filter: 'drop-shadow(0 0 18px #ffd23f) drop-shadow(0 0 40px #ffd23f80)' }}
          >
            {title.emoji}
          </motion.span>

          {/* Text block */}
          <motion.div
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.38 }}
            className="relative z-10 flex flex-col items-center gap-1"
          >
            <span
              className="font-[Orbitron] text-xs tracking-[0.45em] text-neon-gold"
              style={{ textShadow: '0 0 10px #ffd23f' }}
            >
              {t('newRank')}
            </span>
            <motion.span
              initial={{ opacity: 0, letterSpacing: '0.55em' }}
              animate={{ opacity: 1, letterSpacing: '0.12em' }}
              transition={{ delay: 0.52, duration: 0.45 }}
              className="font-[Orbitron] text-4xl font-black uppercase text-neon-gold"
              style={{ textShadow: '0 0 18px #ffd23f, 0 0 45px #ffd23f60' }}
            >
              {t(`title.${title.tier}`)}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
