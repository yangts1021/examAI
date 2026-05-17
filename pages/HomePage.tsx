import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { AppRoute } from '../types';
import { getGasUrl, setGasUrl } from '../services/gasService';

import { offlineService } from '../services/offlineService';
// @ts-ignore
import { useRegisterSW } from 'virtual:pwa-register/react';

interface HomePageProps {
  onNavigate: (page: AppRoute) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [gasUrl, setGasUrlState] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    // Just load the URL, don't alert immediately.
    setGasUrlState(getGasUrl());
  }, []);

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add('dark');
        try { localStorage.setItem('examai_dark_mode', '1'); } catch {}
      } else {
        root.classList.remove('dark');
        try { localStorage.setItem('examai_dark_mode', '0'); } catch {}
      }
      return next;
    });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGasUrlState(e.target.value);
  };

  const handleSaveUrl = () => {
    setGasUrl(gasUrl);
    alert('GAS 網址已儲存！');
  };

  // PWA Status Logic
  // @ts-ignore
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // console.log('SW Registered: ' + r);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Check if SW is already controlling the page (meaning offline ready)
  useEffect(() => {
    if (navigator.serviceWorker?.controller) {
      setOfflineReady(true);
    }
  }, [setOfflineReady]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress('準備開始...');
    try {
      await offlineService.syncData((msg) => setSyncProgress(msg));
      alert('離線題庫同步完成！');
      setSyncProgress('');
    } catch (error: any) {
      console.error(error);
      setSyncProgress('同步失敗');
      const msg = error.message || '未知錯誤';
      alert(`同步失敗：${msg}\n\n請檢查 GAS 部署權限是否為「所有人」。`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-12 space-y-12">
      <button
        type="button"
        onClick={toggleDarkMode}
        aria-label={isDark ? '切換為亮色模式' : '切換為暗色模式'}
        title={isDark ? '切換為亮色模式' : '切換為暗色模式'}
        className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm transition-colors"
      >
        {isDark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM21.75 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.834a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM4.5 12a.75.75 0 01-.75.75H2.25a.75.75 0 010-1.5h1.5A.75.75 0 014.5 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="text-center space-y-4 max-w-2xl">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight sm:text-5xl">
          AI 智慧助攻，考試更輕鬆 <span className="text-sm font-normal text-slate-400 dark:text-slate-500">(v1.8)</span>
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          從題庫隨機抽選題目，即時評分自我挑戰。
        </p>

        {/* PWA Status Indicator */}
        <div className="mt-2 h-6 flex justify-center items-center gap-2 text-sm font-medium">
          {offlineReady ? (
            <span className="text-green-600 flex items-center animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              應用程式資源已就緒 (可離線使用)
            </span>
          ) : needRefresh ? (
            <span className="text-blue-600 flex items-center animate-pulse">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在下載新版本... (請稍候)
            </span>
          ) : (
            <span className="text-slate-400 text-xs">系統檢查中...</span>
          )}
        </div>
      </div>

      {/* GAS URL Configuration */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <label htmlFor="gas-url" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Google Apps Script URL (資料庫連結)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="gas-url"
            value={gasUrl}
            onChange={handleUrlChange}
            placeholder="請貼上您的 GAS 網頁應用程式網址..."
            className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500 text-sm p-2.5"
          />
          <Button onClick={handleSaveUrl} size="sm">
            儲存
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          請貼上部署為「網頁應用程式」後的網址 (以 <code>/exec</code> 結尾)。
        </p>

        {/* Offline Sync Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSync}
              disabled={isSyncing || !gasUrl}
              variant="secondary"
              size="sm"
            >
              {isSyncing ? '同步中...' : '下載離線題庫'}
            </Button>
            {syncProgress && (
              <span className="text-sm text-slate-600 dark:text-slate-300 animate-pulse">
                {syncProgress}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Quiz Card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">進行測驗</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 flex-grow">
              選擇科目與範圍。我們會從你的資料庫隨機抽選題目，並即時評分。
            </p>
            <Button variant="secondary" onClick={() => onNavigate(AppRoute.QUIZ)} className="w-full">
              開始測驗
            </Button>
          </div>
        </div>

        {/* Dabu Tie Card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">國文大補帖測驗</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 flex-grow">
              國字、注音、注釋大補帖練習。可選擇範圍，自行作答後立即批改，錯題會記錄供反覆練習。
            </p>
            <Button variant="primary" onClick={() => onNavigate(AppRoute.DABU_TIE)} className="w-full">
              前往大補帖
            </Button>
          </div>
        </div>

        {/* History Card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">歷史紀錄</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 flex-grow">
              查看詳細的過往測驗成績與答題狀況，並針對此範圍的錯題進行重點複習。
            </p>
            <Button variant="outline" onClick={() => onNavigate(AppRoute.HISTORY)} className="w-full">
              查看紀錄
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;