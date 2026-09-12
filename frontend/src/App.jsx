import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FarmerHome from './pages/FarmerHome';
import NewReport from './pages/NewReport';
import ReportStatus from './pages/ReportStatus';

/**
 * App — React Router setup for the farmer interface.
 * All routes are within the mobile-first single-page app.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<FarmerHome />} />
        <Route path="/reports/new"       element={<NewReport />} />
        <Route path="/reports/:reportId" element={<ReportStatus />} />
        {/* Catch-all → home */}
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
