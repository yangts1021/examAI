# Exam AI - 考題大師

這是一個使用 React + Vite + TypeScript 開發的考題分析應用程式，整合了 Google Gemini API 來自動識別和解答考題。

## ✨ 特色

- 上傳考卷圖片自動識別題目
- 支援多國語言識別，輸出繁體中文解析
- 自動批改與詳解
- 主要使用 `@google/genai` sdk

## 🛠 技術棧

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **AI**: Google Gemini API (`gemini-1.5-pro` or similar)
- **Styling**: CSS / CSS Modules
- **Deployment**: GitHub Pages

## 🚀 快速開始

### 1. 安裝環境

確保您的電腦已安裝 [Node.js](https://nodejs.org/) (建議 v18 或 v20 以上)。

```bash
# 複製專案
git clone <your-repo-url>
cd examAI

# 安裝依賴
npm install
```

### 2. 設定環境變數

複製範例設定檔並填入您的 Gemini API Key：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入 `GEMINI_API_KEY=your_key_here`。

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`。

## 📦 部署

本專案已設定 GitHub Actions 自動部署至 GitHub Pages。

1. **推送程式碼**：
   將程式碼推送到 `main` 分支。

   ```bash
   git add .
   git commit -m "feat: updates"
   git push origin main
   ```

2. **自動部署**：
   GitHub Action 會自動觸發構建並部署到 `gh-pages` 分支。
   請確保在 GitHub Repository Settings -> Pages 中，Source 選擇 `gh-pages` 分支。

## 📁 專案結構

- `src/`
  - `components/`: UI 元件
  - `pages/`: 頁面元件
  - `services/`: API 服務與邏輯
  - `types/`: TypeScript Type 定義
- `public/`: 靜態資源

## 📝 開發筆記

- `.gitignore` 已設定忽略 `node_modules` 與 `.env` 等敏感檔案。
- `package.json` 已設定 `deploy` sciprt，但主要透過 CI/CD 進行。
