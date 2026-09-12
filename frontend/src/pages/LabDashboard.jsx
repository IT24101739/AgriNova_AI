import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical,
  Microscope,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Send,
  X,
  Sparkles,
  Info,
  MapPin
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const COMMON_PATHOGENS = [
  'Tomato Early Blight (Alternaria solani)',
  'Tomato Late Blight (Phytophthora infestans)',
  'Tomato Yellow Leaf Curl Virus (TYLCV)',
  'Bacterial Spot (Xanthomonas perforans)',
  'Septoria Leaf Spot (Septoria lycopersici)',
  'Tomato Leaf Mold (Passalora fulva)',
  'Fusarium Wilt (Fusarium oxysporum)',
  'Healthy Foliage — No Pathogen Detected',
];

export default function LabDashboard() {
  const { user } = useAuth();
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [confirmedDisease, setConfirmedDisease] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchLabRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/officer/lab-requests`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setLabRequests(json.data || []);
      } else {
        throw new Error(json.message || 'Failed to fetch lab requests');
      }
    } catch (err) {
      console.error('Failed to load lab requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabRequests();
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/officer/lab-requests/${requestId}/status?status=${newStatus}`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setSuccessToast(`Sample marked as ${newStatus}.`);
        setTimeout(() => setSuccessToast(''), 4000);
        fetchLabRequests();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!activeModalRequest || !confirmedDisease) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/officer/lab-requests/${activeModalRequest.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed_disease: confirmedDisease,
          notes: labNotes,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessToast(`Diagnostic certificate issued for Sample #${activeModalRequest.id.slice(0, 8)}!`);
        setTimeout(() => setSuccessToast(''), 5000);
        setActiveModalRequest(null);
        setConfirmedDisease('');
        setLabNotes('');
        fetchLabRequests();
      } else {
        throw new Error(json.message || 'Failed to record lab result');
      }
    } catch (err) {
      console.error('Lab result submission error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isCompletedStatus = (s) =>
    s === 'COMPLETED' || s === 'CONFIRMED' || s === 'RESOLVED' || s === 'RESULT_RECEIVED';

  const filteredRequests = labRequests.filter((item) => {
    const crop = item.crop || item.reports?.crop || '';
    const suspected = item.suspected_disease || item.reports?.disease || '';
    const reason = item.reason || '';
    const notes = item.notes || '';
    const id = item.id || '';
    const sampleRef = item.sample_reference || '';

    const matchesQuery =
      crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suspected.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sampleRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return item.status === 'SAMPLE_REQUESTED' || item.status === 'PENDING';
    if (statusFilter === 'TESTING') return item.status === 'TESTING' || item.status === 'IN_PROGRESS';
    if (statusFilter === 'COMPLETED') return isCompletedStatus(item.status);
    return true;
  });

  const stats = {
    total: labRequests.length,
    pending: labRequests.filter((r) => r.status === 'SAMPLE_REQUESTED' || r.status === 'PENDING').length,
    testing: labRequests.filter((r) => r.status === 'TESTING' || r.status === 'IN_PROGRESS').length,
    completed: labRequests.filter((r) => isCompletedStatus(r.status)).length,
  };

  return (
    <div className="min-h-screen bg-[#05130b] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Toast Notification */}
        {successToast && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-900/90 border border-purple-500/50 shadow-2xl backdrop-blur-md text-white text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 rounded-2xl border border-purple-500/25">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/40">
              <Microscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">Pathology Research Laboratory</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                  {user?.badge || 'LAB-SL-01'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                National Agricultural Pathogen Verification & Biological Sample Sequencing Console
              </p>
            </div>
          </div>

          <button
            onClick={fetchLabRequests}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Samples</span>
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-purple-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Sample Referrals</span>
              <FlaskConical className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-2">{stats.total}</p>
            <p className="text-[10px] text-slate-400 mt-1">Escalated from Regional Officers</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-amber-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Pending Physical Sample</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-extrabold text-amber-300 mt-2">{stats.pending}</p>
            <p className="text-[10px] text-amber-400/80 mt-1">Awaiting accession & intake</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-blue-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">In Active Sequencing</span>
              <Microscope className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-extrabold text-blue-300 mt-2">{stats.testing}</p>
            <p className="text-[10px] text-blue-400/80 mt-1">Under microscopic / PCR assay</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Certified Results</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-300 mt-2">{stats.completed}</p>
            <p className="text-[10px] text-emerald-400/80 mt-1">Returned to Farmer & Officer</p>
          </div>
        </div>

        {/* ── Search and Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sample ID, crop, or disease..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-purple-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex rounded-xl bg-black/40 border border-purple-500/20 p-1 gap-1 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'PENDING', 'TESTING', 'COMPLETED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sample Referrals List ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading biological sample queue...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Laboratory Referrals Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No matching samples meet your search criteria.'
                : 'When an Agriculture Officer encounters an ambiguous crop pathogen during a field visit, sample escalation referrals will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequests.map((req) => {
              const isCompleted = isCompletedStatus(req.status);
              const isTesting = req.status === 'TESTING' || req.status === 'IN_PROGRESS';
              const cropName = req.crop || req.reports?.crop || req.reports?.farms?.crop || 'Foliage Sample';
              const suspected = req.suspected_disease || req.reports?.disease || 'Unidentified Pathogen';
              const district = req.district || req.reports?.farms?.district || 'Western Province';
              const sampleRef = req.sample_reference || req.id.slice(0, 8);
              const severity = req.severity || req.reports?.severity;
              const confidence = req.confidence || req.reports?.confidence;

              return (
                <div
                  key={req.id}
                  className={`glass-card rounded-2xl p-5 border transition-all shadow-xl flex flex-col justify-between space-y-4 ${
                    isCompleted
                      ? 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-950/10'
                      : isTesting
                      ? 'border-blue-500/30 hover:border-blue-500/50 bg-blue-950/10'
                      : 'border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header bar */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-purple-300 text-[11px] bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                          #{sampleRef}
                        </span>
                        {district && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            {district}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isTesting
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCompleted ? 'CERTIFIED' : isTesting ? 'TESTING' : 'PENDING SAMPLE'}
                      </span>
                    </div>

                    {/* Crop & Suspected Pathogen */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-white">
                          {cropName}
                        </h3>
                        {severity && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            severity === 'HIGH'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-400 font-semibold">Suspected:</span>
                        <span className="font-medium">{suspected}</span>
                        {confidence && (
                          <span className="text-[10px] text-slate-500">
                            ({Math.round(confidence * 100)}%)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Officer Reason (Crucial field where officer notes why this was escalated) */}
                    {req.reason && (
                      <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/25 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Officer Clinical Indication:
                        </span>
                        <p className="text-xs text-slate-200 font-medium break-words">
                          "{req.reason}"
                        </p>
                      </div>
                    )}

                    {/* Escalation details */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Report Ref:</span>
                        <span className="font-mono text-slate-300">
                          {req.report_id ? req.report_id.slice(0, 8) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Lab:</span>
                        <span className="text-slate-300">
                          {req.lab_name || 'Central Pathology Lab'}
                        </span>
                      </div>
                      {req.notes && (
                        <div className="pt-1 border-t border-white/5 text-[10px] text-slate-400 italic break-words">
                          Field Notes: "{req.notes}"
                        </div>
                      )}
                    </div>

                    {/* Completed Result Callout */}
                    {isCompleted && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/35 text-emerald-300 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Certified Diagnosis</span>
                          </p>
                          {req.result_date && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(req.result_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-white text-sm">
                          {req.confirmed_disease || 'Pathogen Confirmed'}
                        </p>
                        {req.lab_notes && (
                          <p className="text-[11px] text-emerald-200/80 italic pt-1 border-t border-emerald-500/20 break-words">
                            Findings: "{req.lab_notes}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    {!isCompleted && !isTesting && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'TESTING')}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-blue-200 text-xs font-bold transition-all text-center"
                      >
                        Begin Testing
                      </button>
                    )}

                    {!isCompleted && isTesting && (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-blue-950/50 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Microscope className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                        <span>In Active Testing</span>
                      </div>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setActiveModalRequest(req);
                          setConfirmedDisease(req.suspected_disease || req.reports?.disease || '');
                          setLabNotes(req.notes || '');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 text-center"
                      >
                        Certify Result
                      </button>
                    )}

                    {isCompleted && (
                      <div className="w-full text-center py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Diagnostic Certificate Issued & Synchronized</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Diagnostic Certificate Submission Modal ── */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full rounded-2xl p-6 border border-purple-500/30 shadow-2xl space-y-5 bg-[#081b10]/95">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Microscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Official Lab Result</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Sample #{activeModalRequest.id.slice(0, 10)}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResult} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmed Pathogen / Disease Name *
                </label>
                <input
                  type="text"
                  required
                  value={confirmedDisease}
                  onChange={(e) => setConfirmedDisease(e.target.value)}
                  placeholder="e.g. Tomato Early Blight (Alternaria solani)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                
                {/* Pathogen presets */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_PATHOGENS.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setConfirmedDisease(item)}
                      className="text-[9px] px-2 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 transition-colors"
                    >
                      + {item.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Laboratory Verification Notes & Assay Observations
                </label>
                <textarea
                  rows={3}
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  placeholder="Microscopic spore morphology, bacterial streaming observation, or PCR assay confirmation notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  Submitting this result automatically closes the officer ticket, syncs diagnosis to the original report, logs AI accuracy feedback, and sends an alert to the farmer.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalRequest(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Issue Lab Certificate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
