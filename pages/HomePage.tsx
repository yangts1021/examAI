import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { AppRoute } from '../types';
import { getGasUrl, setGasUrl } from '../services/gasService';

interface HomePageProps {
  onNavigate: (page: AppRoute) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [gasUrl, setGasUrlState] = useState('');

  useEffect(() => {
    setGasUrlState(getGasUrl());
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setGasUrlState(newUrl);
    setGasUrl(newUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <div className="text-center space-y-4 max-w-2xl">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
          AI 智慧助攻，考試更輕鬆
        </h2>
        <p className="text-xl text-slate-600">
          上傳試卷自動數位化，或使用 AI 生成測驗自我挑戰。
        </p>
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
        </div>
        <p className="text-xs text-slate-500 mt-2">
          請貼上部署為「網頁應用程式」後的網址 (以 <code>/exec</code> 結尾)。
        </p>
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