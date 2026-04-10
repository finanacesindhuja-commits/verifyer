import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StaffLogin from './page/StaffLogin';
import Dashboard from './page/Dashboard';
import ApplicationDetails from './page/ApplicationDetails';
import Query from './page/Query';
import PdVerify from './page/PdVerify';
import Sidebar from './components/Sidebar';

function ProtectedRoute({ children, role }) {
  const { user, loading, logout } = useAuth();

  React.useEffect(() => {
    if (!loading && user && role && user.role?.toLowerCase() !== role.toLowerCase()) {
      logout();
    }
  }, [user, loading, role, logout]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role?.toLowerCase() !== role.toLowerCase()) {
    // If user is logged in but has wrong role, wait for useEffect to log them out
    return null;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  if (user) return <Navigate to="/pd-verify" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<StaffLogin />} />

          <Route path="/dashboard" element={
            <ProtectedRoute role="verifier">
              <Sidebar><Dashboard /></Sidebar>
            </ProtectedRoute>
          } />

          <Route path="/query" element={
            <ProtectedRoute role="verifier">
              <Sidebar><Query /></Sidebar>
            </ProtectedRoute>
          } />

          <Route path="/pd-verify" element={
            <ProtectedRoute role="verifier">
              <Sidebar><PdVerify /></Sidebar>
            </ProtectedRoute>
          } />

          <Route path="/application/:id" element={
            <ProtectedRoute role="verifier">
              <Sidebar><ApplicationDetails /></Sidebar>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
