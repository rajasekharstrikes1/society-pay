import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionCheck from './components/SubscriptionCheck';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

import Login from './pages/Auth/Login';
import CommunitySignup from './pages/Auth/CommunitySignup';
import SelectSubscription from './pages/Auth/SelectSubscription';
import PaymentSuccess from './pages/Auth/PaymentSuccess';
import SubscriptionExpired from './pages/Auth/SubscriptionExpired';
import Unauthorized from './pages/Auth/Unauthorized';

import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import Communities from './pages/SuperAdmin/Communities';
import Subscriptions from './pages/SuperAdmin/Subscriptions';
import SuperAdminPayments from './pages/SuperAdmin/Payments';
import SuperAdminReports from './pages/SuperAdmin/Reports';
import SuperAdminSettings from './pages/SuperAdmin/Settings';

import CommunityAdminDashboard from './pages/CommunityAdmin/Dashboard';
import BlocksFlats from './pages/CommunityAdmin/BlocksFlats';
import Tenants from './pages/CommunityAdmin/Tenants';
import Maintenance from './pages/CommunityAdmin/Maintenance';
import Notifications from './pages/CommunityAdmin/Notifications';
import CommunityReports from './pages/CommunityAdmin/Reports';
import Settings from './pages/CommunityAdmin/Settings';

// Import subscription utilities
import { shouldBypassSubscriptionCheck } from './utils/subscriptionUtils';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

// Custom component to handle subscription checks with bypass logic
function SubscriptionProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole: string }) {
  // Check if we should bypass subscription checks (after payment, etc.)
  const bypassSubscription = shouldBypassSubscriptionCheck();
  
  // If we should bypass subscription checks, render without SubscriptionCheck
  if (bypassSubscription) {
    console.log('🔓 Bypassing subscription check due to recent payment or manual override');
    return (
      <ProtectedRoute requiredRole={requiredRole as any}>
        {children}
      </ProtectedRoute>
    );
  }
  
  // Otherwise, use normal subscription check
  return (
    <ProtectedRoute requiredRole={requiredRole as any}>
      <SubscriptionCheck>
        {children}
      </SubscriptionCheck>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { userProfile } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<CommunitySignup />} />
      <Route path="/select-subscription" element={<SelectSubscription />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/subscription-expired" element={<SubscriptionExpired />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Super Admin Routes */}
      <Route path="/super-admin" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><SuperAdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/communities" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><Communities /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/subscriptions" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><Subscriptions /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/payments" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><SuperAdminPayments /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/reports" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><SuperAdminReports /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/settings" element={
        <ProtectedRoute requiredRole="super_admin">
          <AppLayout><SuperAdminSettings /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Community Admin Routes - Using our custom SubscriptionProtectedRoute */}
      <Route path="/admin" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><CommunityAdminDashboard /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/blocks" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><BlocksFlats /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/tenants" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><Tenants /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/maintenance" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><Maintenance /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/notifications" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><Notifications /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><CommunityReports /></AppLayout>
        </SubscriptionProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <SubscriptionProtectedRoute requiredRole="community_admin">
          <AppLayout><Settings /></AppLayout>
        </SubscriptionProtectedRoute>
      } />

      {/* Root Redirect */}
      <Route path="/" element={
        <Navigate to={
          userProfile?.role === 'super_admin'
            ? '/super-admin'
            : userProfile?.role === 'community_admin'
              ? '/admin'
              : '/login'
        } replace />
      } />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}