import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Auth Context & Route Guard
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Global Navigation Bar & Login Portal
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';

// Member 1 Pages (Slice 1: Farmer Image Reporting)
import FarmerHome from './pages/FarmerHome';
import NewReport from './pages/NewReport';
import ReportStatus from './pages/ReportStatus';

// Member 2 Pages (Slice 2: Smart Diagnosis & Farmer Advisory)
import DiagnosisResult from './pages/DiagnosisResult';
import AdditionalInfo from './pages/AdditionalInfo';
import FarmerAlerts from './pages/FarmerAlerts';

// Member 3 Pages (Slice 3: Agriculture Officer Dashboard & Outbreak Management)
import OfficerSidebar from './components/OfficerSidebar';
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerTicket from './pages/OfficerTicket';
import RegionalMap from './pages/RegionalMap';
import FieldVisit from './pages/FieldVisit';
import OutbreaksPage from './pages/OutbreaksPage';
import AIFeedbackPage from './pages/AIFeedbackPage';

// Research Lab & System Admin Pages
import LabDashboard from './pages/LabDashboard';
import AdminDashboard from './pages/AdminDashboard';

/** Officer layout – sidebar + main content area with seamless header integration */
function OfficerLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#05130b]">
      <OfficerSidebar />
      <main className="ml-60 flex-1 p-6 md:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#05130b] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {/* Global persistent unified Navbar */}
        <Navbar />

        {/* Main Routed Content Area */}
        <div className="flex-1 flex flex-col">
          <Routes>
            {/* ── Entry Point is the Login Portal ── */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* ── Feature Slice 1 & 2: Farmer Portal ── */}
            <Route path="/farmer" element={<FarmerHome />} />
            <Route path="/reports/new" element={<NewReport />} />
            <Route path="/reports/:reportId" element={<ReportStatus />} />
            <Route path="/results/:reportId" element={<DiagnosisResult />} />
            <Route path="/additional-info/:reportId" element={<AdditionalInfo />} />
            <Route path="/alerts" element={<FarmerAlerts />} />

            {/* ── Feature Slice 3: Officer Dashboard & Outbreak Management (Protected) ── */}
            <Route
              path="/officer"
              element={
                <ProtectedRoute requiredRole="officer">
                  <OfficerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OfficerDashboard />} />
              <Route path="tickets" element={<OfficerDashboard />} />
              <Route path="tickets/:ticketId" element={<OfficerTicket />} />
              <Route path="tickets/:ticketId/field-visit" element={<FieldVisit />} />
              <Route path="map" element={<RegionalMap />} />
              <Route path="outbreaks" element={<OutbreaksPage />} />
              <Route path="feedback" element={<AIFeedbackPage />} />
            </Route>

            {/* ── Research Lab Console (Protected) ── */}
            <Route
              path="/lab"
              element={
                <ProtectedRoute requiredRole="lab">
                  <LabDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── System Admin Console (Protected) ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Route aliases for Officer convenience */}
            <Route path="/tickets" element={<Navigate to="/officer/tickets" replace />} />
            <Route path="/tickets/:ticketId" element={<Navigate to="/officer/tickets/:ticketId" replace />} />
            <Route path="/map" element={<Navigate to="/officer/map" replace />} />
            <Route path="/visits" element={<Navigate to="/officer/tickets" replace />} />
            <Route path="/outbreaks" element={<Navigate to="/officer/outbreaks" replace />} />
            <Route path="/ai-feedback" element={<Navigate to="/officer/feedback" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="min-h-[calc(100vh-4rem)] bg-[#080d1a] flex items-center justify-center p-6">
                <div className="glass rounded-2xl p-8 max-w-md text-center border border-white/10 shadow-2xl">
                  <p className="text-7xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-3">404</p>
                  <h2 className="text-lg font-bold text-white mb-2">Page Not Found</h2>
                  <p className="text-xs text-slate-400 mb-6">The route you are trying to visit does not exist or has moved.</p>
                  <div className="flex items-center justify-center gap-3">
                    <a href="/" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all">
                      🔐 Login Portal
                    </a>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}
