// 問題生成：依場景與難度設定產生一道題目
//
// 每個 builder 會檢查「本場景能否生成此類型」，無法生成則回傳 null，
// 由主流程依序嘗試，確保一定能產出合法題目。
import type {
  GameObject,
  GridPos,
  NeonColor,
  ObjectDescriptor,
  ObjectKind,
  Question,
  QuestionType,
} from './types'
import { NEON_COLORS } from './types'
import { ALL_KINDS, GRID_SIZE } from './constants'
import { pick, randInt, shuffle } from './rng'
import type { LevelConfig } from './difficulty'

// 近似色（用於相似干擾）
const SIMILAR_COLOR: Record<NeonColor, NeonColor[]> = {
  cyan: ['green'],
  green: ['cyan'],
  purple: ['pink'],
  pink: ['purple', 'orange'],
  orange: ['pink'],
}

// ── 小工具 ───────────────────────────────────────────
function descKey(d: ObjectDescriptor): string {
  return `${d.kind}|${d.color}`
}

function cellKey(p: GridPos): number {
  return p.row * GRID_SIZE + p.col
}

/** 只出現一次的物件（種類在場景中唯一） */
function uniqueKindObjects(objs: GameObject[]): GameObject[] {
  const counts = new Map<ObjectKind, number>()
  for (const o of objs) counts.set(o.kind, (counts.get(o.kind) ?? 0) + 1)
  return objs.filter((o) => counts.get(o.kind) === 1)
}

/** 把正解與干擾項洗牌成選項，回傳選項與正解索引（依參考相等性定位） */
function placeAnswer<T>(answer: T, distractors: T[]): { options: T[]; answerIndex: number } {
  const options = shuffle([answer, ...distractors])
  return { options, answerIndex: options.indexOf(answer) }
}

/** 挑顏色干擾項；similar=true 時優先放入近似色 */
function pickColorDistractors(answer: NeonColor, n: number, similar: boolean): NeonColor[] {
  const others = NEON_COLORS.filter((c) => c !== answer)
  if (!similar) return shuffle(others).slice(0, n)
  const sim = (SIMILAR_COLOR[answer] ?? []).filter((c) => c !== answer)
  const rest = shuffle(others.filter((c) => !sim.includes(c)))
  return [...sim, ...rest].slice(0, n)
}

/** 取 n 個與 answer 不同的物件描述（優先取自場景，不足則隨機捏造） */
function descriptorDistractors(
  answer: ObjectDescriptor,
  objs: GameObject[],
  n: number,
): ObjectDescriptor[] | null {
  const seen = new Set([descKey(answer)])
  const result: ObjectDescriptor[] = []
  for (const o of shuffle([...objs])) {
    const d: ObjectDescriptor = { kind: o.kind, color: o.color }
    const k = descKey(d)
    if (seen.has(k)) continue
    seen.add(k)
    result.push(d)
    if (result.length === n) return result
  }
  let guard = 0
  while (result.length < n && guard++ < 200) {
    const d: ObjectDescriptor = { kind: pick(ALL_KINDS), color: pick(NEON_COLORS) }
    const k = descKey(d)
    if (seen.has(k)) continue
    seen.add(k)
    result.push(d)
  }
  return result.length === n ? result : null
}

// ── 各題型 builder ───────────────────────────────────

function makeColor(objs: GameObject[], cfg: LevelConfig): Question | null {
  const uniq = uniqueKindObjects(objs)
  if (!uniq.length) return null
  const target = pick(uniq)
  const distractors = pickColorDistractors(target.color, 3, cfg.similarDistractors)
  const { options, answerIndex } = placeAnswer(target.color, distractors)
  return {
    type: 'color',
    target: { kind: target.kind, color: target.color },
    options,
    answerIndex,
  }
}

function makePosition(objs: GameObject[]): Question | null {
  const uniq = uniqueKindObjects(objs)
  if (!uniq.length) return null
  const target = pick(uniq)
  const answer = target.pos
  const answerKey = cellKey(answer)

  // 干擾格：優先用其他物件所在的格子（較容易混淆），再補隨機空格
  const otherObjectCells = objs.filter((o) => o !== target).map((o) => o.pos)
  const allCells: GridPos[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) allCells.push({ row: r, col: c })
  }
  const pool = [...otherObjectCells, ...shuffle(allCells)]

  const seen = new Set<number>([answerKey])
  const distractors: GridPos[] = []
  for (const p of pool) {
    const k = cellKey(p)
    if (seen.has(k)) continue
    seen.add(k)
    distractors.push(p)
    if (distractors.length === 3) break
  }
  if (distractors.length < 3) return null

  const { options, answerIndex } = placeAnswer(answer, distractors)
  return {
    type: 'position',
    target: { kind: target.kind, color: target.color },
    gridSize: GRID_SIZE,
    options,
    answerIndex,
  }
}

