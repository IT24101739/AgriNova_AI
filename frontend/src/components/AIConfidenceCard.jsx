/**
 * AIConfidenceCard – displays disease name + confidence bar
 */
function getBarColor(confidence) {
  if (confidence >= 0.75) return 'bg-green-500';
  if (confidence >= 0.5)  return 'bg-amber-500';
  return 'bg-red-500';
}

export default function AIConfidenceCard({ disease, confidence, severity, crop }) {
  const pct = Math.round((confidence || 0) * 100);
  const barColor = getBarColor(confidence || 0);

  return (
    <div className="glass-elevated rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">AI Prediction</p>
          <p className="font-semibold text-white text-sm leading-snug">{disease || 'Unknown'}</p>
          {crop && <p className="text-xs text-slate-400 mt-0.5">Crop: {crop}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-white">{pct}%</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">confidence</p>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="conf-bar-track">
        <div
          className={`conf-bar-fill ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Severity */}
      {severity && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Severity:</span>
          <span className={
            severity === 'HIGH' ? 'text-red-400 font-semibold' :
            severity === 'MEDIUM' ? 'text-amber-400 font-semibold' :
            'text-green-400 font-semibold'
          }>{severity}</span>
        </div>
      )}
    </div>
  );
}
