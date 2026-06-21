// 關卡工廠：組合難度設定 → 場景 → 問題
import type { Level } from './types'
import { getLevelConfig } from './difficulty'
import { generateScene } from './sceneGenerator'
import { generateQuestion } from './questionGenerator'

export function generateLevel(level: number): Level {
  const cfg = getLevelConfig(level)
  const objects = generateScene(cfg.objectCount)
  const question = generateQuestion(objects, cfg)
  return {
    level,
    objects,
    question,
    showSeconds: cfg.showSeconds,
    revealInterval: cfg.revealInterval,
  }
}
