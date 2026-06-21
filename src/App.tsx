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
  const [confirmLeave, setConfirmLeave] = useState(false)

  const onHome = store.phase === 'home'

  // 開設定時暫停倒數（答題/展示計時凍結，關閉後續跑）
  useEffect(() => {
    store.setPaused(settingsOpen)
  }, [settingsOpen, store])

  // ── 返回鍵管理（移植自 TaiexRider 的 history 哨兵法）──────────────
  //   遊戲中按返回 → 回主選單;設定開著按返回 → 關設定;
  //   首頁按返回 → 跳「再按一次離開」;再按一次 → 真正離開 App（TWA finish）。
  const storeRef = useRef<GameStore>(store)
  storeRef.current = store
  const settingsOpenRef = useRef(settingsOpen)
  settingsOpenRef.current = settingsOpen
  const confirmLeaveRef = useRef(confirmLeave)
  confirmLeaveRef.current = confirmLeave
  const leavingRef = useRef(false)

  useEffect(() => {
    const rearm = () => window.history.pushState({ cyber: true }, '')
    rearm() // 進場放一個哨兵,讓第一次返回被攔截

    const onPop = () => {
      if (leavingRef.current) return // 已決定離開:讓 history 自然耗盡，TWA finish()

      // 1) 設定開著 → 關設定
      if (settingsOpenRef.current) {
        setSettingsOpen(false)
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

  const returnHome = () => {
    setSettingsOpen(false)
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
        <GameScreen store={store} onOpenSettings={() => setSettingsOpen(true)} />
      )}

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            inGame={!onHome}
            onReturnHome={returnHome}
          />
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
