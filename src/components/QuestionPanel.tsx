// 問題面板：依題型用圖示渲染提示與四個選項
import type { ReactNode } from 'react'
import type { Question } from '../game/types'
import { NEON_COLOR_VAR } from '../game/constants'
import { useI18n } from '../i18n'
import { ObjectIcon } from './ObjectIcon'
import { MiniGrid } from './MiniGrid'

interface Props {
  question: Question
  answered: boolean
  selectedIndex: number | null
  onAnswer: (index: number) => void
}

function Prompt({ question }: { question: Question }) {
  const { t } = useI18n()
  let visual: ReactNode = null
  switch (question.type) {
    case 'color':
      // 中性色顯示，避免洩漏答案
      visual = (
        <div className="flex items-center gap-3">
          <ObjectIcon kind={question.target.kind} color="neutral" size={72} />
          <span className="font-[Orbitron] text-5xl text-neon-cyan text-glow">?</span>
        </div>
      )
      break
    case 'position':
      visual = (
        <div className="flex items-center gap-3">
          <ObjectIcon kind={question.target.kind} color={question.target.color} size={72} />
          <span className="text-4xl">📍</span>
        </div>
      )
      break
    case 'count':
      visual = (
        <div className="flex items-center gap-3">
          <ObjectIcon kind={question.target} color="neutral" size={72} />
          <span className="font-[Orbitron] text-4xl text-neon-cyan text-glow">× ?</span>
        </div>
      )
      break
    case 'order':
      visual = (
        <span className="font-[Orbitron] text-6xl text-neon-purple text-glow">#{question.ordinal}</span>
      )
      break
    case 'absence':
      visual = <span className="text-6xl text-neon-red text-glow">✕</span>
      break
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex min-h-[80px] items-center justify-center">{visual}</div>
      <span className="font-[Orbitron] text-base tracking-[0.15em] text-white/70">
        {t(`prompt.${question.type}`)}
      </span>
    </div>
  )
}

function OptionButton({
  answered,
  isAnswer,
  isSelected,
  onClick,
  children,
}: {
  answered: boolean
  isAnswer: boolean
  isSelected: boolean
  onClick: () => void
  children: ReactNode
}) {
  let stateCls = 'border-surface-border bg-surface/60 hover:border-neon-cyan/60'
  if (answered) {
    if (isAnswer) stateCls = 'border-neon-green text-neon-green box-glow bg-surface/60'
    else if (isSelected) stateCls = 'border-neon-red text-neon-red box-glow bg-surface/60'
    else stateCls = 'border-surface-border bg-surface/30 opacity-40'
  }
  return (
    <button
      type="button"
      disabled={answered}
      onClick={onClick}
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 p-3 transition active:scale-95 ${stateCls}`}
    >
      {children}
    </button>
  )
}

function OptionContent({ question, index }: { question: Question; index: number }) {
  switch (question.type) {
    case 'color': {
      // 整格填滿霓虹色（比圓圈直觀，不會被誤認為「選圓形」）
      const c = question.options[index]
      return (
        <div
          className="absolute inset-0 box-glow"
          style={{ background: NEON_COLOR_VAR[c], color: NEON_COLOR_VAR[c] }}
        />
      )
    }
    case 'position':
      return <MiniGrid gridSize={question.gridSize} highlight={question.options[index]} size={120} />
    case 'count':
      return <span className="font-[Orbitron] text-5xl font-bold">{question.options[index]}</span>
    case 'order':
    case 'absence': {
      const d = question.options[index]
      return <ObjectIcon kind={d.kind} color={d.color} size={72} />
    }
  }
}

export function QuestionPanel({ question, answered, selectedIndex, onAnswer }: Props) {
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-5">
      <Prompt question={question} />
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((_, i) => (
          <OptionButton
            key={i}
            answered={answered}
            isAnswer={i === question.answerIndex}
            isSelected={i === selectedIndex}
            onClick={() => onAnswer(i)}
          >
            <OptionContent question={question} index={i} />
          </OptionButton>
        ))}
      </div>
    </div>
  )
}
