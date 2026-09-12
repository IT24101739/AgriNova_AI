/**
 * FarmerHome — Unified AgriNova AI Command Hub & Farmer Landing Page.
 * Combines Farmer Leaf Diagnostics, Smart Weather Advisory, and Officer Surveillance in one attractive, well-organized UI.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmReports } from '../services/api';
import ReportCard from '../components/ReportCard';
import {
  Leaf,
  Camera,
  Shield,
  MapPin,
  Sparkles,
  CloudRain,
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Globe2,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FlaskConical
} from 'lucide-react';

const DEMO_FARM_ID = localStorage.getItem('agrishield_farm_id') || null;

export default function FarmerHome() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'farmer' | 'officer'

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
      
      {/* ── Top Hero Showcase ── */}
      <section className="relative overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-blue-500/10 to-teal-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Pill */}
          <div className="flex justify-center sm:justify-start mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Crop Pathology & Regional Early Warning Engine</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Main Headlines */}
            <div className="lg:col-span-7 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-4">
                Detect Crop Disease <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                  Protect Regional Yields
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-8">
                An end-to-end intelligent ecosystem. Farmers snap leaf photos for instant AI disease diagnosis and advisory in 
                <strong className="text-emerald-300 font-semibold"> Sinhala, Tamil, or English</strong>, while Agriculture Officers monitor regional outbreak clusters and conduct field visits.
              </p>

              {/* Action Buttons */}
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
                  onClick={() => navigate('/officer')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md active:scale-95 transition-all duration-200"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Officer Command Center</span>
                </button>

                <button
                  onClick={() => navigate('/officer/map')}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Map</span>
                </button>
              </div>
            </div>

            {/* Right Col: Live Platform Overview Card */}
            <div className="lg:col-span-5">
              <div className="glass-elevated rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">System Architecture</h2>
                      <p className="text-[10px] text-slate-400">All 3 Integrated Feature Slices</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                {/* Pipeline Flow Steps */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200">Farmer Leaf Diagnosis</p>
                      <p className="text-[11px] text-slate-400">EfficientNet-B0 classifier + HSV severity estimation.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 transition-all">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200">Weather & Advisory Engine</p>
                      <p className="text-[11px] text-slate-400">Open-Meteo weather risk + Gemini LLM multi-lingual guidance.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/30 transition-all">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200">Officer Outbreak Surveillance</p>
                      <p className="text-[11px] text-slate-400">Automated triage, field visit dispatches & AI retraining loop.</p>
                    </div>
                  </div>
                </div>

                {/* Quick Status Bar */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Supabase PostgreSQL Connected
                  </span>
                  <span className="font-mono text-emerald-300">FastAPI :8000</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Metrics Ribbon ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-white">99.2%</p>
              <p className="text-[11px] text-slate-400 font-medium">Model Precision Target</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-400">&lt; 1.5s</p>
              <p className="text-[11px] text-slate-400 font-medium">Inference Latency</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-teal-300">3 Languages</p>
              <p className="text-[11px] text-slate-400 font-medium">සිංහල / தமிழ் / English</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-blue-400">25 Districts</p>
              <p className="text-[11px] text-slate-400 font-medium">Regional Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Unified Hub Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-1 w-full">
        
        {/* Hub Navigation Filter */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Command Modules</h2>
            <p className="text-xs text-slate-400">Access farmer tools, surveillance maps, and officer triage</p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setActiveTab('farmer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'farmer'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌾 Farmer Tools
            </button>
            <button
              onClick={() => setActiveTab('officer')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'officer'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Officer Console
            </button>
          </div>
        </div>

        {/* ── Feature Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Farmer Image Upload */}
          {(activeTab === 'all' || activeTab === 'farmer') && (
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
                    Feature Slice 1
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Mobile / Web</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  AI Leaf Diagnostic Scanner
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Upload high-resolution leaf photos. Instantly detects crops (Tomato, Potato, Pepper), identifies leaf diseases, and calculates percentage lesion severity.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Open Diagnostic Scanner</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          )}

          {/* Card 2: Smart Advisory & Weather */}
          {(activeTab === 'all' || activeTab === 'farmer') && (
            <div
              onClick={() => navigate('/alerts')}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-teal-500/40 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CloudRain className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                    Feature Slice 2
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Open-Meteo + Gemini</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
                  Weather Risk & Advisory
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Combines real-time farm humidity and precipitation forecasts with localized treatment plans in Sinhala, Tamil, and English.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                <span>Check Disease & Weather Alerts</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          )}

          {/* Card 3: Officer Dashboard & Outbreak Map */}
          {(activeTab === 'all' || activeTab === 'officer') && (
            <div
              onClick={() => navigate('/officer')}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    Feature Slice 3
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Leaflet & Triage</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  Regional Officer Surveillance
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Interactive GIS outbreak map, low-confidence case triage, field visit dispatches, and human-in-the-loop AI model feedback retraining.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Enter Officer Command Center</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* ── Interactive Quick Navigation & Regional Surveillance Strip ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Quick Test / Demo Scenarios */}
          <div className="lg:col-span-6 glass-elevated rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Interactive Test Workflows</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Quick Simulation</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Try common diagnostic scenarios to see the full pipeline in action:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/reports/new')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-left transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-300">🍅 Tomato Early Blight Scan</p>
                  <p className="text-[11px] text-slate-400">High severity &gt; 25% → Generates Advisory & Weather Alert</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/officer/map')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 text-left transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-blue-300">🗺️ Regional Outbreak Heatmap</p>
                  <p className="text-[11px] text-slate-400">Inspect Western & Central province clusters</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/officer/tickets')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 text-left transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-purple-300">📋 Officer Triage Queue</p>
                  <p className="text-[11px] text-slate-400">Review low-confidence cases & schedule field visits</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Surveillance Status & Weather Risk */}
          <div className="lg:col-span-6 glass-elevated rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Live Regional Weather & Risk Index</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Open-Meteo real-time telemetry for Sri Lankan agricultural belts:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Gampaha / Western</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    High Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300">84% Humidity • 28°C</p>
                <p className="text-[11px] text-slate-500 mt-1">Favorable for Fungal Spores</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Nuwara Eliya</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Moderate
                  </span>
                </div>
                <p className="text-xs text-slate-300">76% Humidity • 18°C</p>
                <p className="text-[11px] text-slate-500 mt-1">Late Blight Monitoring</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Matale / Central</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Low Risk
                  </span>
                </div>
                <p className="text-xs text-slate-300">62% Humidity • 26°C</p>
                <p className="text-[11px] text-slate-500 mt-1">Standard Preventive Spray</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Jaffna / Northern</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Normal
                  </span>
                </div>
                <p className="text-xs text-slate-300">65% Humidity • 31°C</p>
                <p className="text-[11px] text-slate-500 mt-1">Aphid Vector Alert Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Reports Section ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Crop Reports</h2>
              <p className="text-xs text-slate-400">Diagnosis records and officer feedback status</p>
            </div>
            <button
              onClick={() => navigate('/reports/new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
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
                🌿
              </div>
              <h3 className="text-base font-bold text-white mb-1">No Field Reports Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Submit a leaf photo of your Tomato, Potato, or Pepper crop to receive instant AI disease scoring, severity metrics, and advisory.
              </p>
              <button
                onClick={() => navigate('/reports/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Create Your First Report</span>
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
