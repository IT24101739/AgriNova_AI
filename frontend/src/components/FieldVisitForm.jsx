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
        <div className="flex gap-2">
          {['LOW', 'MEDIUM', 'HIGH'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: s }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                form.severity === s
                  ? s === 'HIGH'   ? 'bg-red-500/20 border-red-500/60 text-red-300'
                  : s === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  :                  'bg-green-500/20 border-green-500/60 text-green-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              {s}
            </button>
          ))}
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
