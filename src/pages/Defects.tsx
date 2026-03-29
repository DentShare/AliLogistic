import { AlertTriangle, AlertCircle, CheckCircle, AlertOctagon } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'

const severityBorder: Record<string, string> = {
  critical: 'border-l-red-500',
  moderate: 'border-l-orange-500',
  low: 'border-l-yellow-500',
}

export default function Defects() {
  const { defects, units, resolveDefect, reopenDefect } = useApp()
  const getUnit = (id: string) => units.find(u => u.id === id)
  const sevOrder = { critical: 0, moderate: 1, low: 2 }
  const active = defects.filter(d => d.status === 'active').sort((a, b) => (sevOrder[a.severity] ?? 2) - (sevOrder[b.severity] ?? 2))
  const resolved = defects.filter(d => d.status === 'resolved')
  const critical = active.filter(d => d.severity === 'critical').length
  const moderate = active.filter(d => d.severity === 'moderate').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Active Defects" value={active.length} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Critical" value={critical} icon={AlertOctagon} color="text-red-400" />
        <KpiCard title="Moderate" value={moderate} icon={AlertCircle} color="text-orange-400" />
        <KpiCard title="Resolved" value={resolved.length} icon={CheckCircle} color="text-emerald-400" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Active Defects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {active.map(d => {
            const unit = getUnit(d.unit_id)
            if (!unit) return null
            return (
              <div key={d.id} className={`bg-navy-800 rounded-xl border border-navy-700 border-l-4 ${severityBorder[d.severity]} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{unit.unit_number}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.severity} pulse={d.severity === 'critical'} />
                    <StatusBadge status="active" label="Active" />
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-3">{d.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Reported by {d.reported_by}</span>
                  <span className="font-mono">{d.date}</span>
                </div>
                <button onClick={() => resolveDefect(d.id)}
                  className="mt-3 w-full py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors">
                  Resolve Defect
                </button>
              </div>
            )
          })}
          {active.length === 0 && <div className="text-emerald-400 text-sm col-span-3">No active defects. All clear!</div>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Resolved</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {resolved.map(d => {
            const unit = getUnit(d.unit_id)
            if (!unit) return null
            return (
              <div key={d.id} className="bg-navy-800 rounded-xl border border-navy-700 border-l-4 border-l-emerald-500 p-4 opacity-70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{unit.unit_number}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.severity} />
                    <StatusBadge status="resolved" label="Resolved" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">{d.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Reported {d.date}</span>
                  <span>Resolved {d.resolved_date}</span>
                </div>
                <button onClick={() => reopenDefect(d.id)}
                  className="mt-3 w-full py-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold rounded-lg hover:bg-orange-500/25 transition-colors">
                  Reopen Defect
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
