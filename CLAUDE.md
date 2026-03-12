# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExamAI (考題大師) is a Chinese-language exam question management and quiz PWA. Users photograph exam papers, Gemini AI extracts/solves the questions, and data is stored in Google Sheets via Google Apps Script. The app also supports offline use via IndexedDB (Dexie) and Service Worker caching.

## Commands

- `npm run dev` — Start dev server on http://localhost:3000 (binds 0.0.0.0)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build on port 4173

There are no test or lint scripts configured.

## Architecture

**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS. No router library — uses a custom hash-based router in `App.tsx` with `AppRoute` enum.

**Backend**: Google Apps Script (`GAS_Code.js`) deployed as a web app. This file is NOT bundled — it's manually deployed to GAS. It reads/writes to Google Sheets ("科目" for questions, "紀錄" for results, "分類索引" for metadata index).

**Key data flow**:
1. **Upload**: User photos → `geminiService.ts` (Gemini API with structured JSON output) → `gasService.ts` uploads extracted questions to GAS → Google Sheets
2. **Quiz**: `gasService.ts` fetches questions from GAS (or `offlineService.ts` reads from IndexedDB) → `QuizPage.tsx` renders quiz → results saved back via GAS
3. **Offline sync**: `offlineService.ts` pulls all subjects/scopes/questions from GAS into Dexie (`db.ts`), caches images as blobs, and queues unsynced quiz results for later upload

**Services layer** (`services/`):
- `geminiService.ts` — Calls Gemini API (`@google/genai`) with exam image + structured schema to extract questions. Uses `process.env.API_KEY` (mapped via Vite `define` from `VITE_GEMINI_API_KEY`).
- `gasService.ts` — All GAS HTTP communication (upload, fetch questions/subjects/scopes, save results, fetch history). GAS URL stored in localStorage.
- `offlineService.ts` — Full offline sync engine: downloads all data from GAS to IndexedDB, caches images, uploads pending results.
- `db.ts` — Dexie database schema (questions, images, history tables).

**PWA**: Configured via `vite-plugin-pwa` with Workbox. Service worker auto-updates, caches all static assets, and runtime-caches Google profile images.

## Important Configuration

- **Base path**: `/examAI/` — all routes and assets are served under this prefix (configured in `vite.config.ts` and PWA manifest)
- **Environment variable**: `VITE_GEMINI_API_KEY` in `.env` or `.env.local` for the Gemini API key
- **GAS URL**: User-configured at runtime via the homepage input, saved to localStorage under key `examai_gas_url`
- **Path alias**: `@/` maps to project root

## Deployment

Push to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages.

## Language

UI text and user-facing strings are in Traditional Chinese (繁體中文). Gemini is instructed to return explanations and metadata in Traditional Chinese.
