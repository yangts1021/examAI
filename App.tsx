import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import QuizPage from './pages/QuizPage';

import HistoryPage from './pages/HistoryPage';

// Simple Hash Router Implementation
const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [pageState, setPageState] = useState<any>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (Object.values(AppRoute).includes(hash as AppRoute)) {
        setRoute(hash as AppRoute);
      } else {
        setRoute(AppRoute.HOME);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newRoute: string, state?: any) => {
    if (state) {
      setPageState(state);
    } else {
      setPageState(null);
    }
    window.location.hash = newRoute;
  };

  const renderPage = () => {
    switch (route) {
      case AppRoute.UPLOAD:
        return <UploadPage />;
      case AppRoute.QUIZ:
        return <QuizPage
          initialQuestions={pageState?.reviewQuestions}
          initialSubject={pageState?.subject}
          initialScope={pageState?.scope}
        />;
      case AppRoute.HISTORY:
        return <HistoryPage onNavigate={navigate} />;
      case AppRoute.HOME:
      default:
        return <HomePage onNavigate={(r) => navigate(r)} />;
    }
  };

  return (
    <Layout activeTab={route} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
};

export default App;
