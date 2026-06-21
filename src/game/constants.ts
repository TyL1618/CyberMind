// CyberMind — 遊戲常數
import type { NeonColor, ObjectCategory, ObjectKind, Title } from './types'
import { SHAPES, SYMBOLS } from './types'

/** 盤面尺寸（5×5） */
export const GRID_SIZE = 5

/** 作答限時（秒） */
export const ANSWER_SECONDS = 10

/** 開始前 Ready 倒數（秒） */
export const READY_SECONDS = 1

/** 每局可復活次數 */
export const REVIVES_PER_RUN = 1

/** NeonColor → CSS 變數（供 inline style 使用） */
export const NEON_COLOR_VAR: Record<NeonColor, string> = {
  cyan: 'var(--color-neon-cyan)',
  purple: 'var(--color-neon-purple)',
  orange: 'var(--color-neon-orange)',
  pink: 'var(--color-neon-pink)',
  green: 'var(--color-neon-green)',
}

/** NeonColor → 實際 hex（供 SVG / canvas 需要時使用） */
export const NEON_COLOR_HEX: Record<NeonColor, string> = {
  cyan: '#00ffff',
  purple: '#bf5fff',
  orange: '#ff6b35',
  pink: '#ff2d78',
  green: '#39ff14',
}

/** 物件種類 → 類別 */
export function categoryOf(kind: ObjectKind): ObjectCategory {
  return (SHAPES as readonly string[]).includes(kind) ? 'shape' : 'symbol'
}

/** 所有可用物件種類 */
export const ALL_KINDS: readonly ObjectKind[] = [...SHAPES, ...SYMBOLS]

/** 頭銜分級（依關卡遞增） */
export const TITLES: Title[] = [
  { tier: 'Bronze', emoji: '🥉', minLevel: 1 },
  { tier: 'Silver', emoji: '🥈', minLevel: 11 },
  { tier: 'Gold', emoji: '🥇', minLevel: 21 },
  { tier: 'Platinum', emoji: '💠', minLevel: 31 },
  { tier: 'Diamond', emoji: '💎', minLevel: 41 },
  { tier: 'Master', emoji: '🔮', minLevel: 56 },
  { tier: 'Grandmaster', emoji: '👑', minLevel: 71 },
  { tier: 'Champion', emoji: '⚡', minLevel: 91 },
]

/** 取得某關卡對應的頭銜 */
export function titleForLevel(level: number): Title {
  let result = TITLES[0]
  for (const t of TITLES) {
    if (level >= t.minLevel) result = t
    else break
  }
  return result
}

/** localStorage 鍵名 */
export const STORAGE_KEYS = {
  bestRound: 'cybermind_best_round',
  title: 'cybermind_title',
  hasPurchased: 'cybermind_has_purchased',
  sfxEnabled: 'cybermind_sfx_enabled',
  musicEnabled: 'cybermind_music_enabled',
} as const
