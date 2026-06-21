// 設定彈窗（首頁與遊戲中共用，內容一致）
import { motion } from 'framer-motion'
import type { Settings } from '../state/useSettings'
import { LANGS, useI18n } from '../i18n'

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

export function SettingsModal({
  settings,
  onClose,
  inGame = false,
  onReturnHome,
}: {
  settings: Settings
  onClose: () => void
  /** 是否在遊戲中開啟（顯示「返回主選單」） */
  inGame?: boolean
  onReturnHome?: () => void
}) {
  const { t, lang, setLang } = useI18n()
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
          {t('settings')}
        </h2>

        {/* 語言切換 */}
        <div className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface/60 px-4 py-3">
          <span className="font-[Orbitron] text-sm tracking-wide text-white/80">{t('language')}</span>
          <div className="flex gap-1.5">
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLang(l.value)}
                className={`rounded-lg px-3 py-1 font-[Orbitron] text-xs font-bold tracking-wide transition ${
                  lang === l.value
                    ? 'border border-neon-cyan text-neon-cyan box-glow-sm'
                    : 'border border-surface-border text-white/50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          label={t('soundFx')}
          on={settings.sfxEnabled}
          onClick={() => settings.setSfxEnabled(!settings.sfxEnabled)}
        />
        <Toggle
          label={t('music')}
          on={settings.musicEnabled}
          onClick={() => settings.setMusicEnabled(!settings.musicEnabled)}
        />

        {inGame && onReturnHome && (
          <button
            type="button"
            onClick={onReturnHome}
            className="rounded-full border-2 border-neon-pink py-2.5 font-[Orbitron] text-sm font-bold tracking-wide text-neon-pink box-glow active:scale-95"
          >
            {t('returnToMenu')}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-1 rounded-full border-2 border-surface-border py-2.5 font-[Orbitron] text-sm font-bold tracking-widest text-white/70 active:scale-95"
        >
          {t('close')}
        </button>
      </motion.div>
    </motion.div>
  )
}
