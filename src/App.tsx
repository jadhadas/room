import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TenantsPage from './pages/TenantsPage';
import TenantProfilePage from './pages/TenantProfilePage';
import RentTrackingPage from './pages/RentTrackingPage';
import MessTrackingPage from './pages/MessTrackingPage';
import DepositManagementPage from './pages/DepositManagementPage';
import RoomsPage from './pages/RoomsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" expand={false} richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
          <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
          <Route path="/tenants/:id" element={<ProtectedRoute><TenantProfilePage /></ProtectedRoute>} />
          <Route path="/rent" element={<ProtectedRoute><RentTrackingPage /></ProtectedRoute>} />
          <Route path="/mess" element={<ProtectedRoute><MessTrackingPage /></ProtectedRoute>} />
          <Route path="/deposits" element={<ProtectedRoute><DepositManagementPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App