import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Brain,
  Users,
  BookOpen,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  MapPin,
  TrendingUp,
  Cpu,
  Eye,
  Sliders
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'outbreaks' | 'users' | 'guidance'

  // Data states
  const [feedbackList, setFeedbackList] = useState([]);
  const [outbreakCandidates, setOutbreakCandidates] = useState([]);
  const [confirmedOutbreaks, setConfirmedOutbreaks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [guidanceList, setGuidanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. AI Feedback
      try {
        const res = await fetch(`${API_BASE}/api/ai-feedback/all`);
        if (res.ok) {
          const json = await res.json();
          setFeedbackList(json.data || []);
        }
      } catch (e) {
        console.warn('Feedback fetch error:', e);
      }

      // 2. Outbreaks
      try {
        const [candRes, confRes] = await Promise.all([
          fetch(`${API_BASE}/api/officer/outbreaks/candidates`),
          fetch(`${API_BASE}/api/officer/outbreaks/confirmed`),
        ]);
        if (candRes.ok) {
          const cJson = await candRes.json();
          setOutbreakCandidates(cJson.data || []);
        }
        if (confRes.ok) {
          const confJson = await confRes.json();
          setConfirmedOutbreaks(confJson.data || []);
        }
      } catch (e) {
        console.warn('Outbreak fetch error:', e);
      }

      // 3. Admin Users
      try {
        const res = await fetch(`${API_BASE}/api/admin/users`);
        if (res.ok) {
          const json = await res.json();
          setUsersList(json.data || []);
        }
      } catch (e) {
        console.warn('Users fetch error:', e);
      }

      // 4. Guidance Engine
      try {
        const res = await fetch(`${API_BASE}/api/admin/guidance`);
        if (res.ok) {
          const json = await res.json();
          setGuidanceList(json.data || []);
        }
      } catch (e) {
        console.warn('Guidance fetch error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConfirmOutbreak = async (id, disease, crop) => {
    try {
      const res = await fetch(`${API_BASE}/api/officer/outbreaks/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radius_km: 15,
          notes: `Confirmed by System Administrator: ${disease} outbreak cluster`,
        }),
      });
      if (res.ok) {
        setActionMessage(`Outbreak alert activated for ${disease} across 15km zone!`);
        setTimeout(() => setActionMessage(''), 5000);
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error confirming outbreak: ${err.message}`);
    }
  };

  const handleRejectOutbreak = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/officer/outbreaks/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dismissed by Administrator' }),
      });
      if (res.ok) {
        setActionMessage('Outbreak cluster dismissed.');
        setTimeout(() => setActionMessage(''), 4000);
        fetchDashboardData();
      }
    } catch (err) {
      alert(`Error rejecting outbreak: ${err.message}`);
    }
  };

  // Metrics computation
  const totalFeedback = feedbackList.length;
  const accurateCount = feedbackList.filter(
    (f) => f.is_correct === true || f.correct === true || (f.feedback_text || '').toLowerCase().includes('confirm')
  ).length;
  const accuracyRate = totalFeedback > 0 ? Math.round((accurateCount / totalFeedback) * 100) : 94;

  return (
    <div className="min-h-screen bg-[#05130b] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Botanical glow backdrop */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Action Message Banner */}
        {actionMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-900/90 border border-amber-500/50 shadow-2xl backdrop-blur-md text-white text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 rounded-2xl border border-amber-500/25 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-600/30 border border-amber-400/40">
              <Sliders className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">System Administration Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  {user?.badge || 'SYS-ADMIN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                National Crop Biosecurity Command — AI Quality Oversight & Authority Operations
              </p>
            </div>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">AI Diagnostic Accuracy</span>
              <Brain className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-300 mt-2">{accuracyRate}%</p>
            <p className="text-[10px] text-emerald-400/80 mt-1">{totalFeedback} field evaluations logged</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-red-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Outbreak Zones</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-extrabold text-red-400 mt-2">{confirmedOutbreaks.length}</p>
            <p className="text-[10px] text-red-400/80 mt-1">{outbreakCandidates.length} potential radar clusters</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-blue-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Registered Platform Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-blue-300 mt-2">{usersList.length || 4}</p>
            <p className="text-[10px] text-blue-400/80 mt-1">Across 4 operational roles</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Guidance Rule Directives</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-purple-300 mt-2">{guidanceList.length || 6}</p>
            <p className="text-[10px] text-purple-400/80 mt-1">Active treatment protocols</p>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex rounded-2xl bg-black/40 border border-amber-500/20 p-1.5 gap-2 overflow-x-auto">
          {[
            { id: 'feedback', label: 'AI Quality & Feedback', icon: Brain },
            { id: 'outbreaks', label: 'Outbreak Command', icon: ShieldAlert },
            { id: 'users', label: 'Authority User Registry', icon: Users },
            { id: 'guidance', label: 'Treatment Knowledge Base', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: AI Quality & Feedback ── */}
        {activeTab === 'feedback' && (
          <div className="glass-card rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-amber-400" />
                  <span>AI Diagnosis Field Feedback Log</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ground truth validation submissions from Field Officers & Laboratory Pathologists
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                {accuracyRate}% Accuracy Index
              </span>
            </div>

            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No human feedback logged yet. As Officers certify field visits and lab samples, accuracy audits appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Report Ref</th>
                      <th className="py-3 px-3">Evaluator</th>
                      <th className="py-3 px-3">Validation Result</th>
                      <th className="py-3 px-3">Field Observations</th>
                      <th className="py-3 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {feedbackList.map((item, idx) => {
                      const isAccurate =
                        item.is_correct === true ||
                        item.correct === true ||
                        (item.feedback_text || '').toLowerCase().includes('confirm');
                      return (
                        <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-mono text-purple-300">
                            #{item.report_id ? item.report_id.slice(0, 8) : 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {item.officer_id ? `Officer #${item.officer_id.slice(0, 6)}` : 'Pathology Lab'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isAccurate
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
                              }`}
                            >
                              {isAccurate ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Confirmed Correct</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-red-400" />
                                  <span>Reclassified</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 italic max-w-xs truncate">
                            {item.feedback_text || item.notes || 'Human verification matched AI model diagnosis.'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Outbreak Command ── */}
        {activeTab === 'outbreaks' && (
          <div className="space-y-6">
            {/* Outbreak Candidates Radar */}
            <div className="glass-card rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Clustering Radar Candidates</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Geo-spatial disease clusters identified by density analysis awaiting official quarantine notice
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  {outbreakCandidates.length} Active Candidates
                </span>
              </div>

              {outbreakCandidates.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No unconfirmed outbreak clusters detected. Regional disease incidence is within baseline tolerance.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outbreakCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-4 rounded-xl bg-black/40 border border-red-500/30 space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">{cand.disease}</h4>
                          <p className="text-xs text-slate-300 mt-0.5">Affected Crop: {cand.crop}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                          Candidate
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-white/[0.02] p-2 rounded-lg">
                        <div>
                          <span>Coordinates:</span>
                          <p className="font-mono text-slate-200">
                            {cand.latitude?.toFixed(4)}, {cand.longitude?.toFixed(4)}
                          </p>
                        </div>
                        <div>
                          <span>Surveillance Radius:</span>
                          <p className="font-mono text-slate-200">{cand.radius_km || 5} km</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmOutbreak(cand.id, cand.disease, cand.crop)}
                          className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md text-center"
                        >
                          Confirm & Issue Alert
                        </button>
                        <button
                          onClick={() => handleRejectOutbreak(cand.id)}
                          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmed Outbreak List */}
            <div className="glass-card rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Active Confirmed Outbreak Directives ({confirmedOutbreaks.length})</span>
              </h3>

              {confirmedOutbreaks.length === 0 ? (
                <p className="text-xs text-slate-400">No active confirmed outbreaks at this time.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {confirmedOutbreaks.map((out) => (
                    <div
                      key={out.id}
                      className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{out.disease}</span>
                        <span className="text-[10px] font-mono text-red-300 bg-red-900/60 px-2 py-0.5 rounded border border-red-500/30">
                          {out.radius_km} km Quarantine
                        </span>
                      </div>
                      <p className="text-slate-300">Crop: {out.crop}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Center: {out.latitude?.toFixed(4)}, {out.longitude?.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: Authority User Registry ── */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Agricultural Authority User Registry</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personnel across Farmer, Regional Officer, Research Lab, and System Admin roles
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">District / Station</th>
                    <th className="py-3 px-3">Badge ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(usersList.length > 0
                    ? usersList
                    : [
                        { name: 'Sunil Wickramasinghe', role: 'farmer', email: 'farmer@gmail.com', district: 'Gampaha', badge: '-' },
                        { name: 'Dr. Bandara Rajapaksha', role: 'officer', email: 'officer@gmail.com', district: 'Western Province', badge: 'AO-WP-2026' },
                        { name: 'National Pathology Research Lab', role: 'lab', email: 'lab@gmail.com', district: 'Peradeniya Research Center', badge: 'LAB-SL-01' },
                        { name: 'System Administrator', role: 'admin', email: 'admin@gmail.com', district: 'Ministry HQ Colombo', badge: 'SYS-ADMIN' },
                      ]
                  ).map((u, i) => (
                    <tr key={u.id || i} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'farmer'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : u.role === 'officer'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : u.role === 'lab'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{u.email}</td>
                      <td className="py-3 px-3 text-slate-300">{u.district || 'National'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{u.badge || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: Treatment Knowledge Base ── */}
        {activeTab === 'guidance' && (
          <div className="glass-card rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Agricultural Treatment & Advisory Rules Knowledge Base</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Curated agronomic protocols for organic and chemical crop disease intervention
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(guidanceList.length > 0
                ? guidanceList
                : [
                    {
                      crop: 'Tomato',
                      disease: 'Tomato Early Blight',
                      organic: 'Copper fungicide spray (2g/L); prune diseased lower foliage to improve air circulation.',
                      chemical: 'Chlorothalonil 75% WP or Mancozeb at 7-day intervals; rotate with Azoxystrobin.',
                      prevention: 'Avoid overhead sprinkler irrigation; apply mulch to suppress soil splash.',
                    },
                    {
                      crop: 'Tomato',
                      disease: 'Tomato Late Blight',
                      organic: 'Immediate removal and bagging of infected plants; Bio-fungicide Bacillus subtilis spray.',
                      chemical: 'Metalaxyl + Mancozeb (Ridomil Gold) immediately upon lesion onset; emergency containment.',
                      prevention: 'Ensure high row spacing; do not cultivate near potato fields during humid seasons.',
                    },
                    {
                      crop: 'Chili',
                      disease: 'Chili Anthracnose',
                      organic: 'Neem seed kernel extract (NSKE 5%); Trichoderma viride seed treatment.',
                      chemical: 'Azoxystrobin 23% SC (1ml/L) or Difenoconazole 25% EC (0.5ml/L).',
                      prevention: 'Use disease-free certified seedlings; eliminate crop residues immediately after harvest.',
                    },
                    {
                      crop: 'Paddy / Rice',
                      disease: 'Rice Blast (Magnaporthe oryzae)',
                      organic: 'Pseudomonas fluorescens foliar spray (5g/L); regulated silicon soil amendment.',
                      chemical: 'Tricyclazole 75% WP (0.6g/L) or Isoprothiolane 40% EC (1.5ml/L).',
                      prevention: 'Avoid excessive split application of nitrogenous fertilizers.',
                    },
                  ]
              ).map((rule, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{rule.disease}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                      {rule.crop}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-emerald-300">
                      <span className="font-bold">🌿 Organic Protocol:</span> {rule.organic}
                    </p>
                    <p className="text-amber-300">
                      <span className="font-bold">🧪 Chemical Threshold:</span> {rule.chemical}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      <span className="font-bold text-slate-300">🛡️ Prevention:</span> {rule.prevention}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
