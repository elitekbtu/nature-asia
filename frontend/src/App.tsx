import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GuestLayout, MainLayout } from './layouts';
import { Home, Login, Register, Logout } from './pages';

// Simple auth check function
const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

// Guest Route Component (redirect to dashboard if already authenticated)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return !isAuthenticated() ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Guest Routes - Public pages with GuestLayout */}
          <Route
            path="/"
            element={
              <GuestRoute>
                <GuestLayout>
                  <Home />
                </GuestLayout>
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <GuestLayout>
                  <Login />
                </GuestLayout>
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <GuestLayout>
                  <Register />
                </GuestLayout>
              </GuestRoute>
            }
          />

          {/* Protected Routes - Authenticated pages with MainLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/disasters"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Disasters</h1>
                    <p className="text-gray-600">Disaster monitoring and management page coming soon...</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                    <p className="text-gray-600">Analytics dashboard coming soon...</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Chat</h1>
                    <p className="text-gray-600">AI-powered chat assistant coming soon...</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/v2v"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">V2V Communication</h1>
                    <p className="text-gray-600">Vehicle-to-vehicle communication system coming soon...</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logout"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Logout />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
