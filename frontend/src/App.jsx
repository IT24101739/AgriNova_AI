import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DiagnosisResult from './pages/DiagnosisResult';
import AdditionalInfo from './pages/AdditionalInfo';
import FarmerAlerts from './pages/FarmerAlerts';

function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-2">
          <span className="text-3xl">🌾</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          AgriShield / CropGuard AI
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto leading-relaxed">
          Developer 2 Slice: Smart Diagnosis Engine, Weather Check, Regional Outbreak Scanning, Multilingual Treatment Advice & Farmer Alerts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100">
          <Link
            to="/results/demo-123"
            className="group block p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition bg-slate-50 hover:bg-emerald-50/30"
          >
            <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex items-center justify-between">
              Diagnosis Result
              <span>→</span>
            </div>
            <p className="text-xs text-slate-500">View smart diagnosis, weather risk, outbreak alert, and AI treatment guidance.</p>
          </Link>

          <Link
            to="/additional-info/demo-123"
            className="group block p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition bg-slate-50 hover:bg-emerald-50/30"
          >
            <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex items-center justify-between">
              Additional Photo
              <span>→</span>
            </div>
            <p className="text-xs text-slate-500">Farmer prompt when model confidence is low or uncertain.</p>
          </Link>

          <Link
            to="/alerts"
            className="group block p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition bg-slate-50 hover:bg-emerald-50/30"
          >
            <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1 flex items-center justify-between">
              Farmer Alerts
              <span>→</span>
            </div>
            <p className="text-xs text-slate-500">Regional disease outbreaks and weather-driven advisory warnings.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 font-bold text-lg text-emerald-800">
              <span className="text-2xl">🌱</span>
              <span className="tracking-tight">AgriShield AI</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold ml-2">Dev 2 Slice</span>
            </Link>

            <nav className="flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link to="/results/demo-123" className="hover:text-emerald-600 transition">Diagnosis</Link>
              <Link to="/additional-info/demo-123" className="hover:text-emerald-600 transition">Upload Extra Photo</Link>
              <Link to="/alerts" className="hover:text-emerald-600 transition">Regional Alerts</Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results/:reportId" element={<DiagnosisResult />} />
            <Route path="/additional-info/:reportId" element={<AdditionalInfo />} />
            <Route path="/alerts" element={<FarmerAlerts />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          AgriShield / CropGuard AI • CodeArena'26 Topic 05 • Feature Slice 2
        </footer>
      </div>
    </BrowserRouter>
  );
}
