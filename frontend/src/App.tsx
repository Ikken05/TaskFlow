import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import CreateAccountPage from './pages/CreateAccountPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';
import { errorLogger } from './utils/errorLogger';
import './App.css';

// Navigation tracker component
function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧭 Page loaded: ${location.pathname}`);
    errorLogger.logUserAction(`Navigate to ${location.pathname}`, 'Router');
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🚀 TaskFlow Frontend Application Starting`);
    console.log(`[${timestamp}] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${timestamp}] React Version: ${React.version}`);
    console.log(`[${timestamp}] User Agent: ${navigator.userAgent}`);

    // Log when app is ready
    errorLogger.logUserAction('Application Startup', 'App');
  }, []);

  return (
    <ErrorBoundary componentName="App">
      <Router>
        <NavigationTracker />
        <div className="App">
          <Routes>
            <Route path="/" element={
              <ErrorBoundary componentName="SignInPage">
                <SignInPage />
              </ErrorBoundary>
            } />
            <Route path="/signin" element={
              <ErrorBoundary componentName="SignInPage">
                <SignInPage />
              </ErrorBoundary>
            } />
            <Route path="/create-account" element={
              <ErrorBoundary componentName="CreateAccountPage">
                <CreateAccountPage />
              </ErrorBoundary>
            } />
            <Route path="/forgot-password" element={
              <ErrorBoundary componentName="ForgotPasswordPage">
                <ForgotPasswordPage />
              </ErrorBoundary>
            } />
            <Route path="/verify-email" element={
              <ErrorBoundary componentName="VerifyEmailPage">
                <VerifyEmailPage />
              </ErrorBoundary>
            } />
            <Route path="/dashboard" element={
              <ErrorBoundary componentName="DashboardPage">
                <DashboardPage />
              </ErrorBoundary>
            } />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;