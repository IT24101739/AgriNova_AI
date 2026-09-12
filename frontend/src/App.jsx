import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

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

/** Officer layout – sidebar + main content area */
function OfficerLayout() {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <OfficerSidebar />
      <main className="ml-60 flex-1 p-6 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Feature Slice 1: Farmer Image Upload & Reporting ── */}
      <Route path="/" element={<FarmerHome />} />
      <Route path="/reports/new" element={<NewReport />} />
      <Route path="/reports/:reportId" element={<ReportStatus />} />

      {/* ── Feature Slice 2: Smart Diagnosis & Farmer Advisory ── */}
      <Route path="/results/:reportId" element={<DiagnosisResult />} />
      <Route path="/additional-info/:reportId" element={<AdditionalInfo />} />
      <Route path="/alerts" element={<FarmerAlerts />} />

      {/* ── Feature Slice 3: Officer Dashboard & Outbreak Management ── */}
      <Route path="/officer" element={<OfficerLayout />}>
        <Route index element={<OfficerDashboard />} />
        <Route path="tickets" element={<OfficerDashboard />} />
        <Route path="tickets/:ticketId" element={<OfficerTicket />} />
        <Route path="tickets/:ticketId/field-visit" element={<FieldVisit />} />
        <Route path="map" element={<RegionalMap />} />
        <Route path="outbreaks" element={<OutbreaksPage />} />
        <Route path="feedback" element={<AIFeedbackPage />} />
      </Route>

      {/* Route aliases for Officer convenience */}
      <Route path="/tickets" element={<Navigate to="/officer/tickets" replace />} />
      <Route path="/tickets/:ticketId" element={<Navigate to="/officer/tickets/:ticketId" replace />} />
      <Route path="/map" element={<Navigate to="/officer/map" replace />} />
      <Route path="/visits" element={<Navigate to="/officer/tickets" replace />} />
      <Route path="/outbreaks" element={<Navigate to="/officer/outbreaks" replace />} />
      <Route path="/ai-feedback" element={<Navigate to="/officer/feedback" replace />} />

      {/* 404 Fallback */}
      <Route path="*" element={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <p className="text-8xl font-black gradient-text mb-4">404</p>
            <p className="text-slate-400 mb-6">Page not found</p>
            <a href="/" className="btn-primary mr-4">Farmer Portal</a>
            <a href="/officer" className="btn-secondary">Officer Dashboard</a>
          </div>
        </div>
      } />
    </Routes>
  );
}
