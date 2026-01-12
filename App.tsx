import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import QuizPage from './pages/QuizPage';

// Simple Hash Router Implementation
const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);

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

  const navigate = (newRoute: string) => {
    window.location.hash = newRoute;
  };

  const renderPage = () => {
    switch (route) {
      case AppRoute.UPLOAD:
        return <UploadPage />;
      case AppRoute.QUIZ:
        return <QuizPage />;
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
