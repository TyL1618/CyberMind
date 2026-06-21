// CyberMind — 核心型別定義
//
// 設計原則：問題以「結構化資料」表示，由 UI 層用圖示渲染，
// 盡量不依賴文字，以符合 GDD「無語言隔閡」的目標。

/** 幾何圖形種類 */
export const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'hexagon'] as const
export type Shape = (typeof SHAPES)[number]

/** 符號種類 */
export const SYMBOLS = ['lightning', 'star', 'arrow', 'heart', 'plus', 'question'] as const
export type SymbolKind = (typeof SYMBOLS)[number]

/** 任一物件種類（圖形或符號） */
export type ObjectKind = Shape | SymbolKind
export type ObjectCategory = 'shape' | 'symbol'

/** 霓虹色系（場景物件用） */
export const NEON_COLORS = ['cyan', 'purple', 'orange', 'pink', 'green'] as const
export type NeonColor = (typeof NEON_COLORS)[number]

/** 盤面座標（0-based） */
export interface GridPos {
  row: number
  col: number
}

/** 場景中的一個物件 */
export interface GameObject {
  id: string
  kind: ObjectKind
  category: ObjectCategory
  color: NeonColor
  pos: GridPos
  /** 出現順序，0-based */
  order: number
}

/** 一個物件的「身份描述」（用於選項渲染） */
export interface ObjectDescriptor {
  kind: ObjectKind
  color: NeonColor
}

/** 問題類型 */
export type QuestionType = 'color' | 'position' | 'order' | 'count' | 'absence'

/**
 * 問題（依 type 區分的 discriminated union）。
 * 所有問題都有四個選項，answerIndex 指向正解。
 */
export type Question =
  // 顏色記憶：顯示某個（唯一可辨識的）物件，問它是什麼顏色
  | {
      type: 'color'
      target: ObjectDescriptor
      options: NeonColor[]
      answerIndex: number
    }
  // 位置記憶：問某個（唯一可辨識的）物件在哪一格
  | {
      type: 'position'
      target: ObjectDescriptor
      gridSize: number
      options: GridPos[]
      answerIndex: number
    }
  // 順序記憶：問第 N 個出現的是什麼
  | {
      type: 'order'
      ordinal: number // 1-based
      options: ObjectDescriptor[]
      answerIndex: number
    }
  // 數量記憶：問某種物件總共有幾個
  | {
      type: 'count'
      target: ObjectKind
      options: number[]
      answerIndex: number
    }
  // 反向記憶：以下哪個「沒有」出現過
  | {
      type: 'absence'
      options: ObjectDescriptor[]
      answerIndex: number
    }

/** 單一關卡的完整資料 */
export interface Level {
  level: number
  objects: GameObject[]
  question: Question
  /** 場景展示秒數 */
  showSeconds: number
  /** 物件逐一出現的間隔（秒） */
  revealInterval: number
}

/** 遊戲流程階段 */
export type Phase =
  | 'home' // 首頁
  | 'ready' // 開始前倒數
  | 'memorize' // 展示場景
  | 'question' // 作答中
  | 'correct' // 答對過場
  | 'wrong' // 答錯（死亡）
  | 'gameover' // 本局結束

/** 頭銜 */
export interface Title {
  tier: string
  emoji: string
  minLevel: number
}
