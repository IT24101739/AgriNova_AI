import { useState } from 'react';
import { sendToLab, recordLabResult } from '../services/officerApi';
import { FlaskConical, TestTube, CheckCircle2, Loader2 } from 'lucide-react';

const STATUS_STEPS = ['SAMPLE_REQUESTED', 'TESTING', 'RESULT_RECEIVED'];

function StatusStepper({ status }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 my-3">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                          transition-all ${
            i < idx ? 'bg-brand-green text-white' :
            i === idx ? 'bg-amber-500 text-white ring-2 ring-amber-500/40' :
            'bg-white/10 text-slate-500'
          }`}>
            {i < idx ? '✓' : i + 1}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 ${i < idx ? 'bg-brand-green' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ResearchLabPanel({ ticketId, existingLabRequest, onSent }) {
  const [showForm, setShowForm] = useState(false);
  const [resultMode, setResultMode] = useState(false);
  const [form, setForm] = useState({ reason: '', notes: '', sample_reference: '' });
  const [resultForm, setResultForm] = useState({ confirmed_disease: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setR = f => e => setResultForm(p => ({ ...p, [f]: e.target.value }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.reason) { setError('Please enter a reason'); return; }
    setLoading(true);
    setError(null);
    try {
      await sendToLab(ticketId, form);
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send to lab');
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (e) => {
    e.preventDefault();
    if (!resultForm.confirmed_disease) { setError('Enter the confirmed disease'); return; }
    setLoading(true);
    setError(null);
    try {
      await recordLabResult(existingLabRequest.id, resultForm);
      onSent?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record result');
    } finally {
      setLoading(false);
    }
  };

  // Show existing lab request status
  if (existingLabRequest) {
    const status = existingLabRequest.status;
    return (
      <div className="glass-elevated rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="w-4 h-4 text-pink-400" />
          <h3 className="font-semibold text-white text-sm">Research Lab Request</h3>
        </div>
        <StatusStepper status={status} />
        <p className="text-xs text-slate-400">Reason: {existingLabRequest.reason}</p>
        {existingLabRequest.sample_reference && (
          <p className="text-xs text-slate-400 font-mono">
            Sample Ref: {existingLabRequest.sample_reference}
          </p>
        )}

        {status !== 'RESULT_RECEIVED' && (
          <button
            onClick={() => setResultMode(!resultMode)}
            className="btn-secondary w-full justify-center text-xs py-2"
          >
            <TestTube className="w-3.5 h-3.5" />
            Record Lab Result
          </button>
        )}

        {resultMode && (
          <form onSubmit={handleResult} className="space-y-3 pt-2 border-t border-white/10">
            <div>
              <label className="ag-label">Confirmed Disease</label>
              <input className="ag-input" value={resultForm.confirmed_disease} onChange={setR('confirmed_disease')} />
            </div>
            <div>
              <label className="ag-label">Lab Notes</label>
              <textarea className="ag-input h-16 resize-none" value={resultForm.notes} onChange={setR('notes')} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-xs py-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {loading ? 'Saving…' : 'Save Lab Result'}
            </button>
          </form>
        )}

        {existingLabRequest.confirmed_disease && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-xs text-green-400 font-semibold">Result Received</p>
            <p className="text-sm text-white mt-0.5">{existingLabRequest.confirmed_disease}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-elevated rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-pink-400" />
        <h3 className="font-semibold text-white text-sm">Send to Research Lab</h3>
      </div>
      <p className="text-xs text-slate-400">
        Escalate this case to a research laboratory for advanced analysis.
      </p>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn-secondary w-full justify-center text-xs py-2"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Request Lab Analysis
        </button>
      ) : (
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="ag-label">Reason</label>
            <input className="ag-input" placeholder="e.g. Unidentified pathogen..." value={form.reason} onChange={set('reason')} />
          </div>
          <div>
            <label className="ag-label">Sample Reference</label>
            <input className="ag-input font-mono" placeholder="LAB-2026-..." value={form.sample_reference} onChange={set('sample_reference')} />
          </div>
          <div>
            <label className="ag-label">Additional Notes</label>
            <textarea className="ag-input h-16 resize-none" value={form.notes} onChange={set('notes')} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center text-xs py-2">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center text-xs py-2">
              {loading ? 'Sending…' : 'Send to Lab'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
