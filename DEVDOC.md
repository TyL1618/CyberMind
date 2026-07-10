# CyberMind — Game Design Document (GDD)

> 版本：v1.0  
> 日期：2026-06-12  
> 開發者：Tom

---

## 0. 開發現況（Implementation Status）

> 更新：2026-07-10（第五輪：Capacitor Android 殼上線，debug APK 打包成功並實機驗證）

本文件以下章節（§1 起）為**設計規格**；本節記錄**實際實作進度**。

### 已完成

| 範圍 | 內容 |
|------|------|
| 專案骨架 | Vite + **React 19** + **TypeScript** + **Tailwind v4**（CSS-first `@theme`）+ **Framer Motion** |
| 核心邏輯 | 難度曲線、場景生成、五種題型生成（顏色／位置／順序／數量／反向）；24,000 關壓測 0 錯 |
| 狀態機 | `useGameStore`：home→ready→memorize→question→correct／wrong→gameover，含復活、頭銜偵測、**可暫停計時** |
| UI | 首頁、遊戲畫面、盤面（5×5 完美正方格）、選項（圓角正方形；顏色題整格填色）、倒數（數字＋進度條）、頭銜徽章、死亡／結算、設定彈窗 |
| **遊戲內控制列** | 上排兩列：⏸ 暫停（左）｜⌂ 返回主選單 + ⚙ 設定（右）；下排關卡／頭銜／最佳 + 復活 |
| **暫停** | ⏸ → **全黑遮罩**（看不到盤面，防暫停找漏洞）+ 中央暫停符號 + 「點擊繼續」，**計時凍結**；點擊恢復 |
| **返回主選單** | ⌂ → 確認框「要離開遊戲嗎？」（留下／離開），離開才回首頁 |
| **i18n** | 零依賴自建（`src/i18n`），**繁中（預設）／英文**設定即時切換、`localStorage` 持久化；題目提示、頭銜、所有功能文字皆翻譯（品牌字 CYBERMIND 保留） |
| **倒數計時** | 展示／答題兩階段皆有：中央大數字 + 進度條，越接近 0 由青→黃→紅；`setInterval` 依真實時間扣除；**暫停／設定／返回確認開啟時凍結**（完全停掉 timer，剩餘時間存 ref 續跑接續） |
| 音效 | **Howler.js** 載入預生成 WAV（`public/audio/`，`scripts/gen-audio.mjs` 純 Node.js 合成），可離線；換真實取樣只需覆蓋同名檔案 |
| **頭銜升級動畫** | 衝擊波擴散環 + 26 顆霓虹粒子爆炸 + emoji 彈入 + 金字標題漸入（`TitleUpOverlay`） |
| **A2HS 安裝提示** | `useInstallPrompt` 攔截 `beforeinstallprompt`，首頁底部自訂橫幅（安裝／忽略），`localStorage` 持久化忽略狀態 |
| **Splash 優化** | `index.html` 內嵌品牌載入畫面（React 掛載前顯示 CYBERMIND 字樣），App 首次渲染後 0.35s 淡出移除；Apple PWA meta tags（`apple-mobile-web-app-capable` 等） |
| 設定 | 語言／音效／音樂開關，`localStorage` 持久化；首頁與遊戲內共用同一彈窗（返回主選單已改為遊戲內專屬按鈕） |
| 頭銜升級 | 跨頭銜門檻時播放儀式動畫 + 音效 |
| **沉浸式（已實測）** | manifest `display:fullscreen` + `viewport-fit=cover` + safe-area padding；**安裝後實測可隱藏系統列**（注意：`display` 在安裝當下鎖定，改設定後需**完整解除安裝再重裝**才生效） |
| **PWA 自動更新** | `registerType:prompt` + `src/pwa.ts`：每 60 秒偵測新版，**遊玩中先 defer、回首頁自動套用**（免手動清快取） |
| **原生感** | 全站禁右鍵選單、禁文字選取／複製、禁圖片拖曳；返回鍵逐層處理：關遮罩 → 遊戲中回主選單 → 首頁「再按一次離開」（history 哨兵法，TWA 可 finish） |
| 資料 | `localStorage` 存最高關卡、設定、語言 |

