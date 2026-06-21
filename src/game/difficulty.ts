// 難度曲線：依關卡回傳該關設定
import type { QuestionType } from './types'
import { randInt } from './rng'

export interface LevelConfig {
  /** 本關物件數量 */
  objectCount: number
  /** 場景展示秒數 */
  showSeconds: number
  /** 物件逐一出現的間隔（秒） */
  revealInterval: number
  /** 本關可用的問題類型 */
  questionTypes: QuestionType[]
  /** 是否使用「相似干擾」（近似色選項） */
  similarDistractors: boolean
  /** 是否使用「陷阱選項」（極高關卡） */
  trapOptions: boolean
}

interface Band {
  /** 此區間的關卡上限（含），最後一段用 Infinity */
  maxLevel: number
  count: [min: number, max: number]
  showSeconds: number
  questionTypes: QuestionType[]
  similarDistractors: boolean
  trapOptions: boolean
}

// 對應 GDD §3.1 難度參數表
const BANDS: Band[] = [
  { maxLevel: 5, count: [2, 3], showSeconds: 5, questionTypes: ['color', 'count'], similarDistractors: false, trapOptions: false },
  { maxLevel: 10, count: [3, 4], showSeconds: 4.5, questionTypes: ['color', 'count'], similarDistractors: false, trapOptions: false },
  { maxLevel: 20, count: [4, 5], showSeconds: 4, questionTypes: ['color', 'count', 'position', 'order'], similarDistractors: false, trapOptions: false },
  { maxLevel: 35, count: [5, 6], showSeconds: 3.5, questionTypes: ['color', 'count', 'position', 'order'], similarDistractors: true, trapOptions: false },
  { maxLevel: 50, count: [6, 7], showSeconds: 3, questionTypes: ['color', 'count', 'position', 'order'], similarDistractors: true, trapOptions: false },
  { maxLevel: 70, count: [7, 8], showSeconds: 2.5, questionTypes: ['color', 'count', 'position', 'order', 'absence'], similarDistractors: true, trapOptions: false },
  { maxLevel: 90, count: [8, 9], showSeconds: 2, questionTypes: ['color', 'count', 'position', 'order', 'absence'], similarDistractors: true, trapOptions: false },
  { maxLevel: Infinity, count: [9, 10], showSeconds: 2, questionTypes: ['color', 'count', 'position', 'order', 'absence'], similarDistractors: true, trapOptions: true },
]

export function getLevelConfig(level: number): LevelConfig {
  const band = BANDS.find((b) => level <= b.maxLevel) ?? BANDS[BANDS.length - 1]
  const [min, max] = band.count
  const objectCount = min + randInt(max - min + 1)
  // 讓所有物件在展示時間前半段內逐一出現完畢，其餘時間用於記憶
  const revealInterval = Math.min(0.4, (band.showSeconds * 0.5) / objectCount)
  return {
    objectCount,
    showSeconds: band.showSeconds,
    revealInterval,
    questionTypes: band.questionTypes,
    similarDistractors: band.similarDistractors,
    trapOptions: band.trapOptions,
  }
}
