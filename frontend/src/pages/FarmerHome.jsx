/**
 * FarmerHome — Dedicated Farmer Command Hub with Rich Agricultural Visuals.
 * Tailored 100% for farmers: Leaf Diagnostic Scanning, Crop Health Management,
 * Multi-lingual Advisory (Sinhala, Tamil, English), and Local Weather Spray Windows.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmReports, getReports, deleteReport, deleteReports } from '../services/api';
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
  Sparkles,
  Sun,
  Wind,
  Droplets,
  History,
  ShieldCheck,
  Sprout,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FarmerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedReportIds, setSelectedReportIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const farmerId = (filterMode === 'my' && (user?.farmer_id || user?.id))
        ? (user.farmer_id || user.id)
        : undefined;

      const res = await getReports(farmerId ? { farmer_id: farmerId } : { limit: 50 });
      setReports(res?.data?.reports || []);
      setSelectedReportIds(new Set());
    } catch (err) {
      console.error('Failed to load past reports from Supabase:', err);
      setError('Could not load reports from Supabase database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user, filterMode]);

  const handleToggleSelect = (reportId) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedReportIds.size === reports.length) {
      setSelectedReportIds(new Set());
    } else {
      setSelectedReportIds(new Set(reports.map((r) => r.id)));
    }
  };

  const handleDeleteSingle = async (reportId) => {
    const reportItem = reports.find((r) => r.id === reportId);
    const label = reportItem?.crop ? `${reportItem.crop} scan` : 'this report';
    if (!window.confirm(`Are you sure you want to delete ${label} from the Supabase database?`)) {
      return;
    }

    setIsDeleting(true);
    setActionMessage('');
    try {
      await deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setSelectedReportIds((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
      setActionMessage('Report successfully deleted from database.');
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Failed to delete report. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    const count = selectedReportIds.size;
    if (count === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${count} selected report(s) from Supabase database? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setActionMessage('');
    try {
      const idsToDelete = Array.from(selectedReportIds);
      await deleteReports(idsToDelete);
      setReports((prev) => prev.filter((r) => !selectedReportIds.has(r.id)));
      setSelectedReportIds(new Set());
      setActionMessage(`Successfully deleted ${count} selected report(s) from database.`);
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      console.error('Failed to delete reports:', err);
      alert('Failed to delete selected reports. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05130b] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16">
      
      {/* ── Farmer Hero Banner with Agricultural Landscape Backdrop ── */}
      <section className="relative overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/20">
        
        {/* Real Agricultural Background Image with soft gradient blending */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_farmer.jpg"
            alt="Sri Lankan terraced rice paddies at golden hour"
            className="w-full h-full object-cover object-center opacity-28 filter saturate-110 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05130b]/85 via-[#05130b]/80 to-[#05130b]" />
        </div>


        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Top Pill */}
          <div className="flex justify-center sm:justify-start mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/35 text-emerald-300 text-xs font-semibold tracking-wide shadow-lg backdrop-blur-md">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>AI Crop Pathology & Instant Treatment Advisory</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Farmer Headlines */}
            <div className="lg:col-span-7 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15] mb-4">
                Protect Your Harvest <br />
                <span className="bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300 bg-clip-text text-transparent">
                  With Instant AI Leaf Scan
                </span>
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl mb-8 font-normal">
                Upload a photo of your infected leaf. Our neural network detects the disease in seconds, 
                calculates lesion severity, and provides immediate treatment instructions in 
                <strong className="text-emerald-300 font-semibold"> Sinhala, Tamil, or English</strong> backed by local climate forecasts.
              </p>

              {/* Farmer Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <button
                  id="btn-hero-new-scan"
                  onClick={() => navigate('/reports/new')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all duration-200"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start New Leaf Scan</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>

                <button
                  onClick={() => navigate('/alerts')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/50 backdrop-blur-md active:scale-95 transition-all duration-200"
                >
                  <CloudRain className="w-4 h-4 text-teal-400" />
                  <span>Check Disease & Weather Alerts</span>
                </button>
              </div>
            </div>

            {/* Right Col: Registered Farmer Farm Card */}
            <div className="lg:col-span-5">
              <div className="glass-elevated rounded-2xl p-6 border border-emerald-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-600/30 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                      <span className="text-lg">🌾</span>
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                        {user?.name || 'Sunil Wickramasinghe'}
                      </h2>
                      <p className="text-[10px] text-emerald-400 font-semibold">
                        {user?.district || 'Gampaha District'} • Registered Farm
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Farm ID: #01
                  </span>
                </div>

                {/* Farm Capabilities */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081b11]/80 border border-emerald-500/15">
                    <span className="text-slate-400">Supported Crops</span>
                    <span className="font-semibold text-white">Tomato, Potato, Pepper, Rice, Chili</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081b11]/80 border border-emerald-500/15">
                    <span className="text-slate-400">AI Diagnostic Engine</span>
                    <span className="font-semibold text-emerald-300">EfficientNet-B0 + OpenCV Lesion</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081b11]/80 border border-emerald-500/15">
                    <span className="text-slate-400">Advisory Languages</span>
                    <span className="font-semibold text-lime-300">සිංහල • தமிழ் • English</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#081b11]/80 border border-emerald-500/15">
                    <span className="text-slate-400">Weather Telemetry</span>
                    <span className="font-semibold text-amber-300">Open-Meteo 7-Day Live Feed</span>
                  </div>
                </div>

                {/* Ready Status */}
                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    AI Scanner Ready for Leaf Upload
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">FastAPI Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Farmer Metrics Ribbon ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-emerald-500/20">
            <div className="glass rounded-xl p-3 sm:p-4 text-center border-emerald-500/20">
              <p className="text-xl sm:text-2xl font-black text-white">&lt; 1.5s</p>
              <p className="text-[11px] text-slate-400 font-medium">Instant AI Diagnosis</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center border-emerald-500/20">
              <p className="text-xl sm:text-2xl font-black text-emerald-400">3 Languages</p>
              <p className="text-[11px] text-slate-400 font-medium">සිංහල / தமிழ் / English</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center border-emerald-500/20">
              <p className="text-xl sm:text-2xl font-black text-lime-300">HSV Lesion %</p>
              <p className="text-[11px] text-slate-400 font-medium">Severity Estimation</p>
            </div>
            <div className="glass rounded-xl p-3 sm:p-4 text-center border-emerald-500/20">
              <p className="text-xl sm:text-2xl font-black text-amber-400">Safe Spray</p>
              <p className="text-[11px] text-slate-400 font-medium">Weather Rain Window</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Farmer Services with Visual Cards ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex-1 w-full space-y-12">
        
        {/* ── Core Farmer Action Cards with Agricultural Images ── */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              Farmer Diagnostic Services
            </h2>
            <p className="text-xs text-slate-400">Everything you need to diagnose and treat your crops</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: AI Leaf Scanner with Farmer Photo */}
            <div
              onClick={() => navigate('/reports/new')}
              className="glass-elevated rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-emerald-400 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/15 flex flex-col justify-between"
            >
              <div>
                {/* Photo header */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="/images/farmer_scan.jpg"
                    alt="Farmer inspecting crop foliage"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091f14] via-transparent to-black/20" />
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30 backdrop-blur-md">
                    Step 1: Diagnose
                  </span>
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-emerald-500/90 text-white flex items-center justify-center shadow-md">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                    AI Leaf Diagnostic Scanner
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Take or upload a clear photo of your plant leaf. Detect Early Blight, Late Blight, Leaf Curl, and more with exact lesion severity percentages.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Open Diagnostic Scanner</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 2: Smart Advisory & Macro Plant Pathology Photo */}
            <div
              onClick={() => navigate('/alerts')}
              className="glass-elevated rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-lime-400 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-lime-500/15 flex flex-col justify-between"
            >
              <div>
                {/* Photo header */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="/images/leaf_macro.jpg"
                    alt="Plant leaf macro cellular pathology inspection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091f14] via-transparent to-black/20" />
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-lime-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-lime-500/30 backdrop-blur-md">
                    Step 2: Treat
                  </span>
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-lime-600/90 text-white flex items-center justify-center shadow-md">
                    <Sprout className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-lime-300 transition-colors">
                    Actionable Treatment Advisory
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Receive structured organic and chemical treatment instructions tailored for Sri Lankan agricultural conditions in Sinhala, Tamil, or English.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center text-xs font-bold text-lime-400 group-hover:translate-x-1 transition-transform">
                <span>View Treatment Advisories</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 3: Weather Spray Window & Farm Radar */}
            <div
              onClick={() => navigate('/alerts')}
              className="glass-elevated rounded-2xl overflow-hidden border border-emerald-500/30 hover:border-amber-400 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/15 flex flex-col justify-between"
            >
              <div>
                {/* Visual Header */}
                <div className="relative h-44 bg-gradient-to-br from-amber-950/40 via-emerald-950/60 to-[#091f14] p-5 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-500/30 backdrop-blur-md">
                      Step 3: Spray Timing
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <CloudRain className="w-4 h-4" />
                    </div>
                  </div>
                  
                  {/* Climate Graphic */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black text-white">84%</p>
                      <p className="text-[11px] text-amber-300 font-semibold">Humidity • High Spore Risk</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Safe Window: 48h
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                    Weather & Spray Safety Window
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Check humidity and rainfall forecasts before applying fungicide or pesticides to prevent expensive agrochemicals from washing away in the rain.
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Check Weather & Alerts</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Farm Weather Telemetry Strip ── */}
        <div className="glass-elevated rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-500/20 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Local Farm Weather & Spray Safety Index</h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Gampaha Field Station • Live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-[#081b11] border border-emerald-500/15">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Temperature</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-black text-white">28.4°C</p>
              <p className="text-[10px] text-slate-400 mt-1">Normal growing range</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#081b11] border border-emerald-500/15">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Relative Humidity</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-black text-amber-400">84%</p>
              <p className="text-[10px] text-amber-400 mt-1">High: Fungal spore risk elevated</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#081b11] border border-emerald-500/15">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Wind Velocity</span>
                <Wind className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-xl font-black text-white">7 km/h</p>
              <p className="text-[10px] text-emerald-400 mt-1">Gentle: Ideal for spraying</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#081b11] border border-emerald-500/15">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Rain Window (48h)</span>
                <CloudRain className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-black text-emerald-400">Low Chance</p>
              <p className="text-[10px] text-emerald-400 mt-1">Safe to apply treatments today</p>
            </div>
          </div>
        </div>

        {/* ── My Crop Reports History (from Supabase Database) ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">My Crop Diagnosis Reports</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 border border-emerald-500/35 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Database
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {reports.length} past diagnostic report{reports.length === 1 ? '' : 's'} recorded in your database
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <div className="inline-flex rounded-xl p-1 bg-black/40 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterMode === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Scans ({reports.length})
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('my')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      filterMode === 'my'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My Farm Scans
                  </button>
                )}
              </div>

              <button
                onClick={() => navigate('/reports/new')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 hover:bg-emerald-900/80 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>
            </div>
          </div>

          {/* Action Success Notification */}
          {actionMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-200 flex items-center justify-between shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{actionMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionMessage('')}
                className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Batch Actions Toolbar */}
          {!loading && reports.length > 0 && (
            <div className="mb-4 p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {selectedReportIds.size === reports.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Select All ({reports.length})</span>
                    </>
                  )}
                </button>

                {selectedReportIds.size > 0 && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    ✓ {selectedReportIds.size} selected
                  </span>
                )}
              </div>

              {selectedReportIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReportIds(new Set())}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/25 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {isDeleting
                        ? 'Deleting…'
                        : `Delete Selected (${selectedReportIds.size})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

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
            <div className="glass-elevated rounded-2xl p-8 text-center border border-emerald-500/25">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl mb-3">
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
                <ReportCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReportIds.has(report.id)}
                  onToggleSelect={handleToggleSelect}
                  onDelete={handleDeleteSingle}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── How It Works — 3-Step Visual Section ── */}
        <section className="pb-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              How AgriNova AI Works
            </h2>
            <p className="text-xs text-slate-400 mt-1">Three simple steps to protect your harvest</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="glass-elevated rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-5xl opacity-10">📸</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="step-pill">1</div>
                <h3 className="font-bold text-white text-sm">Photograph the Leaf</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take a clear, close-up photo of any infected-looking leaf from your crop — tomato, potato, rice, chili, or pepper. Good lighting gives the best results.
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {['🍅 Tomato','🥔 Potato','🌾 Rice','🌶️ Chili'].map(c => (
                  <span key={c} className="crop-badge text-[10px] py-0.5">{c}</span>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-elevated rounded-2xl p-5 border border-lime-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-5xl opacity-10">🤖</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="step-pill">2</div>
                <h3 className="font-bold text-white text-sm">AI Analyses the Disease</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our EfficientNet-B0 model detects Early Blight, Late Blight, Leaf Curl, Blast, and more with <strong className="text-lime-300">95%+ accuracy</strong>. OpenCV calculates exact lesion severity percentages.
              </p>
              <div className="mt-3 p-2 rounded-lg bg-lime-950/40 border border-lime-500/20 text-[10px] font-mono text-lime-300">
                EfficientNet-B0 + HSV Lesion Analysis
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-elevated rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-5xl opacity-10">💊</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="step-pill">3</div>
                <h3 className="font-bold text-white text-sm">Receive Treatment Plan</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Get step-by-step organic and chemical treatment instructions in your preferred language — <strong className="text-amber-300">Sinhala, Tamil, or English</strong>. Spray safety windows included.
              </p>
              <div className="mt-3 flex gap-1.5">
                <span className="crop-badge text-[10px] py-0.5">🇱🇰 සිංහල</span>
                <span className="crop-badge text-[10px] py-0.5">தமிழ்</span>
                <span className="crop-badge text-[10px] py-0.5">English</span>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-6 agri-banner flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-bold text-white text-sm">Ready to protect your crop?</p>
              <p className="text-xs text-slate-300 mt-0.5">Start a free AI leaf scan in under 60 seconds.</p>
            </div>
            <button
              onClick={() => navigate('/reports/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              Start New Leaf Scan
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