### 重要技術決策

- **問題採結構化資料 + 圖示渲染**（非寫死文字），以落實「無語言隔閡」目標 → 見 `src/game/types.ts` 的 `Question` union 與 `src/components/QuestionPanel.tsx`。
- **i18n 零依賴**：介面文字極少，自建 `t()` + Context（`src/i18n/index.tsx`）比引入 react-i18next 更輕；頭銜以穩定 `tier` 為 key 對應翻譯。
- **倒數用 `setInterval` 而非 rAF**：依真實經過時間扣除（精準），不持續佔用合成器（省電）；**暫停時完全清掉 timer**、剩餘時間存 `remainingRef`，續跑時接續（非只略過扣時）。
- **沉浸式／返回鍵／自動更新移植自 TaiexRider**：`display:fullscreen` manifest、history 哨兵 + `beforeunload`、prompt 模式 SW + 60s 偵測。
- **全螢幕的安裝鎖定**：PWA 的 `display` 在安裝當下就鎖定，自動更新只換內容、不換安裝屬性；改 manifest 後務必**解除安裝再重裝**才會套用（本專案已實測重裝後成功全螢幕）。
- **盤面 5×5**，物件逐一出現間隔依展示秒數自適應（在展示時間前半段內全部現身）。
- 音效目前用 Web Audio 合成；GDD §10 列的 **Howler.js** 已安裝，保留給未來取樣音檔。

### 檔案結構（`src/`）

```
i18n/        index（零依賴 i18n：字典 + Provider + useI18n/t）
pwa.ts       Service Worker 註冊 + 自動更新（遊玩中 defer）
game/        types, constants, rng, difficulty,
             sceneGenerator, questionGenerator, levelFactory, storage
state/       useGameStore（含可暫停計時）, useSettings
audio/       sfx（Web Audio 引擎）
components/  ObjectIcon, Board, MiniGrid, Countdown,
             QuestionPanel, TitleBadge, SettingsModal
screens/     HomeScreen, GameScreen
```

### 如何執行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 產出 dist/（含 PWA）
npm run preview  # 預覽正式建置
```

### 部署（Cloudflare Workers，靜態資產）

以 **Workers 靜態資產（assets-only Worker）** 部署純靜態 SPA,設定在 `wrangler.jsonc`
（`assets.directory=./dist`、`not_found_handling=single-page-application` 處理 SPA 路由）。
`.node-version` 固定 Node 22 供 CI 建置。

**方式一：Git 整合（建議,推送自動部署）**
Cloudflare 後台 → Workers & Pages → Create → Workers → Import a repository → `TyL1618/CyberMind`:
- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`
- 之後每次 `git push` 自動建置部署。

**方式二：CLI 手動部署**
```bash
npm run cf:login   # 首次：瀏覽器授權 wrangler
npm run deploy     # build + wrangler deploy（讀 wrangler.jsonc）
```

### 📌 2026-07-09 決策：捨棄 TWA，改用 Capacitor 包裝原生殼

跟 TaiexRider（同開發者的另一款遊戲，已上架封測中）討論後拍板：CyberMind 上架 Android
**不走 TWA**（原訂 Bubblewrap / PWA Builder 那條路線），改用 **Capacitor** 包裝原生殼。
目前專案還很早期（連 `android/` 資料夾都還沒建），是切換方向沉沒成本最低的時間點。原因：

- **TWA 有一個無法關閉的系統通知，跟廣告/付款無關**：Chrome 對 TWA 有強制揭露政策——
  只要畫面內容是透過 Chrome 呈現（這正是 TWA 的本質：把網站包裝成看起來像原生 App），
  就會顯示類似「正在 Chrome 中執行」的提示。這條規則寫死在 Chrome 本身，不是開發者
  manifest 設定或程式碼能關掉的。TaiexRider 從開發初期到現在都無法解決這個提示，
  確認是 TWA 架構的固有限制，不是特定版本的 bug。
