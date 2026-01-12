import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">ExamAI 考題大師</h1>
          </div>
          <nav className="flex space-x-4">
            <button 
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              首頁
            </button>
            <button 
              onClick={() => onNavigate('upload')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'upload' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              上傳試卷
            </button>
            <button 
              onClick={() => onNavigate('quiz')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'quiz' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              開始測驗
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} ExamAI 考題大師. Powered by Gemini.
        </div>
      </footer>
    </div>
  );
};

export default Layout;