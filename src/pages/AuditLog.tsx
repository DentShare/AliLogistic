import { ClipboardList, Calendar, Hash, BarChart3 } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { useApp } from '../context/AppContext'

const moduleColors: Record<string, string> = {
  Oil: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Mileage: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Defects: 'bg-red-500/15 text-red-400 border-red-500/30',
  Repairs: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Inspection: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Registration: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Units: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}
const initials = (name: string) => name.split(' ').map(n => n[0]).join('')

export default function AuditLog() {
  const { auditLog } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = auditLog.filter(e => e.timestamp.startsWith(today)).length
  const dispatchers = [...new Set(auditLog.map(e => e.dispatcher))]
  const mostModified = auditLog.reduce((acc, e) => { acc[e.unit_number] = (acc[e.unit_number] || 0) + 1; return acc }, {} as Record<string, number>)
  const topUnit = Object.entries(mostModified).sort((a, b) => b[1] - a[1])[0]

  const dispatcherStats = dispatchers.map(d => {
    const entries = auditLog.filter(e => e.dispatcher === d)
    const unitsSet = [...new Set(entries.map(e => e.unit_number))]
    const modules = [...new Set(entries.map(e => e.module))]
    return { name: d, total: entries.length, units: unitsSet.length, modules }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Changes" value={auditLog.length} icon={ClipboardList} />
        <KpiCard title="Today" value={todayCount} icon={Calendar} color="text-accent" />
        <KpiCard title="Most Modified" value={topUnit ? topUnit[0] : '—'} icon={Hash} color="text-yellow-400" subtitle={topUnit ? `${topUnit[1]} changes` : ''} />
        <KpiCard title="Dispatchers" value={dispatchers.length} icon={BarChart3} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dispatcherStats.map(d => (
          <div key={d.name} className="bg-navy-800 rounded-xl border border-navy-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold">{initials(d.name)}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{d.name}</div>
              <div className="text-xs text-slate-500">{d.total} changes &middot; {d.units} units touched</div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {d.modules.map(m => (
                  <span key={m} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${moduleColors[m] || 'bg-slate-500/15 text-slate-400'}`}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Timestamp', 'Dispatcher', 'Unit', 'Module', 'Description', 'Field', 'Change'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLog.map(e => (
              <tr key={e.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.timestamp}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center text-accent text-[10px] font-bold">{initials(e.dispatcher)}</div>
                    <span className="text-slate-300">{e.dispatcher}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-white">{e.unit_number}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${moduleColors[e.module] || 'bg-slate-500/15 text-slate-400'}`}>{e.module}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{e.description}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.field}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs">
                    <span className="text-red-400 line-through">{e.old_value}</span>
                    <span className="text-slate-600 mx-1">&rarr;</span>
                    <span className="text-emerald-400">{e.new_value}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
