import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useMeetings } from './context/MeetingContext';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Toast from './components/common/Toast';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import GenerateTranscriptPage from './pages/GenerateTranscriptPage';
import ProcessingMeetingPage from './pages/ProcessingMeetingPage';
import TranscriptPage from './pages/TranscriptPage';
import AIAnalysisLoadingPage from './pages/AIAnalysisLoadingPage';
import ResultsDashboardPage from './pages/ResultsDashboardPage';
import MyMeetingsPage from './pages/MyMeetingsPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { isAuthenticated } = useAuth();
  const { currentStep, setCurrentStep } = useMeetings();
  const [activePage, setActivePage] = useState('home');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Unified robust navigation handler
  const navigateTo = useCallback((page) => {
    // If navigating to new-transcript from anywhere, reset pipeline step to idle to show form
    if (page === 'new-transcript' || page === 'generate-transcript') {
      setCurrentStep('idle');
      setActivePage('new-transcript');
      if (window.location.hash !== '#/new-transcript') {
        window.history.pushState(null, '', '#/new-transcript');
      }
      return;
    }

    setActivePage(page);
    const cleanHash = `#/${page}`;
    if (window.location.hash !== cleanHash) {
      window.history.pushState(null, '', cleanHash);
    }
  }, [setCurrentStep]);

  // Synchronize route on initial load and handle browser Back / Forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const pathname = window.location.pathname.replace(/^\//, '').trim();
      const route = hash || pathname;

      const validRoutes = [
        'home', 
        'new-transcript', 
        'generate-transcript', 
        'my-meetings', 
        'calendar', 
        'reports', 
        'settings', 
        'transcript', 
        'results',
        'analyzing'
      ];

      if (route && validRoutes.includes(route)) {
        const normalized = (route === 'generate-transcript' || route === 'new-transcript') ? 'new-transcript' : route;
        if (normalized === 'new-transcript') {
          setCurrentStep('idle');
        }
        setActivePage(normalized);
      }
    };

    handleLocationChange();

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [setCurrentStep]);

  // If user is not logged in, show the login page
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toast />
      </>
    );
  }

  const renderContent = () => {
    // New Transcript pipeline page
    if (activePage === 'new-transcript') {
      if (currentStep === 'joining') {
        return <ProcessingMeetingPage />;
      }
      if (currentStep === 'transcript_ready') {
        return (
          <TranscriptPage 
            onStartAnalysis={() => {
              setCurrentStep('analyzing');
              navigateTo('analyzing');
            }} 
          />
        );
      }
      if (currentStep === 'analyzing') {
        return (
          <AIAnalysisLoadingPage 
            onComplete={() => {
              setCurrentStep('idle');
              navigateTo('results');
            }} 
          />
        );
      }
      // Always show Generate New Transcript form when idle
      return <GenerateTranscriptPage onStartProcessing={() => setCurrentStep('joining')} />;
    }

    if (activePage === 'transcript') {
      return (
        <TranscriptPage 
          onStartAnalysis={() => {
            setCurrentStep('analyzing');
            navigateTo('analyzing');
          }} 
        />
      );
    }

    if (activePage === 'analyzing') {
      return (
        <AIAnalysisLoadingPage 
          onComplete={() => {
            setCurrentStep('idle');
            navigateTo('results');
          }} 
        />
      );
    }

    if (activePage === 'results') {
      return <ResultsDashboardPage setActivePage={navigateTo} />;
    }

    if (activePage === 'my-meetings') {
      return <MyMeetingsPage setActivePage={navigateTo} />;
    }

    if (activePage === 'calendar') {
      return <CalendarPage setActivePage={navigateTo} />;
    }

    if (activePage === 'reports') {
      return <ReportsPage setActivePage={navigateTo} />;
    }

    if (activePage === 'settings') {
      return <SettingsPage setActivePage={navigateTo} />;
    }

    // Default: Home Page
    return <HomePage setActivePage={navigateTo} />;
  };

  return (
    <div className="app-container">
      {/* Persistent Left Sidebar */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={navigateTo} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header 
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} 
          setActivePage={navigateTo} 
        />

        <main className="content-container">
          {renderContent()}
        </main>
      </div>

      {/* Global Toast System */}
      <Toast />
    </div>
  );
}