- **TaiexRider 已經在「TWA + AdMob + Play Billing」這條路上踩了大量坑**：loopback
  HTTP server 橋接、Background Activity Launch 限制擋下 `startActivity`、CORS 標頭
  缺漏導致網頁讀不到廣告結果、Play Billing 的 `DelegationService`/`BIND_JOB_SERVICE`
  權限衝突、`asset_statements` meta-data 缺漏——根因都是「Chrome 沒有官方管道讓網頁
  JS 直接呼叫原生 SDK」，只要走 TWA 架構就無法避免，前後花了好幾個版本才真正打通。
  CyberMind 待辦清單本來就要做「AdMob Rewarded 復活廣告」跟「Play Billing 買斷」，
  會踩到同一類問題。
- **選 Capacitor、不選全原生重寫**：CyberMind 目前渲染需求輕量（5×5 格子 UI +
  Framer Motion 動畫，不是物理模擬），WebView 效能綽綽有餘，不需要為了拿掉 TWA
  就連帶把整包 React/TypeScript 遊戲邏輯（狀態機、五種題型生成器、難度曲線、i18n
  等，見上方「已完成」表格）重寫成 Kotlin。Capacitor 保留現有程式碼，只換掉原生殼
  跟橋接方式，廣告/付款改用成熟的社群外掛（`@capacitor-community` 系列）以正規
  JS↔原生介面接上，不需要自建 loopback server 這類土法煉鋼的橋接。

**⚠️ 資安提醒（順帶記錄，非本次改動範圍）**：目前 `cybermind_has_purchased` 只存在
localStorage（見上方 §9.1）。之後真的接上 Google Play Billing 時，**必須加上伺服器端
驗證購買憑證**，不能只信任本機端這個旗標——否則玩家開 devtools 手動改 localStorage
就能免費解鎖 $1.99 買斷。CyberMind 目前用 Cloudflare Workers 部署，可以寫一個輕量
Worker 端點做驗證，邏輯可參考 TaiexRider 已經上線驗證過的 `verify-iap-purchase`
Edge Function（呼叫 Google Play Developer API 驗證購買憑證）。

### 📌 2026-07-10：Capacitor Android 殼上線，debug APK 打包成功

跟進 2026-07-09 決策，實際把 Capacitor 接上並產出可安裝的 debug APK，實機比對過 TWA
（TaiexRider）跟 Capacitor 版的差異，確認**沒有 TWA 那個關不掉的「正在 Chrome 中執行」
系統通知**——因為 Capacitor 是用系統內建 WebView 元件嵌在自己的 `MainActivity` 裡，
不是像 TWA 那樣借 Chrome 這個 App 的殼，架構上就不會觸發 Chrome 的揭露通知規則。

**新增檔案／設定：**
- `capacitor.config.ts`：`appId: com.tylapp.cybermind`（沿用 TaiexRider 的 `com.tylapp.*`
  命名慣例），`webDir: dist`
- `android/`：`npx cap add android` 產生的原生 Gradle 專案，已加入版控（`local.properties`、
  `build/`、`.gradle/`、`app/src/main/assets/public` 等機器相關／產物檔案已由 Capacitor
  自動產生的 `android/.gitignore` 排除，不會進 repo）
- `android/app/src/main/java/com/tylapp/cybermind/MainActivity.java`：原生沉浸式全螢幕
  （`WindowInsetsController` 隱藏狀態列＋三鍵導覽列，滑邊緣可暫時叫出，符合系統標準行為）

**本機建置環境備忘（換電腦時要重設的部分）：**
- **JDK 21 必要**：Capacitor 8 原生模組需要 JDK 21 編譯，本機系統預設 JDK 17（Microsoft
  build）跑 `gradlew` 會失敗（`invalid source release: 21`）。解法：用 Android Studio
  內建的 JBR（`<Android Studio 安裝路徑>/jbr`，本身就是 JDK 21）。command line 建置時
  帶 `JAVA_HOME="<Android Studio 路徑>/jbr" ./gradlew assembleDebug`；**直接用 Android
  Studio 開啟 `android/` 資料夾建置則不會遇到這問題**（IDE 用自己內建的 JDK）。
