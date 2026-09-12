import { useEffect, useState } from 'react';
import { getAIFeedback, getAIFeedbackSummary } from '../services/notificationApi';
import { FlaskConical, CheckCircle, XCircle, TrendingUp, RefreshCw } from 'lucide-react';

function AccuracyRing({ pct }) {
  const r = 36, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="100" height="100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
    </svg>
  );
}

export default function AIFeedbackPage() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyIncorrect, setOnlyIncorrect] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        getAIFeedbackSummary(),
        getAIFeedback({ only_incorrect: onlyIncorrect }),
      ]);
      setSummary(sRes.data);
      setRecords(rRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [onlyIncorrect]);

  const pct = summary?.accuracy_percent ?? null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-pink-400" />
            AI Feedback Loop
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Officer-confirmed diagnoses feed back into the model training dataset
          </p>
        </div>
        <button onClick={load} className="btn-secondary text-xs py-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy ring */}
          <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center col-span-2 md:col-span-1">
            <div className="relative">
              <AccuracyRing pct={pct ?? 0} />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-lg font-bold text-white">
                  {pct !== null ? `${pct}%` : '—'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest">Accuracy</p>
          </div>

          <div className="stat-card flex flex-col justify-center">
            <p className="text-3xl font-bold text-white">{summary.total_feedback}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Total Records</p>
          </div>
          <div className="stat-card flex flex-col justify-center">
            <p className="text-3xl font-bold text-green-400">{summary.correct_predictions}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Correct</p>
          </div>
          <div className="stat-card flex flex-col justify-center">
            <p className="text-3xl font-bold text-red-400">{summary.incorrect_predictions}</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Incorrect</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-2xl">
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-brand-green" />
          <h2 className="font-semibold text-white flex-1">Feedback Records</h2>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded"
              checked={onlyIncorrect}
              onChange={e => setOnlyIncorrect(e.target.checked)}
            />
            Show only incorrect predictions
          </label>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No feedback records yet</p>
          ) : (
            <table className="ag-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>AI Predicted</th>
                  <th>Officer Confirmed</th>
                  <th>AI Confidence</th>
                  <th>Correct?</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="text-slate-300">{r.reports?.crop || '—'}</td>
                    <td className="text-slate-200 font-medium">{r.predicted_disease}</td>
                    <td>
                      <span className={r.correct ? 'text-green-400' : 'text-red-400 font-semibold'}>
                        {r.confirmed_disease}
                      </span>
                    </td>
                    <td>
                      <span className={`font-mono text-sm ${
                        r.confidence < 0.5 ? 'text-red-400' :
                        r.confidence < 0.75 ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {r.confidence ? `${Math.round(r.confidence * 100)}%` : '—'}
                      </span>
                    </td>
                    <td>
                      {r.correct
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />
                      }
                    </td>
                    <td className="text-xs text-slate-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
