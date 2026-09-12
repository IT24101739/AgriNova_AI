import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
      {/* Main content offset by sidebar width */}
      <main className="ml-60 flex-1 p-6 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Redirect root → officer dashboard */}
      <Route path="/" element={<Navigate to="/officer" replace />} />

      {/* Officer section */}
      <Route path="/officer" element={<OfficerLayout />}>
        <Route index element={<OfficerDashboard />} />
        <Route path="tickets" element={<OfficerDashboard />} />
        <Route path="tickets/:ticketId" element={<OfficerTicket />} />
        <Route path="tickets/:ticketId/field-visit" element={<FieldVisit />} />
        <Route path="map" element={<RegionalMap />} />
        <Route path="outbreaks" element={<OutbreaksPage />} />
        <Route path="feedback" element={<AIFeedbackPage />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <p className="text-8xl font-black gradient-text mb-4">404</p>
            <p className="text-slate-400 mb-6">Page not found</p>
            <a href="/officer" className="btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}