function makeOrder(objs: GameObject[]): Question | null {
  if (objs.length < 2) return null
  const byOrder = [...objs].sort((a, b) => a.order - b.order)
  const idx = randInt(byOrder.length)
  const target = byOrder[idx]
  const answer: ObjectDescriptor = { kind: target.kind, color: target.color }
  const distractors = descriptorDistractors(answer, objs, 3)
  if (!distractors) return null
  const { options, answerIndex } = placeAnswer(answer, distractors)
  return { type: 'order', ordinal: idx + 1, options, answerIndex }
}

function makeCount(objs: GameObject[]): Question | null {
  const counts = new Map<ObjectKind, number>()
  for (const o of objs) counts.set(o.kind, (counts.get(o.kind) ?? 0) + 1)
  const kinds = [...counts.keys()]
  if (!kinds.length) return null
  const target = pick(kinds)
  const answer = counts.get(target)!
  const max = objs.length

  const distractors: number[] = []
  const candidates = shuffle(
    [answer - 2, answer - 1, answer + 1, answer + 2].filter((v) => v >= 1 && v <= max + 2 && v !== answer),
  )
  for (const v of candidates) {
    if (distractors.length === 3) break
    if (!distractors.includes(v)) distractors.push(v)
  }
  let guard = 0
  while (distractors.length < 3 && guard++ < 50) {
    const v = 1 + randInt(max + 2)
    if (v !== answer && !distractors.includes(v)) distractors.push(v)
  }
  if (distractors.length < 3) return null

  const { options, answerIndex } = placeAnswer(answer, distractors)
  return { type: 'count', target, options, answerIndex }
}

function makeAbsence(objs: GameObject[], cfg: LevelConfig): Question | null {
  if (objs.length < 3) return null

  const presentKeys = new Set(objs.map((o) => descKey({ kind: o.kind, color: o.color })))
  const presentKinds = new Set(objs.map((o) => o.kind))

  let answer: ObjectDescriptor | null = null

  // 陷阱模式：優先用「出現過的種類、但顏色沒出現過」當答案（最易誤判）
  if (cfg.trapOptions && Math.random() < 0.5) {
    const kindList = shuffle([...presentKinds])
    for (const kind of kindList) {
      const usedColors = new Set(objs.filter((o) => o.kind === kind).map((o) => o.color))
      const freeColors = NEON_COLORS.filter((c) => !usedColors.has(c))
      if (freeColors.length) {
        answer = { kind, color: pick(freeColors) }
        break
      }
    }
  }

  // 一般情況：優先用完全沒出現的種類
  if (!answer) {
    const absentKinds = ALL_KINDS.filter((k) => !presentKinds.has(k))
    if (absentKinds.length) {
      answer = { kind: pick(absentKinds), color: pick(NEON_COLORS) }
    }
  }

  // 後備：任意一個沒出現過的描述
  if (!answer) {
    let guard = 0
    while (guard++ < 300) {
      const d: ObjectDescriptor = { kind: pick(ALL_KINDS), color: pick(NEON_COLORS) }
      if (!presentKeys.has(descKey(d))) {
        answer = d
        break
      }
    }
  }
  if (!answer) return null

  // 三個「有出現過」的干擾項（互異）
  const seen = new Set<string>()
  const present: ObjectDescriptor[] = []
  for (const o of shuffle([...objs])) {
    const d: ObjectDescriptor = { kind: o.kind, color: o.color }
    const k = descKey(d)
    if (seen.has(k)) continue
    seen.add(k)
    present.push(d)
    if (present.length === 3) break
  }
  if (present.length < 3) return null

  const { options, answerIndex } = placeAnswer(answer, present)
  return { type: 'absence', options, answerIndex }
}

// ── 主流程 ───────────────────────────────────────────
export function generateQuestion(objs: GameObject[], cfg: LevelConfig): Question {
  const build = (t: QuestionType): Question | null => {
    switch (t) {
      case 'color':
        return makeColor(objs, cfg)
      case 'position':
        return makePosition(objs)
      case 'order':
        return makeOrder(objs)
      case 'count':
        return makeCount(objs)
      case 'absence':
        return makeAbsence(objs, cfg)
    }
  }

  for (const t of shuffle([...cfg.questionTypes])) {
    const q = build(t)
    if (q) return q
  }

  // 後備：count / color 幾乎一定能生成
  return makeCount(objs) ?? makeColor(objs, cfg) ?? makeOrder(objs)!
}
