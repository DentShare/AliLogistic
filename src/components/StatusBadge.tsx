const styles: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  expired: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  soon: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ok: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  good: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  valid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_repair: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  needs_repair: 'bg-red-500/15 text-red-400 border-red-500/30',
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  moderate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  low: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  working: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  reviewing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  terminated: 'bg-red-500/15 text-red-400 border-red-500/30',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  // Operational statuses
  rolling: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  sleeping: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  at_shipper: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  at_receiver: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  getting_late: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  on_time: 'bg-green-500/15 text-green-400 border-green-500/30',
  issue: 'bg-red-500/15 text-red-400 border-red-500/30',
  no_load: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

interface Props {
  status: string
  label?: string
  pulse?: boolean
}

export default function StatusBadge({ status, label, pulse }: Props) {
  const s = styles[status] || styles.ok
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${s} ${pulse ? 'animate-pulse-slow' : ''}`}>
      {label || status.replace('_', ' ')}
    </span>
  )
}