- **`android/local.properties` 不會進版控**（機器相關，內容是 `sdk.dir=...`），新電腦
  第一次要手動建立，指向該機器的 Android SDK 安裝路徑（例如
  `C:\Users\<user>\AppData\Local\Android\Sdk`，或用 Android Studio 開專案時它會自動生成）。
- 其餘（`package.json` 的 `@capacitor/*` 依賴、`android/` 整包原生專案、圖示／splash
  資源）都在 repo 裡，`git clone` 後 `npm install` + 建立好 `local.properties` 即可繼續。

**UI 層因應原生殼調整**（PWA 網頁版跟 Capacitor App 版共用同一份程式碼，這些調整兩邊都會生效）：
- 首頁／遊戲內設定齒輪統一位置與大小（`absolute right-5 top-5`，兩畫面座標一致）
- 遊戲內暫停鈕、返回主選單鈕改用手繪 SVG／CSS 圖示，不用 Unicode 符號（⏸ 在 Android
  會被當彩色 emoji 渲染、CSS 顏色設定無效，這是換到原生殼後才發現的問題）
- 倒數計時條固定在資訊列正下方（板子或題目提示都在它下面），展示／作答兩階段位置一致
- 5×5 格線邊框加粗提高辨識度、答題選項區塊上限縮小避免在部分機型觸發捲動

**下一步**：目前只有 **debug APK**，尚未做 release 簽章／上架 Google Play；AdMob、
Play Billing 也還沒接（見下方待辦）。開發順序上使用者決定先讓 TaiexRider 上架成功，
CyberMind 上架時間之後再議；但 Capacitor 殼本身已經是可用狀態，之後隨時可以接著做
release 簽章跟金流。

**圖示／Splash 修正**：`npx cap add android` 產生的專案預設用 Capacitor 官方佔位圖示
（藍色 X 標誌）跟白底 splash，跟 `public/` 裡 PWA 版的霓虹方塊圖示完全無關、不會自動
同步。修法：新增 `scripts/gen-android-icon-sources.mjs`（沿用 `gen-icons.mjs` 同一套
SVG 標誌設計）產生 `resources/icon.png`、`icon-foreground.png`、`icon-background.png`、
`splash.png`，裝 `@capacitor/assets`（devDependency）後跑
`npx capacitor-assets generate --android` 自動產生所有密度的 `mipmap-*/ic_launcher*.png`
（含 adaptive icon）跟 `drawable-*/splash.png`，取代預設佔位圖。**之後若標誌設計有改，
兩邊圖示要同步更新都要重跑**：`node scripts/gen-icons.mjs`（PWA）＋
`node scripts/gen-android-icon-sources.mjs && npx capacitor-assets generate --android`
（Capacitor）。

### 待辦（下一階段）

- [x] 頭銜升級動畫再加強（粒子／音效層次）
- [x] 真實取樣音效（改 Howler.js）
- [x] 自訂安裝提示（A2HS）、splash 畫面優化
- [x] Capacitor 打包（`@capacitor/core` + `@capacitor/android`）— debug APK 已可建置安裝
      （原訂 TWA/Bubblewrap 方案已於 2026-07-09 改為 Capacitor，見上方決策記錄與 07-10 進度）
- [ ] Capacitor release 簽章 + 正式上架 Google Play
- [ ] 接入 AdMob Rewarded（復活廣告）——改用 Capacitor 廣告外掛，非 TWA 橋接
- [ ] 接入 Google Play Billing（買斷 $1.99）——改用 Capacitor 付款外掛 + 伺服器端
      購買憑證驗證（見上方資安提醒）

---

## 1. 遊戲概述

| 項目 | 內容 |
|------|------|
| 遊戲名稱 | CyberMind |
| 類型 | 記憶益智 |
| 平台 | PWA → TWA → Google Play（Android優先） |
| 技術棧 | React + Vite + TypeScript |
| 目標市場 | 全球（無語言隔閡） |
| 目標族群 | 全年齡，含長輩 |
| 核心吸引力 | 記憶力鑑別度、頭銜社交貨幣、無限關卡 |

---

