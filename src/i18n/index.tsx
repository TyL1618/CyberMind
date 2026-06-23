// 輕量 i18n：零依賴，字串少（介面文字極簡）。
// 預設繁體中文，可在設定切換英文；語言持久化於 localStorage。
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'zh-Hant' | 'en'

export const LANGS: { value: Lang; label: string }[] = [
  { value: 'zh-Hant', label: '繁中' },
  { value: 'en', label: 'EN' },
]

const STORAGE_KEY = 'cybermind_lang'

// 字典：key 為穩定識別碼，value 為各語言字串。
const DICT: Record<Lang, Record<string, string>> = {
  'zh-Hant': {
    start: '開始',
    best: '最佳紀錄',
    level: '關卡',
    ready: '準備',
    gameOver: '遊戲結束',
    revive: '復活',
    end: '結束',
    reached: '到達',
    retry: '重來',
    home: '首頁',
    newRank: '新頭銜',
    // 設定
    settings: '設定',
    soundFx: '音效',
    music: '音樂',
    close: '關閉',
    language: '語言',
    returnToMenu: '返回主選單',
    menu: '主選單',
    pause: '暫停',
    tapResume: '點擊繼續',
    leaveGameTitle: '要離開遊戲嗎？',
    leave: '離開',
    stay: '留下',
    // 離開提示
    exitHint: '再按一次返回鍵即可離開',
    exitStay: '留下繼續玩',
    // 安裝提示
    installTitle: '安裝到主螢幕',
    installDesc: '離線可玩，更像原生 App',
    install: '安裝',
    // 題目提示
    'prompt.color': '什麼顏色？',
    'prompt.position': '在哪一格？',
    'prompt.order': '第幾個出現的？',
    'prompt.count': '有幾個？',
    'prompt.absence': '哪個沒出現？',
    // 頭銜（對齊 GDD §4.1）
    'title.Bronze': '銅牌',
    'title.Silver': '銀牌',
    'title.Gold': '金牌',
    'title.Platinum': '白金',
    'title.Diamond': '鑽石',
    'title.Master': '大師',
    'title.Grandmaster': '宗師',
    'title.Champion': '冠軍',
  },
  en: {
    start: 'START',
    best: 'BEST',
    level: 'LEVEL',
    ready: 'READY',
    gameOver: 'GAME OVER',
    revive: 'REVIVE',
    end: 'END',
    reached: 'REACHED',
    retry: 'RETRY',
    home: 'HOME',
    newRank: 'NEW RANK',
    settings: 'SETTINGS',
    soundFx: 'SOUND FX',
    music: 'MUSIC',
    close: 'CLOSE',
    language: 'LANGUAGE',
    returnToMenu: 'MAIN MENU',
    menu: 'MENU',
    pause: 'PAUSE',
    tapResume: 'Tap to resume',
    leaveGameTitle: 'Leave the game?',
    leave: 'LEAVE',
    stay: 'STAY',
    exitHint: 'Press back again to exit',
    exitStay: 'Stay & keep playing',
    // install prompt
    installTitle: 'Add to Home Screen',
    installDesc: 'Play offline, native-app feel',
    install: 'INSTALL',
    'prompt.color': 'WHAT COLOR?',
    'prompt.position': 'WHERE?',
    'prompt.order': 'WHICH WAS Nᵗʰ?',
    'prompt.count': 'HOW MANY?',
    'prompt.absence': 'NOT SHOWN?',
    'title.Bronze': 'Bronze',
    'title.Silver': 'Silver',
    'title.Gold': 'Gold',
    'title.Platinum': 'Platinum',
    'title.Diamond': 'Diamond',
    'title.Master': 'Master',
    'title.Grandmaster': 'Grandmaster',
    'title.Champion': 'Champion',
  },
}

function loadLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'zh-Hant' || v === 'en') return v
  } catch {
    /* private browsing */
  }
  return 'zh-Hant'
}

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* private browsing */
    }
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const t = useCallback((key: string) => DICT[lang][key] ?? key, [lang])

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
