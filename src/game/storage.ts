// localStorage 持久化（容錯：私密模式 / 停用時不致崩潰）
import { STORAGE_KEYS } from './constants'

export function loadBestRound(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEYS.bestRound)) || 0
  } catch {
    return 0
  }
}

export function saveBestRound(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.bestRound, String(value))
  } catch {
    /* 忽略寫入失敗 */
  }
}

export function loadBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === 'true'
  } catch {
    return fallback
  }
}

export function saveBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* 忽略寫入失敗 */
  }
}