## 2. 核心玩法

### 2.1 每關流程

```
1. Ready 倒數提示（1秒）
2. 展示場景（N秒，依關卡遞減）
3. 場景消失
4. 顯示問題 + 四個選項（限時10秒作答）
5. 答對 → 過關動畫 → 下一關
   答錯 → 死亡畫面 → 復活或結束
```

### 2.2 場景內容

場景由**幾何圖形**與**符號**混合組成，排列在格子盤面上。

**幾何圖形種類：**
- 圓形、三角形、正方形、菱形、六角形

**符號種類：**
- 閃電、星星、箭頭、愛心、問號、十字

**屬性維度（每個物件都有）：**
- 形狀／符號種類
- 顏色（霓虹色系：青色、紫色、橙色、粉色、綠色）
- 位置（格子座標）
- 出現順序（動畫逐一顯示）

### 2.3 問題類型

程序隨機抽取以下其中一種：

| 類型 | 範例問題 |
|------|----------|
| 顏色記憶 | 「閃電符號是什麼顏色？」 |
| 位置記憶 | 「三角形在哪個位置？」 |
| 順序記憶 | 「第三個出現的是什麼？」 |
| 數量記憶 | 「總共有幾個圓形？」 |
| 反向記憶（高關卡） | 「以下哪個物件沒有出現過？」 |

**選項設計原則：**
- 四個選項，一個正確答案
- 干擾選項從本關場景元素中生成，避免明顯排除

### 2.4 作答限時

- **固定10秒**
- 倒數條視覺化顯示（霓虹色倒數進度條）
- 時間到未作答視為答錯

---

## 3. 難度曲線

### 3.1 參數表

| 關卡區間 | 物件數量 | 展示秒數 | 問題類型 | 認知負荷 |
|----------|----------|----------|----------|----------|
| 1–5 | 2–3個 | 5秒 | 單一屬性 | 最低 |
| 6–10 | 3–4個 | 4.5秒 | 單一屬性 | 低 |
| 11–20 | 4–5個 | 4秒 | 兩種屬性混出 | 中 |
| 21–35 | 5–6個 | 3.5秒 | 兩種屬性＋相似干擾 | 中高 |
| 36–50 | 6–7個 | 3秒 | 複合問題 | 高 |
| 51–70 | 7–8個 | 2.5秒 | 複合＋反向記憶 | 很高 |
| 71–90 | 8–9個 | 2秒 | 全類型隨機 | 極高 |
| 91+ | 9–10個 | 2秒 | 全類型＋陷阱選項 | 最高 |

### 3.2 難度設計原則

- 難度來源以**認知負荷增加**為主，而非單純縮短時間
- 中高關卡加入「相似干擾物」（例如兩個顏色相近的符號）
- 後期加入**反向記憶題**（考「沒出現的」）製造認知陷阱
- 物件**動畫逐一出現**（非同時），強化順序記憶成分

---

## 4. 頭銜系統

### 4.1 頭銜分級

| 頭銜 | 關卡區間 | 預估玩家比例 |
|------|----------|-------------|
| 🥉 銅牌 | 1–10 | ~100% |
| 🥈 銀牌 | 11–20 | ~70% |
| 🥇 金牌 | 21–30 | ~40% |
| 💠 白金 | 31–40 | ~15% |
| 💎 鑽石 | 41–55 | ~5% |
| 🔮 大師 | 56–70 | ~1% |
| 👑 宗師 | 71–90 | ~0.1% |
| ⚡ 冠軍 | 91+ | 極少數 |

### 4.2 首頁顯示

- 生涯最高關卡數（大字顯示）
- 對應頭銜（附頭銜圖示）
- 頭銜升級時有儀式感動畫＋音效

---

## 5. 死亡與復活機制

### 5.1 死亡觸發條件

- 答錯任一題
- 作答時間10秒到未作答

### 5.2 復活機制

- **每局限一次**復活機會
- 觸發方式：看廣告（約30秒）
- 復活後從死亡那關繼續，不扣分
- 已使用過復活的局，死亡後直接結束

### 5.3 設計邏輯

