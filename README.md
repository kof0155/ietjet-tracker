# ✈️ Thai VietJet Flight Price Tracker (100% Cloud-Based)

這是一個為**泰越捷航空 (Taipei TPE ⇄ Bangkok BKK)** 於 **2026/06/18 - 2026/06/22** 來回航班所量身打造的**完全雲端自動化票價監控系統**。

本系統採用 **Serverless 無伺服器架構**：
- **免費雲端自動爬蟲** (GitHub Actions)：每 6 小時自動在雲端下載 Chrome 瀏覽器並模擬查詢 Google Flights，安全、穩定，完全不佔用您本機電腦的 CPU 與網路。
- **手機 Telegram 即時推播**：一旦發現票價降至您設定的目標門檻值（或發生大降價），雲端會立刻發送精美的 Telegram 訊息至您的手機！
- **Obsidian 擬態暗黑網頁儀表板** (GitHub Pages)：免費發布為公開靜態網頁，內建 Chart.js 動態票價走勢圖與航班詳細組合，隨時可用手機隨手打開查看最新資訊。
- **資安合規**：**100% 雲端運行，不需在您的公司電腦下載或安裝任何 Python 軟體或背景執行檔**，完全符合公司電腦的安全性規範。

---

## 🛠️ 1 分鐘快速部署指南

只需在 GitHub 網頁上簡單點選幾下，即可完成部署：

### 1. 建立 GitHub 倉庫並上傳程式碼
1. 登入您的 [GitHub](https://github.com/) 帳號。
2. 點選右上角的 **New** 建立一個新的儲存庫 (Repository)。
3. 填寫儲存庫名稱（例如 `vietjet-tracker`）。
4. **建議將屬性設為 Private (私有儲存庫)**，以保護您的 Telegram 金鑰與設定隱私。
5. 將本專案的所有檔案上傳到該倉庫中。可以使用 GitHub 網頁版直接拖曳上傳，或是使用 Git 指令：
   ```bash
   git init
   git add .
   git commit -m "Initialize VietJet Tracker"
   git branch -M main
   git remote add origin https://github.com/您的帳號/vietjet-tracker.git
   git push -u origin main
   ```

### 2. 設定 Telegram 推播密鑰 (GitHub Secrets)
為了讓雲端爬蟲能夠傳送通知給您的手機，請在 GitHub 儲存庫網頁的：
**Settings -> Secrets and variables -> Actions** 點選 **New repository secret**，新增以下三個變數：

1. **`TELEGRAM_BOT_TOKEN`** (Telegram 機器人金鑰)
   * 取得方式：在 Telegram 搜尋 `@BotFather` 並發送 `/newbot`，按照說明命名機器人後，即可獲得一串 Bot API Token。
   * 請記得點擊您新建機器人的連結並點選 **Start** 啟用機器人。
2. **`TELEGRAM_CHAT_ID`** (您的個人 Telegram ID)
   * 取得方式：在 Telegram 搜尋 `@userinfobot` 並發送任意文字給它，它會立刻回覆您的個人 ID（一串純數字）。
3. **`PRICE_THRESHOLD`** (降價門檻警報值)
   * 設定為您希望收到通知的總票價上限。例如設定：`10500`

### 3. 啟用網頁儀表板 (GitHub Pages)
讓本儀表板發布為您的個人專屬網站：
1. 前往儲存庫的 **Settings -> Pages**。
2. 在 **Build and deployment -> Source** 選擇 **Deploy from a branch**。
3. 在 **Branch** 選擇 `main`，路徑指定 `/ (root)`，然後點選右側的 **Save**。
4. 約過 1 - 2 分鐘，上方會出現您的專屬網站網址（例如：`https://您的帳號.github.io/vietjet-tracker/`），點開即可看到極致奢華的票價走勢儀表板！

---

## 📈 系統自動運作與測試

- **自動定時抓取**：系統已設定好 **每 6 小時（一天 4 次）自動在雲端啟動爬蟲** 抓取票價，並將最新數據自動更新至儀表板，並在低於門檻時傳送 Telegram 通知。
- **手動立即測試**：
  若您想立刻看到最新抓取的數據或測試 Telegram 通知，請前往您 GitHub 倉庫的 **Actions** 分頁，點選左側的 **Scheduled Flight Price Tracker** 工作流，並點選右側的 **Run workflow** -> **Run workflow**。系統將在 1 分鐘內在雲端抓取完成，並即時更新您的網頁與發送 Telegram 訊息！

---

## 🔒 隱私與本機痕跡清理說明
本程式碼暫時儲存在您的本機快取以利建置。當您完成 GitHub 上傳後，您的 AI 助手會**立刻幫您清空並永久刪除您公司電腦上的本機檔案**，不留下任何本地殘留與資安隱患。
