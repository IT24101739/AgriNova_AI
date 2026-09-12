import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getTicket } from '../services/officerApi';
import FieldVisitForm from '../components/FieldVisitForm';
import { ArrowLeft, CalendarCheck, MapPin, Leaf, Loader2 } from 'lucide-react';

export default function FieldVisit() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getTicket(ticketId)
      .then(r => setTicket(r.data))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
    </div>
  );

  if (done) return (
    <div className="max-w-md mx-auto mt-16 glass rounded-2xl p-8 text-center animate-slide-up">
      <CalendarCheck className="w-14 h-14 text-brand-green mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Field Visit Recorded!</h2>
      <p className="text-sm text-slate-400 mb-6">
        The diagnosis has been confirmed, the report updated, and the farmer has been notified.
        AI feedback has been saved for model improvement.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(`/officer/tickets/${ticketId}`)}
          className="btn-secondary"
        >
          View Ticket
        </button>
        <button onClick={() => navigate('/officer')} className="btn-primary">
          Dashboard
        </button>
      </div>
    </div>
  );

  const report = ticket?.reports || {};
  const farm = report?.farms || {};

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/officer/tickets/${ticketId}`)}
          className="btn-secondary py-2 px-3"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Record Field Visit</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ticket #{ticketId?.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Case summary bar */}
      {ticket && (
        <div className="glass rounded-xl px-5 py-3 flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-brand-green" />
            <span className="text-white font-medium">{report.disease || 'Undiagnosed'}</span>
            <span className="text-slate-400">on {report.crop}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            {farm.district || 'Unknown location'}
          </div>
          {report.confidence && (
            <div className="ml-auto text-xs text-slate-400">
              AI confidence: <span className="text-white font-semibold">
                {Math.round(report.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Form card */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-white text-sm mb-5 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-brand-green" />
          Field Visit Details
        </h2>
        <FieldVisitForm
          ticketId={ticketId}
          onSuccess={() => setDone(true)}
        />
      </div>
    </div>
  );
}
