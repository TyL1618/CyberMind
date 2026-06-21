// 遊戲狀態機
//
// 流程：home → ready → memorize → question → correct / wrong
//   correct ──(0.9s)──▶ 下一關 ready
//   wrong   ──玩家選擇──▶ revive(同關重生) 或 gameover
import { useEffect, useReducer, useRef } from 'react'
import type { Level, Phase, Title } from '../game/types'
import { ANSWER_SECONDS, READY_SECONDS, REVIVES_PER_RUN, titleForLevel } from '../game/constants'
import { generateLevel } from '../game/levelFactory'
import { loadBestRound, saveBestRound } from '../game/storage'
import { sfx } from '../audio/sfx'

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
  start: () => void
  answer: (index: number) => void
  revive: () => void
  endRun: () => void
  goHome: () => void
}

export function useGameStore(): GameStore {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  // 階段計時器
  useEffect(() => {
    if (state.phase === 'ready') {
      const t = setTimeout(() => dispatch({ type: 'BEGIN_MEMORIZE' }), READY_SECONDS * 1000)
      return () => clearTimeout(t)
    }
    if (state.phase === 'memorize' && state.levelData) {
      const t = setTimeout(() => dispatch({ type: 'BEGIN_QUESTION' }), state.levelData.showSeconds * 1000)
      return () => clearTimeout(t)
    }
    if (state.phase === 'question') {
      const t = setTimeout(() => dispatch({ type: 'ANSWER', index: -1 }), ANSWER_SECONDS * 1000)
      return () => clearTimeout(t)
    }
    if (state.phase === 'correct') {
      const t = setTimeout(() => dispatch({ type: 'NEXT' }), 900)
      return () => clearTimeout(t)
    }
  }, [state.phase, state.levelData])

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
