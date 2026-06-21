// 設定彈窗
import { motion } from 'framer-motion'
import type { Settings } from '../state/useSettings'

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface/60 px-4 py-3"
    >
      <span className="font-[Orbitron] text-sm tracking-wide text-white/80">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          on ? 'bg-neon-cyan/30 text-neon-cyan box-glow-sm' : 'bg-surface-border'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
            on ? 'left-[22px] bg-neon-cyan' : 'left-0.5 bg-white/50'
          }`}
        />
      </span>
    </button>
  )
}

export function SettingsModal({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-surface-border bg-surface p-6"
      >
        <h2 className="text-center font-[Orbitron] text-lg font-bold tracking-widest text-neon-cyan text-glow">
          SETTINGS
        </h2>
        <Toggle
          label="SOUND FX"
          on={settings.sfxEnabled}
          onClick={() => settings.setSfxEnabled(!settings.sfxEnabled)}
        />
        <Toggle
          label="MUSIC"
          on={settings.musicEnabled}
          onClick={() => settings.setMusicEnabled(!settings.musicEnabled)}
        />
        <button
          type="button"
          onClick={onClose}
          className="mt-2 rounded-full border-2 border-surface-border py-2.5 font-[Orbitron] text-sm font-bold tracking-widest text-white/70 active:scale-95"
        >
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  )
}
