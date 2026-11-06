import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts & Pages
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TraineesPage from './pages/TraineesPage';
import TraineeProfilePage from './pages/TraineeProfilePage';
import TradesPage from './pages/TradesPage';
import ProgrammesPage from './pages/ProgrammesPage';
import BatchesPage from './pages/BatchesPage';
import AllocationsPage from './pages/AllocationsPage';
import AttendancePage from './pages/AttendancePage';
import DiaryPage from './pages/DiaryPage';
import AssessmentsPage from './pages/AssessmentsPage';
import MentorFeedbackPage from './pages/MentorFeedbackPage';
import CertificatesPage from './pages/CertificatesPage';
import VerificationPage from './pages/VerificationPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-800"></div>
        <span className="ml-3 font-medium">Validating institutional session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/verify/:certId" element={<VerificationPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="trainees" element={<TraineesPage />} />
            <Route path="trainees/:id" element={<TraineeProfilePage />} />
            <Route path="trades" element={<TradesPage />} />
            <Route path="programmes" element={<ProgrammesPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="diary" element={<DiaryPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="mentor-feedback" element={<MentorFeedbackPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
