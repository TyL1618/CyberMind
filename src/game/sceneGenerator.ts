// 場景生成：在 5×5 盤面上放置物件
import type { GameObject, GridPos } from './types'
import { NEON_COLORS } from './types'
import { ALL_KINDS, GRID_SIZE, categoryOf } from './constants'
import { pick, sample, shuffle } from './rng'

let idCounter = 0

export function generateScene(objectCount: number): GameObject[] {
  // 1) 取不重複的格子
  const cells: GridPos[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) cells.push({ row: r, col: c })
  }
  const chosenCells = sample(cells, objectCount)

  // 2) 決定種類。多數情況種類互異，但有機率讓某一種重複出現，
  //    以便產生有意義的「數量記憶」題目。
  const wantDuplicate = objectCount >= 3 && Math.random() < 0.6
  const distinctNeeded = wantDuplicate ? objectCount - 1 : objectCount
  const base = sample(ALL_KINDS, Math.min(distinctNeeded, ALL_KINDS.length))
  const kinds = [...base]
  while (kinds.length < objectCount) kinds.push(pick(base))
  shuffle(kinds)

  // 3) 決定逐一出現的順序（0-based，互異）
  const orders = shuffle(chosenCells.map((_, i) => i))

  return chosenCells.map((pos, i) => {
    const kind = kinds[i]
    return {
      id: `obj_${idCounter++}`,
      kind,
      category: categoryOf(kind),
      color: pick(NEON_COLORS),
      pos,
      order: orders[i],
    }
  })
}
