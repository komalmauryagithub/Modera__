import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPlaceholder from './pages/DashboardPlaceholder';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-layout">
          <Navbar />
          <main className="app-content">
            <Routes>
              {/* Public Authentication Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPlaceholder pageTitle="Calendar Dashboard" />
                  </ProtectedRoute>
                }
              />
              <Route path="/calendar" element={<Navigate to="/" replace />} />
              <Route
                path="/gallery"
                element={
                  <ProtectedRoute>
                    <DashboardPlaceholder pageTitle="Photo Gallery" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upcoming"
                element={
                  <ProtectedRoute>
                    <DashboardPlaceholder pageTitle="Upcoming Events" />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
