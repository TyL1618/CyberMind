import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './state/useGameStore'
import { useSettings } from './state/useSettings'
import { titleForLevel } from './game/constants'
import { HomeScreen } from './screens/HomeScreen'
import { GameScreen } from './screens/GameScreen'
import { SettingsModal } from './components/SettingsModal'

function App() {
  const store = useGameStore()
  const settings = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col">
      {store.phase === 'home' ? (
        <HomeScreen
          bestRound={store.bestRound}
          title={titleForLevel(store.bestRound || 1)}
          onStart={store.start}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <GameScreen store={store} />
      )}

      <AnimatePresence>
        {settingsOpen && <SettingsModal settings={settings} onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

export default App
