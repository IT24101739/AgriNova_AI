import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicket, confirmDiagnosis, patchTicket } from '../services/officerApi';
import CaseEvidencePanel from '../components/CaseEvidencePanel';
import FieldVisitForm from '../components/FieldVisitForm';
import ResearchLabPanel from '../components/ResearchLabPanel';
import PriorityBadge from '../components/PriorityBadge';
import {
  ArrowLeft, Bot, CheckCircle, AlertCircle, Loader2,
  ClipboardList, MapPin, Calendar, RefreshCw, ChevronDown,
} from 'lucide-react';

const DISEASES = [
  'Tomato Early Blight','Tomato Late Blight','Tomato Leaf Curl',
  'Rice Blast','Rice Brown Spot','Chili Anthracnose','Healthy','Other',
];

function AISummaryCard({ summary }) {
  const [expanded, setExpanded] = useState(true);
  if (!summary) return null;
  const priorityColor =
    summary.suggested_priority === 'HIGH'   ? 'text-red-400 bg-red-500/15 border-red-500/30' :
    summary.suggested_priority === 'MEDIUM' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
                                              'text-green-400 bg-green-500/15 border-green-500/30';

  return (
    <div className="glass-elevated rounded-xl overflow-hidden border border-blue-500/20">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3
                   hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm text-white">AI Case Summary</span>
          <span className={`badge text-xs border ${priorityColor}`}>
            Suggested: {summary.suggested_priority}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <p className="text-sm text-slate-200 leading-relaxed">{summary.summary}</p>
          {summary.reasons?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reasons</p>
              <ul className="space-y-1">
                {summary.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <Bot className="w-3 h-3" />
            Priority score: {summary.score} — AI assists, officer decides.
          </div>
        </div>
      )}
    </div>
  );
}

export default function OfficerTicket() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('evidence');
  const [confirmForm, setConfirmForm] = useState({ confirmed_disease: '', notes: '' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTicket(ticketId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [ticketId]);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!confirmForm.confirmed_disease) { setConfirmError('Please select a disease'); return; }
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      await confirmDiagnosis(ticketId, confirmForm);
      setSuccessMsg('Diagnosis confirmed. Farmer notified & AI feedback saved.');
      fetch();
    } catch (err) {
      setConfirmError(err.response?.data?.detail || 'Failed to confirm');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    await patchTicket(ticketId, { status });
    fetch();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
    </div>
  );

  if (error) return (
    <div className="glass rounded-xl p-8 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-400 font-medium">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go back</button>
    </div>
  );

  const ticket = data || {};
  const report = ticket.reports || {};
  const analysis = report.analysis_results?.[0] || report.analysis_results || {};
  const farm = report.farms || {};
  const aiSummary = ticket.ai_summary;
  const fieldVisits = ticket.field_visits || [];

  const TABS = ['evidence', 'field-visit', 'confirm-diagnosis', 'lab'];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <PriorityBadge priority={ticket.priority} pulse />
            <span className="text-xs text-slate-400 font-mono">#{ticket.id?.slice(0, 8)}</span>
            <span className="text-xs badge bg-slate-700/60 text-slate-300">
              {ticket.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white truncate">
            {report.disease || 'Undiagnosed'} — {report.crop || 'Unknown'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
            {farm.district && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {farm.district}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              }) : '—'}
            </span>
            <span className="text-slate-500">Reason: {ticket.reason?.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <button onClick={fetch} className="btn-secondary py-2 px-3">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI Summary */}
      <AISummaryCard summary={aiSummary} />

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-green-500/15 border border-green-500/30 text-green-300 text-sm animate-slide-up">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Quick status change */}
      {ticket.status !== 'RESOLVED' && ticket.status !== 'CONFIRMED' && (
        <div className="glass rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Set Status:</span>
          {['FIELD_VISIT_REQUIRED', 'UNDER_REVIEW', 'LAB_REVIEW'].map(s => {
            const isCurrent = ticket.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`text-xs py-1.5 px-3 rounded-xl font-medium transition-all ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/50'
                    : 'btn-secondary hover:text-white'
                }`}
              >
                {isCurrent && <span className="mr-1 text-emerald-200">✓</span>}
                {s.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — evidence */}
        <div className="xl:col-span-1">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-green" />
              Case Evidence
            </h2>
            <CaseEvidencePanel report={report} analysis={analysis} />
          </div>
        </div>

        {/* Right — action tabs */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/8">
              {[
                { id: 'field-visit', label: 'Field Visit' },
                { id: 'confirm-diagnosis', label: 'Confirm Diagnosis' },
                { id: 'lab', label: 'Research Lab' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'text-brand-green border-b-2 border-brand-green bg-brand-green/5'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'field-visit' && (
                <div>
                  <p className="text-xs text-slate-400 mb-4">
                    Record your field visit observations. This will confirm the diagnosis,
                    update the report, and notify the farmer automatically.
                  </p>
                  <FieldVisitForm
                    ticketId={ticketId}
                    onSuccess={() => {
                      setSuccessMsg('Field visit recorded. Farmer notified & AI feedback saved.');
                      fetch();
                    }}
                  />
                </div>
              )}

              {activeTab === 'confirm-diagnosis' && (
                <form onSubmit={handleConfirm} className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Confirm or correct the AI diagnosis remotely — no field visit required.
                    This saves feedback and notifies the farmer.
                  </p>
                  <div>
                    <label className="ag-label">Confirmed Disease</label>
                    <select
                      className={`ag-select transition-all ${confirmForm.confirmed_disease ? 'border-emerald-400/80 bg-emerald-950/60 text-emerald-200 font-semibold ring-1 ring-emerald-500/30' : 'text-slate-300'}`}
                      value={confirmForm.confirmed_disease}
                      onChange={e => setConfirmForm(f => ({ ...f, confirmed_disease: e.target.value }))}
                    >
                      <option value="">Select disease...</option>
                      {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {report.disease && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        AI predicted: <span className="text-slate-300">{report.disease}</span>
                        {' '}({Math.round((report.confidence || 0) * 100)}%)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="ag-label">Notes (optional)</label>
                    <textarea
                      className="ag-input h-20 resize-none"
                      placeholder="Additional observations..."
                      value={confirmForm.notes}
                      onChange={e => setConfirmForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                  {confirmError && (
                    <p className="text-sm text-red-400">{confirmError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={confirmLoading}
                    className="btn-primary w-full justify-center py-3"
                  >
                    {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {confirmLoading ? 'Saving…' : 'Confirm Diagnosis & Notify Farmer'}
                  </button>
                </form>
              )}

              {activeTab === 'lab' && (
                <ResearchLabPanel
                  ticketId={ticketId}
                  ticket={ticket}
                  existingLabRequest={ticket.lab_requests?.[0] || null}
                  onSent={() => {
                    setSuccessMsg('Case sent to research lab.');
                    fetch();
                  }}
                />
              )}
            </div>
          </div>

          {/* Past field visits */}
          {fieldVisits.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Past Field Visits</h2>
              <div className="space-y-3">
                {fieldVisits.map(fv => (
                  <div key={fv.id} className="glass-elevated rounded-xl p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{fv.confirmed_disease}</span>
                      <span className="text-xs text-slate-400">{fv.visit_date}</span>
                    </div>
                    <p className="text-xs text-slate-400">{fv.observations}</p>
                    {fv.action_taken && (
                      <p className="text-xs text-brand-green">Action: {fv.action_taken}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
