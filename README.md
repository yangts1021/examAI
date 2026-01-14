<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ExamAI - 考題大師

這是一個使用 React + Vite + TypeScript 開發的考題生成與練習應用程式。

[View in AI Studio](https://ai.studio/apps/drive/1gTdseuWLockL9B_t1Dhi3EztC5fwsPVU)

## 專案設定 (Project Setup)

### 前置需求
- **Node.js**: 建議 v20 或更高版本 (Minimum v18.4.0+ needed for Vite 6)
- **npm**

### 安裝套件
```bash
npm install
```

## 開發 (Development)

啟動本地開發伺服器：
```bash
npm run dev
```
應用程式將會在 `http://localhost:3000` (或其他 Vite 分配的 port) 啟動。

## 建置與部署 (Build & Deploy)

### 建置專案
```bash
npm run build
```
建置後的檔案將位於 `dist` 資料夾。

### GitHub Actions 自動部署
本專案已設定 GitHub Actions。當程式碼推送到 `main` 分支時，會自動觸發建置並部署至 **GitHub Pages**。

1. 到 GitHub Repository 的 **Settings** > **Pages**
2. 在 **Build and deployment** 下，選擇 Source 為 **GitHub Actions**
3. 推送程式碼後，Action 會自動執行。

## 專案結構
- `/components`: 重用元件
- `/pages`: 頁面元件
- `/services`: API 服務與邏輯
- `.github/workflows`: CI/CD 設定
