// 遊戲畫面：依階段渲染（ready / memorize / question / correct / wrong / gameover）
import { AnimatePresence, motion } from 'framer-motion'
import type { GameStore } from '../state/useGameStore'
import { ANSWER_SECONDS, REVIVES_PER_RUN, titleForLevel } from '../game/constants'
import { Board } from '../components/Board'
import { QuestionPanel } from '../components/QuestionPanel'
import { CountdownBar } from '../components/CountdownBar'
import { TitleBadge } from '../components/TitleBadge'

function Header({
  level,
  bestRound,
  revivesLeft,
}: {
  level: number
  bestRound: number
  revivesLeft: number
}) {
  return (
    <div className="flex w-full max-w-[440px] items-center justify-between text-sm">
      <div className="flex flex-col">
        <span className="font-[Orbitron] text-[10px] tracking-[0.2em] text-white/40">LEVEL</span>
        <span className="font-[Orbitron] text-2xl font-bold text-neon-cyan text-glow">{level}</span>
      </div>
      <TitleBadge title={titleForLevel(level)} />
      <div className="flex flex-col items-end">
        <span className="font-[Orbitron] text-[10px] tracking-[0.2em] text-white/40">BEST {bestRound}</span>
        <span className="text-base leading-tight" title="復活次數">
          {Array.from({ length: REVIVES_PER_RUN }, (_, i) => (
            <span key={i} className={i < revivesLeft ? 'text-neon-pink' : 'text-white/15'}>
              ♥
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}

export function GameScreen({ store }: { store: GameStore }) {
  const { phase, level, levelData, selectedIndex, revivesLeft, bestRound, justUnlockedTitle } = store
  const answered = phase === 'correct' || phase === 'wrong'

  return (
    <div className="relative flex min-h-full flex-col items-center gap-6 px-4 py-5">
      <Header level={level} bestRound={bestRound} revivesLeft={revivesLeft} />

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-[Orbitron] text-sm tracking-[0.3em] text-white/50">LEVEL {level}</span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-[Orbitron] text-4xl font-bold text-neon-cyan text-glow"
            >
              READY
            </motion.span>
          </motion.div>
        )}

        {phase === 'memorize' && levelData && (
          <Board
            objects={levelData.objects}
            gridSize={5}
            revealInterval={levelData.revealInterval}
            animate
          />
        )}

        {(phase === 'question' || phase === 'correct' || phase === 'wrong') && levelData && (
          <>
            <QuestionPanel
              question={levelData.question}
              answered={answered}
              selectedIndex={selectedIndex}
              onAnswer={store.answer}
            />
            {phase === 'question' && <CountdownBar seconds={ANSWER_SECONDS} runKey={level} />}
          </>
        )}
      </div>

      {/* 頭銜升級儀式 */}
      <AnimatePresence>
        {phase === 'ready' && justUnlockedTitle && (
          <motion.div
            key="titleup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg/85"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="text-8xl"
            >
              {justUnlockedTitle.emoji}
            </motion.span>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="font-[Orbitron] text-xs tracking-[0.4em] text-neon-gold">NEW RANK</span>
              <span className="font-[Orbitron] text-4xl font-black uppercase tracking-widest text-neon-gold text-glow">
                {justUnlockedTitle.tier}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 死亡面板 */}
      <AnimatePresence>
        {phase === 'wrong' && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 bg-gradient-to-t from-bg via-bg/95 to-transparent px-6 pb-8 pt-12"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="font-[Orbitron] text-3xl font-black tracking-widest text-neon-red text-glow"
            >
              GAME OVER
            </motion.span>
            <div className="flex w-full max-w-[440px] flex-col gap-3">
              {revivesLeft > 0 && (
                <button
                  type="button"
                  onClick={store.revive}
                  className="rounded-full border-2 border-neon-green py-3 font-[Orbitron] font-bold tracking-wide text-neon-green box-glow active:scale-95"
                >
                  ▶ REVIVE
                </button>
              )}
              <button
                type="button"
                onClick={store.endRun}
                className="rounded-full border-2 border-surface-border py-3 font-[Orbitron] font-bold tracking-wide text-white/70 active:scale-95"
              >
                END
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-bg/95 px-6 text-center"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-[Orbitron] text-sm tracking-[0.3em] text-white/40">REACHED</span>
              <span className="font-[Orbitron] text-7xl font-black text-neon-cyan text-glow">{level}</span>
              <TitleBadge title={titleForLevel(level)} className="mt-1" />
            </div>
            <span className="font-[Orbitron] text-xs tracking-[0.2em] text-white/40">
              BEST · {bestRound}
            </span>
            <div className="flex w-full max-w-[440px] flex-col gap-3">
              <button
                type="button"
                onClick={store.start}
                className="rounded-full border-2 border-neon-cyan py-3 font-[Orbitron] font-bold tracking-widest text-neon-cyan box-glow active:scale-95"
              >
                RETRY
              </button>
              <button
                type="button"
                onClick={store.goHome}
                className="rounded-full border-2 border-surface-border py-3 font-[Orbitron] font-bold tracking-wide text-white/70 active:scale-95"
              >
                HOME
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
