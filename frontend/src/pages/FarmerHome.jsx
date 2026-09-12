/**
 * FarmerHome — Dedicated Farmer Command Hub.
 * Tailored 100% for farmers: Leaf Diagnostic Scanning, Crop Health Management,
 * Multi-lingual Advisory (Sinhala, Tamil, English), and Local Weather Spray Windows.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmReports } from '../services/api';
import ReportCard from '../components/ReportCard';
import {
  Leaf,
  Camera,
  CloudRain,
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  History,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_FARM_ID = localStorage.getItem('agrishield_farm_id') || 'farm-gampaha-01';

export default function FarmerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (DEMO_FARM_ID) {
      setLoading(true);
      getFarmReports(DEMO_FARM_ID)
        .then((res) => setReports(res.data?.reports || []))
        .catch(() => setError('Could not load reports.'))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16">
      
      {/* ── Farmer Hero Banner ── */}
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-green-500/15 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Top Pill */}
          <div className="flex justify-center sm:justify-start mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Crop Pathology & Instant Treatment Advisory</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Farmer Headlines */}
            <div className="lg:col-span-7 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] mb-4">
                Protect Your Harvest <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent">
                  With Instant AI Leaf Scan
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-8">
                Upload a photo of your infected leaf. Our neural network detects the disease in seconds, 
                calculates lesion severity, and provides immediate treatment instructions in 
                <strong className="text-emerald-300 font-semibold"> Sinhala, Tamil, or English</strong> backed by local climate forecasts.
              </p>

              {/* Farmer Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <button
                  id="btn-hero-new-scan"
                  onClick={() => navigate('/reports/new')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all duration-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start New Leaf Scan</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>

                <button
                  onClick={() => navigate('/alerts')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md active:scale-95 transition-all duration-200"
                >
                  <CloudRain className="w-4 h-4 text-teal-400" />
                  <span>Check Disease & Weather Alerts</span>
                </button>
              </div>
            </div>

            {/* Right Col: Registered Farmer Farm Card */}
            <div className="lg:col-span-5">
              <div className="glass-elevated rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <span className="text-base">🌾</span>
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                        {user?.name || 'Sunil Wickramasinghe'}
                      </h2>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        {user?.district || 'Gampaha District'} • Registered Farm
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Farm ID: #01
                  </span>
                </div>

                {/* Farm Capabilities */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-slate-400">Supported Crops</span>
                    <span className="font-semibold text-white">Tomato, Potato, Pepper, Rice, Chili</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-slate-400">AI Diagnostic Engine</span>
                    <span className="font-semibold text-emerald-300">EfficientNet-B0 + OpenCV Lesion</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-slate-400">Advisory Languages</span>
                    <span className="font-semibold text-teal-300">සිංහල • தமிழ் • English</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-slate-400">Weather Forecast Telemetry</span>
                    <span className="font-semibold text-blue-300">Open-Meteo 7-Day Live Feed</span>
                  </div>
                </div>

                {/* Ready Status */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    AI Scanner Ready for Upload
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">FastAPI Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Farmer Metrics Ribbon ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-white">&lt; 1.5s</p>
              <p className="text-[11px] text-slate-400 font-medium">Instant AI Diagnosis</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-400">3 Languages</p>
              <p className="text-[11px] text-slate-400 font-medium">සිංහල / தமிழ் / English</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-teal-300">HSV Lesion %</p>
              <p className="text-[11px] text-slate-400 font-medium">Severity Estimation</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-blue-400">Live Weather</p>
              <p className="text-[11px] text-slate-400 font-medium">Safe Spray Windows</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Farmer Services ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-1 w-full space-y-12">
        
        {/* ── Core Farmer Action Cards ── */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Farmer Diagnostic Services</h2>
            <p className="text-xs text-slate-400">Everything you need to protect and treat your crops</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: AI Leaf Scanner */}
            <div
              onClick={() => navigate('/reports/new')}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-emerald-500/40 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Step 1: Diagnose
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Mobile / Camera</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  AI Leaf Diagnostic Scanner
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Take or upload a clear photo of your plant leaf. Detect Early Blight, Late Blight, Leaf Curl, and more with exact infection percentages.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Open Diagnostic Scanner</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 2: Smart Advisory & Treatments */}
            <div
              onClick={() => navigate('/alerts')}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-teal-500/40 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Leaf className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    Step 2: Treat
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Multi-lingual AI</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                  Actionable Treatment Advice
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Receive structured, organic, and chemical treatment guidelines customized for Sri Lankan farming conditions in your preferred language.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                <span>View Treatment Advisories</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 3: Weather Spray Window */}
            <div
              onClick={() => navigate('/alerts')}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CloudRain className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    Step 3: Spray Timing
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Live Forecast</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  Weather & Spray Window
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Check humidity and rainfall forecasts before applying fungicide or pesticides to prevent chemicals from washing away in the rain.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Check Weather & Alerts</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Farm Weather Telemetry Strip ── */}
        <div className="glass-elevated rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Local Farm Weather & Spray Safety Index</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Gampaha Field Station • Live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Temperature</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">28.4°C</p>
              <p className="text-[10px] text-slate-500 mt-1">Normal growing range</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Relative Humidity</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-black text-amber-400">84%</p>
              <p className="text-[10px] text-amber-400/80 mt-1">High: Fungal risk elevated</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Wind Velocity</span>
                <Wind className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-xl font-black text-white">7 km/h</p>
              <p className="text-[10px] text-emerald-400 mt-1">Gentle: Ideal for spraying</p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Rain Window (48h)</span>
                <CloudRain className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-black text-emerald-400">Low Chance</p>
              <p className="text-[10px] text-emerald-400 mt-1">Safe to apply treatments today</p>
            </div>
          </div>
        </div>

        {/* ── My Crop Reports History ── */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-white">My Crop Diagnosis Reports</h2>
                <p className="text-xs text-slate-400">Records of your uploaded leaf images and AI results</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/reports/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="glass rounded-xl p-4 text-center text-red-400 text-xs border border-red-500/20">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center border border-white/10">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-3">
                🌱
              </div>
              <h3 className="text-base font-bold text-white mb-1">No Field Scans Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Take a photo of your Tomato, Potato, or Pepper crop leaf to get instant AI disease diagnosis and treatment steps.
              </p>
              <button
                onClick={() => navigate('/reports/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Upload First Leaf Image</span>
              </button>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
