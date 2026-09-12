import { useState } from 'react';
import { recordFieldVisit } from '../services/officerApi';
import { CheckCircle, Calendar, Stethoscope, FileText, Camera, Zap } from 'lucide-react';

const DISEASES = [
  'Tomato Early Blight', 'Tomato Late Blight', 'Tomato Leaf Curl',
  'Rice Blast', 'Rice Brown Spot', 'Paddy False Smut',
  'Chili Anthracnose', 'Banana Fusarium Wilt', 'Coconut Bud Rot',
  'Rubber Powdery Mildew', 'Tea Blister Blight', 'Healthy',
];

export default function FieldVisitForm({ ticketId, onSuccess }) {
  const [form, setForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    observations: '',
    confirmed_disease: '',
    severity: 'MEDIUM',
    notes: '',
    action_taken: '',
    photo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.confirmed_disease || !form.observations) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await recordFieldVisit(ticketId, form);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to record visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Visit date */}
      <div>
        <label className="ag-label">
          <Calendar className="inline w-3.5 h-3.5 mr-1" />
          Visit Date <span className="text-red-400">*</span>
        </label>
        <input type="date" className="ag-input" value={form.visit_date} onChange={set('visit_date')} />
      </div>

      {/* Confirmed disease */}
      <div>
        <label className="ag-label">
          <Stethoscope className="inline w-3.5 h-3.5 mr-1" />
          Confirmed Disease <span className="text-red-400">*</span>
        </label>
        <select className="ag-select" value={form.confirmed_disease} onChange={set('confirmed_disease')}>
          <option value="">Select disease...</option>
          {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
          <option value="OTHER">Other (specify in notes)</option>
        </select>
      </div>

      {/* Severity */}
      <div>
        <label className="ag-label">Severity Level <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { level: 'LOW', label: 'Low', desc: 'Mild / Local' },
            { level: 'MEDIUM', label: 'Medium', desc: 'Moderate' },
            { level: 'HIGH', label: 'High', desc: 'Severe / Urgent' },
          ].map(({ level, label, desc }) => {
            const active = form.severity === level;
            const activeClasses =
              level === 'HIGH'
                ? 'border-red-500 bg-red-950/50 text-red-200 ring-2 ring-red-500/30 shadow-md shadow-red-950/40'
                : level === 'MEDIUM'
                ? 'border-amber-500 bg-amber-950/50 text-amber-200 ring-2 ring-amber-500/30 shadow-md shadow-amber-950/40'
                : 'border-emerald-500 bg-emerald-950/50 text-emerald-200 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/40';

            return (
              <button
                key={level}
                type="button"
                onClick={() => setForm(f => ({ ...f, severity: level }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  active
                    ? activeClasses
                    : 'bg-[#092215]/50 border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    active
                      ? level === 'HIGH'
                        ? 'bg-red-400 animate-pulse'
                        : level === 'MEDIUM'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-slate-600'
                  }`} />
                  <span>{label}</span>
                </div>
                <span className="text-[10px] font-normal normal-case opacity-75">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Observations */}
      <div>
        <label className="ag-label">
          <FileText className="inline w-3.5 h-3.5 mr-1" />
          Field Observations <span className="text-red-400">*</span>
        </label>
        <textarea
          className="ag-input h-24 resize-none"
          placeholder="Describe what you observed during the field visit..."
          value={form.observations}
          onChange={set('observations')}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="ag-label">Additional Notes</label>
        <textarea
          className="ag-input h-20 resize-none"
          placeholder="Lab recommendations, treatment notes, etc."
          value={form.notes}
          onChange={set('notes')}
        />
      </div>

      {/* Action taken */}
      <div>
        <label className="ag-label">
          <Zap className="inline w-3.5 h-3.5 mr-1" />
          Action Taken
        </label>
        <input
          type="text"
          className="ag-input"
          placeholder="e.g. Applied fungicide, advised isolation..."
          value={form.action_taken}
          onChange={set('action_taken')}
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="ag-label">
          <Camera className="inline w-3.5 h-3.5 mr-1" />
          Field Photo URL (optional)
        </label>
        <input
          type="url"
          className="ag-input"
          placeholder="https://..."
          value={form.photo_url}
          onChange={set('photo_url')}
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center py-3 text-sm font-semibold"
      >
        <CheckCircle className="w-4 h-4" />
        {loading ? 'Saving Field Visit…' : 'Save Field Visit & Notify Farmer'}
      </button>
    </form>
  );
}
