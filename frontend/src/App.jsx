import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Member 1 Pages
import FarmerHome from './pages/FarmerHome';
import NewReport from './pages/NewReport';
import ReportStatus from './pages/ReportStatus';

// Member 2 Pages
import DiagnosisResult from './pages/DiagnosisResult';
import AdditionalInfo from './pages/AdditionalInfo';
import FarmerAlerts from './pages/FarmerAlerts';

/**
 * App — Unified React Router setup for AgriShield.
 * Includes Feature Slice 1 (Image reporting) and Feature Slice 2 (Diagnosis & Advisory).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Slice 1: Reporting Flow */}
        <Route path="/" element={<FarmerHome />} />
        <Route path="/reports/new" element={<NewReport />} />
        <Route path="/reports/:reportId" element={<ReportStatus />} />

        {/* Slice 2: Smart Diagnosis & Farmer Advisory */}
        <Route path="/results/:reportId" element={<DiagnosisResult />} />
        <Route path="/additional-info/:reportId" element={<AdditionalInfo />} />
        <Route path="/alerts" element={<FarmerAlerts />} />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
