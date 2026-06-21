// 遊戲狀態機
//
// 流程：home → ready → memorize → question → correct / wrong
//   correct ──(0.9s)──▶ 下一關 ready
//   wrong   ──玩家選擇──▶ revive(同關重生) 或 gameover
import { useEffect, useReducer, useRef, useState } from 'react'
import type { Level, Phase, Title } from '../game/types'
import { ANSWER_SECONDS, READY_SECONDS, REVIVES_PER_RUN, titleForLevel } from '../game/constants'
import { generateLevel } from '../game/levelFactory'
import { loadBestRound, saveBestRound } from '../game/storage'
import { sfx } from '../audio/sfx'
import { setPlaying } from '../pwa'

interface State {
  phase: Phase
  level: number
  levelData: Level | null
  /** 玩家選擇的選項索引；-1 代表逾時未作答 */
  selectedIndex: number | null
  revivesLeft: number
  bestRound: number
  /** 本次進關若跨越頭銜門檻，記錄新頭銜（供升級動畫），否則 null */
  justUnlockedTitle: Title | null
}

type Action =
  | { type: 'START' }
  | { type: 'BEGIN_MEMORIZE' }
  | { type: 'BEGIN_QUESTION' }
  | { type: 'ANSWER'; index: number }
  | { type: 'NEXT' }
  | { type: 'REVIVE' }
  | { type: 'GAME_OVER' }
  | { type: 'GO_HOME' }

function initState(): State {
  return {
    phase: 'home',
    level: 1,
    levelData: null,
    selectedIndex: null,
    revivesLeft: REVIVES_PER_RUN,
    bestRound: loadBestRound(),
    justUnlockedTitle: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'ready',
        level: 1,
        levelData: generateLevel(1),
        selectedIndex: null,
        revivesLeft: REVIVES_PER_RUN,
        justUnlockedTitle: null,
      }

    case 'BEGIN_MEMORIZE':
      if (state.phase !== 'ready') return state
      return { ...state, phase: 'memorize' }

    case 'BEGIN_QUESTION':
      if (state.phase !== 'memorize') return state
      return { ...state, phase: 'question' }

    case 'ANSWER': {
      if (state.phase !== 'question' || !state.levelData) return state
      const correct = action.index === state.levelData.question.answerIndex
      if (correct) {
        return {
          ...state,
          phase: 'correct',
          selectedIndex: action.index,
          bestRound: Math.max(state.bestRound, state.level),
        }
      }
      return { ...state, phase: 'wrong', selectedIndex: action.index }
    }

    case 'NEXT': {
      if (state.phase !== 'correct') return state
      const nextLevel = state.level + 1
      const crossedTier = titleForLevel(nextLevel).tier !== titleForLevel(state.level).tier
      return {
        ...state,
        phase: 'ready',
        level: nextLevel,
        levelData: generateLevel(nextLevel),
        selectedIndex: null,
        justUnlockedTitle: crossedTier ? titleForLevel(nextLevel) : null,
      }
    }

    case 'REVIVE': {
      if (state.phase !== 'wrong' || state.revivesLeft <= 0) return state
      // 復活：同一關卡重新生成（避免直接重看到答案）
      return {
        ...state,
        phase: 'ready',
        levelData: generateLevel(state.level),
        selectedIndex: null,
        revivesLeft: state.revivesLeft - 1,
        justUnlockedTitle: null,
      }
    }

    case 'GAME_OVER':
      return { ...state, phase: 'gameover' }

    case 'GO_HOME':
      return { ...initState(), bestRound: state.bestRound }

    default:
      return state
  }
}

export interface GameStore extends State {
  /** 當前計時階段剩餘毫秒（供倒數 UI） */
  remainingMs: number
  /** 當前計時階段總長毫秒（供進度條比例） */
  phaseDurationMs: number
  paused: boolean
  setPaused: (v: boolean) => void
  start: () => void
  answer: (index: number) => void
  revive: () => void
  endRun: () => void
  goHome: () => void
}

export function useGameStore(): GameStore {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  // 倒數計時（setInterval 驅動，支援暫停：開設定時凍結）
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const [remainingMs, setRemainingMs] = useState(0)
  const [phaseDurationMs, setPhaseDurationMs] = useState(0)

  useEffect(() => {
    // 決定當前階段的計時長度與到期動作
    let duration = 0
    let onDone: Action | null = null
    if (state.phase === 'ready') {
      duration = READY_SECONDS * 1000
      onDone = { type: 'BEGIN_MEMORIZE' }
    } else if (state.phase === 'memorize' && state.levelData) {
      duration = state.levelData.showSeconds * 1000
      onDone = { type: 'BEGIN_QUESTION' }
    } else if (state.phase === 'question') {
      duration = ANSWER_SECONDS * 1000
      onDone = { type: 'ANSWER', index: -1 }
    } else if (state.phase === 'correct') {
      duration = 900
      onDone = { type: 'NEXT' }
    }

    if (!onDone) {
      setPhaseDurationMs(0)
      setRemainingMs(0)
      return
    }

    setPhaseDurationMs(duration)
    let remaining = duration
    setRemainingMs(remaining)
    // 用 setInterval（非 rAF）：100ms 一次,數字每秒變、進度條夠平滑,
    // 且不會像 rAF 持續佔用合成器（對截圖/省電友善）。依真實經過時間扣除,計時精準。
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = now - last
      last = now
      if (pausedRef.current) return // 暫停:不扣時間（last 已更新,回復後不會跳秒）
      remaining -= dt
      if (remaining <= 0) {
        setRemainingMs(0)
        clearInterval(id)
        dispatch(onDone!)
        return
      }
      setRemainingMs(remaining)
    }, 100)
    return () => clearInterval(id)
  }, [state.phase, state.levelData])

  // 通知 PWA 是否「遊玩中」：非首頁/結算 → 遊玩中,新版更新先 defer
  useEffect(() => {
    setPlaying(state.phase !== 'home' && state.phase !== 'gameover')
  }, [state.phase])

  // 持久化最高關卡
  useEffect(() => {
    saveBestRound(state.bestRound)
  }, [state.bestRound])

  // 階段音效（只在階段「改變」時觸發一次）
  const prevPhase = useRef<Phase>(state.phase)
  useEffect(() => {
    const prev = prevPhase.current
    prevPhase.current = state.phase
    if (state.phase === prev) return
    if (state.phase === 'correct') sfx.correct()
    else if (state.phase === 'wrong') sfx.wrong()
    else if (state.phase === 'ready' && state.justUnlockedTitle) sfx.titleUp()
  }, [state.phase, state.justUnlockedTitle])

  // 記憶階段播放環境音
  useEffect(() => {
    if (state.phase === 'memorize') sfx.startAmbient()
    else sfx.stopAmbient()
  }, [state.phase])

  return {
    ...state,
    remainingMs,
    phaseDurationMs,
    paused,
    setPaused,
    start: () => {
      sfx.ensure() // 使用者手勢，解鎖音訊
      dispatch({ type: 'START' })
    },
    answer: (index: number) => dispatch({ type: 'ANSWER', index }),
    revive: () => {
      sfx.revive()
      dispatch({ type: 'REVIVE' })
    },
    endRun: () => dispatch({ type: 'GAME_OVER' }),
    goHome: () => dispatch({ type: 'GO_HOME' }),
  }
}
