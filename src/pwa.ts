// PWA Service Worker 註冊與自動更新（移植自 TaiexRider 的經驗）
// 流程：啟動即註冊 + 每 60 秒主動檢查新版 SW;偵測到新版時:
//   - 遊玩中 → 先記下,等回首頁(setPlaying(false))再 reload,避免把玩家踢出當前關卡
//   - 非遊玩中 → 立即 updateSW(true)(skipWaiting + 自動 reload 套用新版)
// 目的:使用者不需手動清快取/cookie 就能拿到最新版。
import { registerSW } from 'virtual:pwa-register'

const CHECK_INTERVAL_MS = 60_000

let playing = false
let pendingReload = false

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (playing) {
      pendingReload = true // 遊玩中:先擋,回首頁再套用
    } else {
      applyUpdate()
    }
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update()
      }, CHECK_INTERVAL_MS)
    }
  },
})

function applyUpdate() {
  // 標記為「程式觸發的重載」,讓 App 的 beforeunload 攔截器放行,
  // 不跳瀏覽器原生「要重新載入?」確認框。
  ;(window as { __cyberAutoReload?: boolean }).__cyberAutoReload = true
  updateSW(true)
}

// App 進出遊戲時呼叫:離開遊戲若有待套用的新版,立即 reload
export function setPlaying(value: boolean) {
  playing = value
  if (!value && pendingReload) {
    pendingReload = false
    applyUpdate()
  }
}
