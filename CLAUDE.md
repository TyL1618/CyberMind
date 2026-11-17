# CyberMind

「無語言隔閡」的記憶／專注力小遊戲（PWA，另有 Capacitor Android 殼）：先展示 5×5 盤面再作答，答對過關、頭銜升級。技術棧：React 19 + TypeScript + Vite + Tailwind 4 + Framer Motion，音效 Web Audio（Howler 已裝備用）。

## 怎麼跑
- `npm install`，`npm run dev`（http://localhost:5173），`npm run preview` 預覽正式建置。
- Node 版本固定見 `.node-version`（22）。

## 怎麼測 / 建置 / 部署
- 沒有單元測試。型別檢查：`npx tsc --noEmit -p tsconfig.app.json`（已驗證可跑、不產生檔案）；`npm run lint`；`npm run build`（`tsc -b && vite build` → `dist/`）。
- 部署：Cloudflare Workers 靜態資產（`wrangler.jsonc`，`not_found_handling=single-page-application`）。`npm run deploy`＝build + `wrangler deploy`；或 Cloudflare 後台 Git 整合（push 自動部署）。**部署是對外動作，沒被要求不要執行。**
- 圖示：PWA 用 `npm run icons`；Android 圖示要 `node scripts/gen-android-icon-sources.mjs && npx capacitor-assets generate --android`，標誌設計改了兩邊都要重跑。
- Android：`android/` 是 Capacitor 8 原生專案（appId `com.tylapp.cybermind`）；目前只有 debug APK，尚未 release 簽章 / 上架 / 接 AdMob / Play Billing。

## 地雷 / 刻意不做
- **gradle 需要 JDK 21**（系統預設 JDK 17 會 `invalid source release: 21`），用 Android Studio 內建 JBR；`android/local.properties` 機器相關、不進版控，新電腦要自己建（`sdk.dir=`）。
- PWA 的 `display:fullscreen` 在安裝當下鎖定：改 manifest 後要解除安裝再重裝才生效。
- 倒數用 `setInterval` 依真實經過時間扣除（非 rAF，省電）；暫停時要完全清掉 timer、剩餘時間存 `remainingRef`。
- 問題是結構化資料 + 圖示渲染，不要寫死文字（維持無語言隔閡）；i18n 是自建零依賴 `t()`，不引入 react-i18next。
- Unicode 符號（如 ⏸）在 Android 會變彩色 emoji，圖示用手繪 SVG / CSS。
- `README.md` 只是 Vite 範本殘留，真正文件是 `DEVDOC.md`（GDD + 實作現況）。

## DEVDOC 索引（`DEVDOC.md`）
- §0 開發現況（技術決策、`src/` 檔案結構、如何執行、Cloudflare 部署、Capacitor 與 APK 備忘、待辦）
- §1 概述｜§2 核心玩法｜§3 難度曲線｜§4 頭銜｜§5 死亡與復活｜§6 商業模式｜§7 視覺｜§8 音效｜§9 資料儲存｜§10 技術架構｜§11 發布路線｜§12 待決定事項
