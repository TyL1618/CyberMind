import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './state/useGameStore'
import type { GameStore } from './state/useGameStore'
import { useSettings } from './state/useSettings'
import { titleForLevel } from './game/constants'
import { useI18n } from './i18n'
import { HomeScreen } from './screens/HomeScreen'
import { GameScreen } from './screens/GameScreen'
import { SettingsModal } from './components/SettingsModal'

function App() {
  const store = useGameStore()
  const settings = useSettings()
  const { t } = useI18n()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false) // 首頁：離開 App
  const [leaveGameOpen, setLeaveGameOpen] = useState(false) // 遊戲中：返回主選單確認
  const [gamePaused, setGamePaused] = useState(false) // 遊戲中：全黑暫停

  const onHome = store.phase === 'home'

  // 移除初始載入 splash（App 首次渲染後淡出）
  useEffect(() => {
    const el = document.getElementById('splash')
    if (!el) return
    el.classList.add('out')
    const tid = setTimeout(() => el.remove(), 380)
    return () => clearTimeout(tid)
  }, [])

  // 任一遮罩開啟時暫停倒數（設定 / 返回確認 / 暫停）
  const shouldPause = settingsOpen || leaveGameOpen || gamePaused
  useEffect(() => {
    store.setPaused(shouldPause)
  }, [shouldPause, store])

  // ── 返回鍵管理（移植自 TaiexRider 的 history 哨兵法）──────────────
  //   遮罩開著 → 先關遮罩;遊戲中 → 回主選單;
  //   首頁 → 跳「再按一次離開」;再按一次 → 真正離開 App（TWA finish）。
  const storeRef = useRef<GameStore>(store)
  storeRef.current = store
  const settingsOpenRef = useRef(settingsOpen)
  settingsOpenRef.current = settingsOpen
  const leaveGameRef = useRef(leaveGameOpen)
  leaveGameRef.current = leaveGameOpen
  const pausedRef = useRef(gamePaused)
  pausedRef.current = gamePaused
  const confirmLeaveRef = useRef(confirmLeave)
  confirmLeaveRef.current = confirmLeave
  const leavingRef = useRef(false)

  useEffect(() => {
    const rearm = () => window.history.pushState({ cyber: true }, '')
    rearm() // 進場放一個哨兵,讓第一次返回被攔截

    const onPop = () => {
      if (leavingRef.current) return // 已決定離開:讓 history 自然耗盡，TWA finish()

      // 1) 任一遊戲內遮罩開著 → 先關遮罩
      if (settingsOpenRef.current) {
        setSettingsOpen(false)
        rearm()
        return
      }
      if (pausedRef.current) {
        setGamePaused(false)
        rearm()
        return
      }
      if (leaveGameRef.current) {
        setLeaveGameOpen(false)
        rearm()
        return
      }
      // 2) 不在首頁（遊戲中/結算）→ 回主選單
      if (storeRef.current.phase !== 'home') {
        storeRef.current.goHome()
        rearm()
        return
      }
      // 3) 首頁:確認框已開 → 真正離開
      if (confirmLeaveRef.current) {
        leavingRef.current = true
        setConfirmLeave(false)
        window.close() // 桌機 PWA 有效;TWA 封鎖則由下一行接手
        window.history.go(-window.history.length)
        return
      }
      // 4) 首頁:跳離開確認
      confirmLeaveRef.current = true
      setConfirmLeave(true)
      rearm()
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // 自動更新觸發的重載:放行,不跳原生確認框（旗標由 src/pwa.ts 設定）
      if ((window as { __cyberAutoReload?: boolean }).__cyberAutoReload) return
      e.preventDefault()
    }

    window.addEventListener('popstate', onPop)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, []) // 只掛載一次,永不移除

  const leaveToMenu = () => {
    setLeaveGameOpen(false)
    setGamePaused(false)
    store.goHome()
  }

  return (
    <div
      className="mx-auto flex min-h-svh w-full max-w-md flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {onHome ? (
        <HomeScreen
          bestRound={store.bestRound}
          title={titleForLevel(store.bestRound || 1)}
          onStart={store.start}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <GameScreen
          store={store}
          onOpenSettings={() => setSettingsOpen(true)}
          onReturnMenu={() => setLeaveGameOpen(true)}
          onPause={() => setGamePaused(true)}
        />
      )}

      <AnimatePresence>
        {settingsOpen && <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>

      {/* 暫停：全黑遮罩 + 中央暫停符號（看不到盤面，防止暫停找漏洞），點擊繼續 */}
      <AnimatePresence>
        {gamePaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGamePaused(false)}
            className="fixed inset-0 z-[55] flex flex-col items-center justify-center gap-6 bg-black"
          >
            <span className="text-7xl text-neon-cyan text-glow">⏸</span>
            <span className="font-[Orbitron] text-xs tracking-[0.3em] text-white/50">
              {t('tapResume')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 返回主選單確認 */}
      <AnimatePresence>
        {leaveGameOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLeaveGameOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/85 px-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-xs flex-col items-center gap-5 rounded-2xl border border-surface-border bg-surface p-6 text-center"
            >
              <span className="font-[Orbitron] text-base font-bold tracking-wide text-neon-cyan">
                {t('leaveGameTitle')}
              </span>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveGameOpen(false)}
                  className="flex-1 rounded-full border-2 border-surface-border py-2.5 font-[Orbitron] text-sm font-bold tracking-wide text-white/70 active:scale-95"
                >
                  {t('stay')}
                </button>
                <button
                  type="button"
                  onClick={leaveToMenu}
                  className="flex-1 rounded-full border-2 border-neon-pink py-2.5 font-[Orbitron] text-sm font-bold tracking-wide text-neon-pink box-glow active:scale-95"
                >
                  {t('leave')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 離開確認:再按一次返回鍵即可離開 */}
      <AnimatePresence>
        {confirmLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmLeave(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/85 px-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl border border-surface-border bg-surface p-6 text-center"
            >
              <span className="font-[Orbitron] text-base font-bold tracking-wide text-neon-cyan">
                {t('exitHint')}
              </span>
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="rounded-full border-2 border-surface-border px-6 py-2.5 font-[Orbitron] text-sm font-bold tracking-wide text-white/70 active:scale-95"
              >
                {t('exitStay')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
