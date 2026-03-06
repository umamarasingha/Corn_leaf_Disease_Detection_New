import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MobileBottomNav from './components/Layout/MobileBottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import DetectDisease from './pages/DetectDisease';
import CommunityFeed from './pages/CommunityFeed';
import Chatbot from './pages/Chatbot';
import AdminDashboard from './pages/admin/AdminDashboard';
import ModelTraining from './pages/admin/ModelTraining';
import DataManagement from './pages/admin/DataManagement';
import UserManagement from './pages/admin/UserManagement';
import AdminSettings from './pages/admin/AdminSettings';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Role-based homepage component
  const RoleBasedHome: React.FC = () => {
    if (user?.role?.toUpperCase() === 'ADMIN') {
      return <AdminDashboard />;
    }
    return <Dashboard />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title={t('CornLeaf AI')}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="w-full p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<RoleBasedHome />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/" replace />} />
              <Route path="/detect" element={<DetectDisease />} />
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/training" element={
                <ProtectedRoute requireAdmin>
                  <ModelTraining />
                </ProtectedRoute>
              } />
              <Route path="/admin/data" element={
                <ProtectedRoute requireAdmin>
                  <DataManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
