// 遊戲畫面：依階段渲染（ready / memorize / question / correct / wrong / gameover）
import { AnimatePresence, motion } from 'framer-motion'
import type { GameStore } from '../state/useGameStore'
import { REVIVES_PER_RUN, titleForLevel } from '../game/constants'
import { useI18n } from '../i18n'
import { Board } from '../components/Board'
import { QuestionPanel } from '../components/QuestionPanel'
import { Countdown } from '../components/Countdown'
import { TitleBadge } from '../components/TitleBadge'
import { TitleUpOverlay } from '../components/TitleUpOverlay'

function PauseIcon() {
  return (
    <span className="inline-flex items-center gap-[0.2em]">
      <span className="block h-[1em] w-[0.32em] rounded-[1px] bg-current" />
      <span className="block h-[1em] w-[0.32em] rounded-[1px] bg-current" />
    </span>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[1em] w-[1em]">
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TopBar({
  level,
  bestRound,
  revivesLeft,
  onReturnMenu,
  onPause,
}: {
  level: number
  bestRound: number
  revivesLeft: number
  onReturnMenu: () => void
  onPause: () => void
}) {
  const { t } = useI18n()
  const iconBtn = 'text-[1.65rem] text-white/55 transition active:scale-90 hover:text-neon-cyan'
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-3">
      {/* 控制列：暫停（左）｜主選單（右）；設定鈕獨立浮在畫面右上角，跟首頁位置/大小統一，故此列右側需留白避免重疊 */}
      <div className="flex items-center justify-between pr-14">
        <button type="button" onClick={onPause} aria-label={t('pause')} className={iconBtn}>
          <PauseIcon />
        </button>
        <button type="button" onClick={onReturnMenu} aria-label={t('menu')} className={iconBtn}>
          <HomeIcon />
        </button>
      </div>
      {/* 資訊列：關卡｜頭銜｜最佳 + 復活 */}
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex flex-col">
          <span className="font-[Orbitron] text-[10px] tracking-[0.2em] text-white/40">{t('level')}</span>
          <span className="font-[Orbitron] text-2xl font-bold text-neon-cyan text-glow">{level}</span>
        </div>
        <TitleBadge title={titleForLevel(level)} />
        <div className="flex flex-col items-end">
          <span className="font-[Orbitron] text-[10px] tracking-[0.2em] text-white/40">{t('best')}</span>
          <span className="font-[Orbitron] text-xl font-bold text-neon-cyan text-glow">{bestRound}</span>
          <span className="mt-0.5 text-base leading-tight" title={t('revive')}>
            {Array.from({ length: REVIVES_PER_RUN }, (_, i) => (
              <span key={i} className={i < revivesLeft ? 'text-neon-pink' : 'text-white/15'}>
                ♥
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  )
}

export function GameScreen({
  store,
  onOpenSettings,
  onReturnMenu,
  onPause,
}: {
  store: GameStore
  onOpenSettings: () => void
  onReturnMenu: () => void
  onPause: () => void
}) {
  const { t } = useI18n()
  const {
    phase,
    level,
    levelData,
    selectedIndex,
    revivesLeft,
    bestRound,
    justUnlockedTitle,
    remainingMs,
    phaseDurationMs,
  } = store
  const answered = phase === 'correct' || phase === 'wrong'

  return (
    <div className="relative flex flex-1 flex-col items-center gap-6 px-4 py-5">
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t('settings')}
        className="absolute right-5 top-5 text-[1.65rem] text-white/55 transition active:scale-90 hover:text-neon-cyan"
      >
        ⚙
      </button>
      <TopBar
        level={level}
        bestRound={bestRound}
        revivesLeft={revivesLeft}
        onReturnMenu={onReturnMenu}
        onPause={onPause}
      />

      <div className="flex w-full flex-1 flex-col items-center gap-6">
        {/* 倒數計時條固定在資訊列正下方,不隨後面內容（板子／題目）浮動,避免展示／作答兩階段位置跳動 */}
        {(phase === 'memorize' || phase === 'question') && (
          <Countdown remainingMs={remainingMs} durationMs={phaseDurationMs} />
        )}

        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-[Orbitron] text-sm tracking-[0.3em] text-white/50">
              {t('level')} {level}
            </span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-[Orbitron] text-4xl font-bold text-neon-cyan text-glow"
            >
              {t('ready')}
            </motion.span>
          </motion.div>
        )}

        {phase === 'memorize' && levelData && (
          <Board objects={levelData.objects} gridSize={5} revealInterval={levelData.revealInterval} animate />
        )}

        {(phase === 'question' || phase === 'correct' || phase === 'wrong') && levelData && (
          <QuestionPanel
            question={levelData.question}
            answered={answered}
            selectedIndex={selectedIndex}
            onAnswer={store.answer}
          />
        )}
      </div>

      {/* 頭銜升級儀式 */}
      <TitleUpOverlay title={justUnlockedTitle} visible={phase === 'ready' && justUnlockedTitle !== null} />

      {/* 答對閃示 */}
      <AnimatePresence>
        {phase === 'correct' && (
          <motion.div
            key="correct"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="text-8xl text-neon-green text-glow">✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 死亡面板：半透明深色全屏遮罩，內容垂直置中 */}
      <AnimatePresence>
        {phase === 'wrong' && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-bg/92 px-6 backdrop-blur-sm"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="font-[Orbitron] text-4xl font-black tracking-widest text-neon-red text-glow"
            >
              {t('gameOver')}
            </motion.span>
            <div className="flex w-full max-w-[320px] flex-col gap-3">
              {revivesLeft > 0 && (
                <button
                  type="button"
                  onClick={store.revive}
                  className="rounded-full border-2 border-neon-green py-3 font-[Orbitron] font-bold tracking-wide text-neon-green box-glow active:scale-95"
                >
                  ▶ {t('revive')}
                </button>
              )}
              <button
                type="button"
                onClick={store.endRun}
                className="rounded-full border-2 border-surface-border py-3 font-[Orbitron] font-bold tracking-wide text-white/70 active:scale-95"
              >
                {t('end')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 本局結算 */}
      <AnimatePresence>
        {phase === 'gameover' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-bg/95 px-6 text-center"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-[Orbitron] text-sm tracking-[0.3em] text-white/40">{t('reached')}</span>
              <span className="font-[Orbitron] text-7xl font-black text-neon-cyan text-glow">{level}</span>
              <TitleBadge title={titleForLevel(level)} className="mt-1" />
            </div>
            <span className="font-[Orbitron] text-xs tracking-[0.2em] text-white/40">
              {t('best')} · {bestRound}
            </span>
            <div className="flex w-full max-w-[320px] flex-col gap-3">
              <button
                type="button"
                onClick={store.start}
                className="rounded-full border-2 border-neon-cyan py-3 font-[Orbitron] font-bold tracking-widest text-neon-cyan box-glow active:scale-95"
              >
                {t('retry')}
              </button>
              <button
                type="button"
                onClick={store.goHome}
                className="rounded-full border-2 border-surface-border py-3 font-[Orbitron] font-bold tracking-wide text-white/70 active:scale-95"
              >
                {t('home')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
