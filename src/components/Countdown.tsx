// 倒數計時：中央大數字 + 進度條；越接近 0 顏色由青→黃→紅警戒
// 由 useGameStore 的 rAF 計時驅動（remainingMs / phaseDurationMs），可隨暫停凍結。

interface Props {
  remainingMs: number
  durationMs: number
}

export function Countdown({ remainingMs, durationMs }: Props) {
  const frac = durationMs > 0 ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0
  const secs = Math.max(0, Math.ceil(remainingMs / 1000))
  // hue 180(青) → 0(紅)，剩餘越少越紅
  const color = `hsl(${frac * 180}, 100%, 55%)`

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center gap-2">
      <span
        className="font-[Orbitron] text-5xl font-black tabular-nums leading-none"
        style={{ color, textShadow: `0 0 10px ${color}, 0 0 26px ${color}` }}
      >
        {secs}
      </span>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full"
          style={{ width: `${frac * 100}%`, background: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  )
}
