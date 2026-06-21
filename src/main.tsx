import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa' // 註冊 Service Worker + 自動更新（免清快取）
import App from './App.tsx'
import { I18nProvider } from './i18n'

// 全站禁用右鍵選單：減少「網頁感」，更像原生 App
document.addEventListener('contextmenu', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
