// 設定：音效 / 音樂開關，持久化並即時套用到音效引擎
import { useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../game/constants'
import { loadBool, saveBool } from '../game/storage'
import { sfx } from '../audio/sfx'

export interface Settings {
  sfxEnabled: boolean
  musicEnabled: boolean
  setSfxEnabled: (v: boolean) => void
  setMusicEnabled: (v: boolean) => void
}

export function useSettings(): Settings {
  const [sfxEnabled, setSfxEnabled] = useState(() => loadBool(STORAGE_KEYS.sfxEnabled, true))
  const [musicEnabled, setMusicEnabled] = useState(() => loadBool(STORAGE_KEYS.musicEnabled, true))

  useEffect(() => {
    sfx.setSfxEnabled(sfxEnabled)
    saveBool(STORAGE_KEYS.sfxEnabled, sfxEnabled)
  }, [sfxEnabled])

  useEffect(() => {
    sfx.setMusicEnabled(musicEnabled)
    saveBool(STORAGE_KEYS.musicEnabled, musicEnabled)
  }, [musicEnabled])

  return { sfxEnabled, musicEnabled, setSfxEnabled, setMusicEnabled }
}
