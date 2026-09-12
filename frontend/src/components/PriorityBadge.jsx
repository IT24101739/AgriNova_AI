/**
 * PriorityBadge – colour-coded LOW / MEDIUM / HIGH pill
 */
const CONFIG = {
  HIGH:   { cls: 'bg-red-500/20 text-red-400 border border-red-500/30',    dot: 'bg-red-500' },
  MEDIUM: { cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', dot: 'bg-amber-500' },
  LOW:    { cls: 'bg-green-500/20 text-green-400 border border-green-500/30', dot: 'bg-green-500' },
};

export default function PriorityBadge({ priority = 'LOW', pulse = false }) {
  const { cls, dot } = CONFIG[priority] || CONFIG.LOW;
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${pulse && priority === 'HIGH' ? 'animate-ping-slow' : ''}`} />
      {priority}
    </span>
  );
}