每局限一次的目的：
- 防止廣告刷分作弊
- 保留對「手滑誤觸」玩家的救濟
- 確保排行榜的關卡數有真實鑑別度

---

## 6. 商業模式

### 6.1 廣告

- 平台：Google AdMob
- 類型：Rewarded Video（復活用）
- 觸發：玩家主動選擇，非強制插頁廣告

### 6.2 買斷

- 價格：**$1.99 美金**
- 內容：永久關閉廣告＋每局自動獲得一次保底復活
- 平台：Google Play Billing（抽成15–30%）

---

## 7. 視覺設計

### 7.1 整體風格

**簡潔賽博龐克（Minimal Cyberpunk）**

- 深色背景（近黑，帶深藍或深紫調）
- 高對比霓虹色物件（青色 #00FFFF、紫色 #BF5FFF、橙色 #FF6B35、粉色 #FF2D78、綠色 #39FF14）
- 幾何線條、發光效果（glow/neon）
- 字體大、對比強，長輩易讀

### 7.2 UI元件

| 元件 | 設計方向 |
|------|----------|
| 盤面格子 | 深色背景＋霓虹邊框 |
| 物件 | 發光幾何圖形／符號 |
| 倒數進度條 | 霓虹色，從滿格遞減 |
| 選項按鈕 | 深色底＋霓虹邊框，選中時發光 |
| 頭銜顯示 | 大字＋對應頭銜顏色光暈 |
| 死亡畫面 | 紅色閃爍＋GAME OVER文字 |

---

## 8. 音效設計

**風格：輕量電子音效，不搶戲**

| 情境 | 音效描述 |
|------|----------|
| 場景展示中 | 低頻賽博龐克環境音循環 |
| 答對 | 短促清脆電子音（上揚） |
| 答錯／時間到 | 低沉電子失敗音 |
| 過關 | 輕快電子提示音 |
| 頭銜升級 | 較有儀式感的電子音效 |
| 復活 | 能量充電感音效 |

**素材來源：** Freesound.org 或 Pixabay（免費授權）

玩家可在設定中關閉音效／音樂。

---

## 9. 資料儲存

### 9.1 本地儲存（localStorage）

```
cybermind_best_round      // 生涯最高關卡數
cybermind_title           // 對應頭銜
cybermind_has_purchased   // 是否已買斷
cybermind_sfx_enabled     // 音效開關
cybermind_music_enabled   // 音樂開關
```

### 9.2 後端

- **初期不需要後端**
- 全球排行榜暫不實作
- 未來如有需要可接 Supabase

---

## 10. 技術架構

| 項目 | 選擇 |
|------|------|
| 前端框架 | React + Vite + TypeScript |
| 樣式 | Tailwind CSS 或 CSS Modules |
| 動畫 | Framer Motion 或 CSS Animation |
| 音效 | Howler.js |
| 廣告 | Google AdMob（TWA） |
| 付費 | Google Play Billing（TWA） |
| 儲存 | localStorage |
| 發布 | PWA → TWA → Google Play |

---

## 11. 發布路線

```
階段一：PWA
- 完成遊戲本體
- 部署至靜態hosting（Vercel / Netlify，免費）
- 自行測試＋身邊朋友測試

階段二：TWA → Google Play
- 用 Bubblewrap 或 PWA Builder 打包TWA
- 上架 Google Play（一次性 $25 美金）
- 接入 AdMob 廣告
- 接入 Google Play Billing 買斷功能

階段三：觀察數據
- 根據玩家卡關分布調整難度曲線
- 評估是否值得花 $99/年 上架 iOS
```

---

## 12. 待決定事項

- [x] 格子盤面尺寸 → **5×5**（已實作）
- [x] 物件動畫出現間隔時間 → **依展示秒數自適應**（上限 0.4 秒/個，前半段內全部出現）
- [x] App Icon 設計方向 → **霓虹方塊標誌**（青色外框＋粉點＋綠箭頭＋紫線，見 `public/` 圖示）
- [ ] 是否加入每日挑戰模式（未來擴充）
- [ ] 是否加入好友分享截圖功能（未來擴充）
