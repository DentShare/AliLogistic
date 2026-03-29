import { Wrench, DollarSign, TrendingUp, Hash, AlertTriangle, Send, Settings, CheckCircle, ArrowRight } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'

const catColors: Record<string, string> = {
  Brakes: 'bg-red-500/15 text-red-400 border-red-500/30',
  Engine: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Tires: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Suspension: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Electrical: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  HVAC: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Transmission: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
}
const catBar: Record<string, string> = { Brakes: 'bg-red-500', Engine: 'bg-orange-500', Tires: 'bg-blue-500', Suspension: 'bg-purple-500', Electrical: 'bg-yellow-500', HVAC: 'bg-cyan-500', Transmission: 'bg-pink-500' }

type RepairStatus = 'needs_repair' | 'sent' | 'in_repair' | 'working'

const statusOrder: Record<RepairStatus, number> = {
  needs_repair: 0,
  sent: 1,
  in_repair: 2,
  working: 3,
}

const statusLabels: Record<RepairStatus, string> = {
  needs_repair: 'Needs Repair',
  sent: 'Sent',
  in_repair: 'In Repair',
  working: 'Working',
}

const nextStatus: Record<RepairStatus, RepairStatus | null> = {
  needs_repair: 'sent',
  sent: 'in_repair',
  in_repair: 'working',
  working: null,
}

export default function Repairs() {
  const { repairs, units, updateRepairStatus } = useApp()
  const getUnit = (id: string) => units.find(u => u.id === id)

  const totalCost = repairs.reduce((s, r) => s + r.cost, 0)
  const categories = [...new Set(repairs.map(r => r.category))]
  const catBreakdown = categories.map(c => ({ cat: c, total: repairs.filter(r => r.category === c).reduce((s, r) => s + r.cost, 0) })).sort((a, b) => b.total - a.total)

  const needsRepairCount = repairs.filter(r => r.status === 'needs_repair').length
  const sentCount = repairs.filter(r => r.status === 'sent').length
  const inRepairCount = repairs.filter(r => r.status === 'in_repair').length
  const workingCount = repairs.filter(r => r.status === 'working').length

  const sortedRepairs = [...repairs].sort((a, b) => {
    const orderA = statusOrder[(a.status as RepairStatus) || 'needs_repair']
    const orderB = statusOrder[(b.status as RepairStatus) || 'needs_repair']
    if (orderA !== orderB) return orderA - orderB
    return b.date.localeCompare(a.date)
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Needs Repair" value={needsRepairCount} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Sent" value={sentCount} icon={Send} color="text-blue-400" />
        <KpiCard title="In Repair" value={inRepairCount} icon={Settings} color="text-orange-400" />
        <KpiCard title="Working" value={workingCount} icon={CheckCircle} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Repairs" value={repairs.length} icon={Wrench} />
        <KpiCard title="Total Cost" value={`$${totalCost.toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
        <KpiCard title="Avg Cost" value={`$${repairs.length ? Math.round(totalCost / repairs.length).toLocaleString() : 0}`} icon={TrendingUp} color="text-yellow-400" />
        <KpiCard title="Categories" value={categories.length} icon={Hash} color="text-purple-400" />
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Cost by Category</h3>
        <div className="space-y-2">
          {catBreakdown.map(c => (
            <div key={c.cat} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-24">{c.cat}</span>
              <div className="flex-1 h-3 bg-navy-600 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${catBar[c.cat] || 'bg-slate-500'}`}
                  style={{ width: `${(c.total / catBreakdown[0].total) * 100}%` }} />
              </div>
              <span className="font-mono text-xs text-slate-300 w-16 text-right">${c.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Unit', 'Driver', 'Date', 'Invoice', 'Service', 'Category', 'Shop', 'Cost', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRepairs.map(r => {
              const unit = getUnit(r.unit_id)
              if (!unit) return null
              const status = (r.status || 'needs_repair') as RepairStatus
              const next = nextStatus[status]
              return (
                <tr key={r.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{r.invoice}</td>
                  <td className="px-4 py-3 text-slate-300">{r.service}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${catColors[r.category] || 'bg-slate-500/15 text-slate-400'}`}>{r.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.shop}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-400">${r.cost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} label={statusLabels[status]} pulse={status === 'needs_repair'} />
                  </td>
                  <td className="px-4 py-3">
                    {next ? (
                      <button
                        onClick={() => updateRepairStatus(r.id, next)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-navy-600 hover:bg-navy-500 text-slate-300 hover:text-white border border-navy-500 transition-colors"
                      >
                        <ArrowRight size={12} />
                        {statusLabels[next]}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600">--</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-navy-600">
              <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-slate-400 text-right">Total</td>
              <td className="px-4 py-3 font-mono font-bold text-emerald-400">${totalCost.toLocaleString()}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
