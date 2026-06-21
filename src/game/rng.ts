// 隨機工具

/** [0, maxExclusive) 的整數 */
export function randInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive)
}

/** 隨機取一個元素 */
export function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)]
}

/** Fisher–Yates 原地洗牌（回傳同一陣列） */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 從陣列中無重複取 n 個 */
export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle([...arr]).slice(0, n)
}
