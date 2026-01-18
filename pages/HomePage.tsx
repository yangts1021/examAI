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

  useEffect(() => {
    // Just load the URL, don't alert immediately.
    setGasUrlState(getGasUrl());
  }, []);

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
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <div className="text-center space-y-4 max-w-2xl">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          AI 智慧助攻，考試更輕鬆 <span className="text-sm font-normal text-slate-400">(v1.8)</span>
        </h2>
        <p className="text-xl text-slate-600">
          上傳試卷自動數位化，或使用 AI 生成測驗自我挑戰。
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
      <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label htmlFor="gas-url" className="block text-sm font-medium text-slate-700 mb-2">
          Google Apps Script URL (資料庫連結)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="gas-url"
            value={gasUrl}
            onChange={handleUrlChange}
            placeholder="請貼上您的 GAS 網頁應用程式網址..."
            className="flex-1 rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm p-2.5"
          />
          <Button onClick={handleSaveUrl} size="sm">
            儲存
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          請貼上部署為「網頁應用程式」後的網址 (以 <code>/exec</code> 結尾)。
        </p>

        {/* Offline Sync Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100">
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
              <span className="text-sm text-slate-600 animate-pulse">
                {syncProgress}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Upload Card */}
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">上傳試卷</h3>
            <p className="text-slate-500 mb-8 flex-grow">
              拍下你的考卷。Gemini 將協助分析、提取題目、解題，並將所有資料儲存至 Google Sheets。
            </p>
            <Button onClick={() => onNavigate(AppRoute.UPLOAD)} className="w-full">
              開始上傳
            </Button>
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">進行測驗</h3>
            <p className="text-slate-500 mb-8 flex-grow">
              選擇科目與範圍。我們會從你的資料庫隨機抽選題目，並即時評分。
            </p>
            <Button variant="secondary" onClick={() => onNavigate(AppRoute.QUIZ)} className="w-full">
              開始測驗
            </Button>
          </div>
        </div>

        {/* History Card */}
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-8 flex flex-col h-full">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">歷史紀錄</h3>
            <p className="text-slate-500 mb-8 flex-grow">
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