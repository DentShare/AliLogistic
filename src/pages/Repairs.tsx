import { Wrench, DollarSign, TrendingUp, Hash } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { repairs, getUnit } from '../data/mock'

const catColors: Record<string, string> = {
  Brakes: 'bg-red-500/15 text-red-400 border-red-500/30',
  Engine: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Tires: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Suspension: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Electrical: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  HVAC: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Transmission: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
}

const totalCost = repairs.reduce((s, r) => s + r.cost, 0)
const categories = [...new Set(repairs.map(r => r.category))]
const catBreakdown = categories.map(c => ({ cat: c, total: repairs.filter(r => r.category === c).reduce((s, r) => s + r.cost, 0) })).sort((a, b) => b.total - a.total)

export default function Repairs() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Repairs" value={repairs.length} icon={Wrench} />
        <KpiCard title="Total Cost" value={`$${totalCost.toLocaleString()}`} icon={DollarSign} color="text-emerald-400" />
        <KpiCard title="Avg Cost" value={`$${Math.round(totalCost / repairs.length).toLocaleString()}`} icon={TrendingUp} color="text-yellow-400" />
        <KpiCard title="Categories" value={categories.length} icon={Hash} color="text-purple-400" />
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Cost by Category</h3>
        <div className="space-y-2">
          {catBreakdown.map(c => (
            <div key={c.cat} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-24">{c.cat}</span>
              <div className="flex-1 h-3 bg-navy-600 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${catColors[c.cat]?.includes('red') ? 'bg-red-500' : catColors[c.cat]?.includes('orange') ? 'bg-orange-500' : catColors[c.cat]?.includes('blue') ? 'bg-blue-500' : catColors[c.cat]?.includes('purple') ? 'bg-purple-500' : catColors[c.cat]?.includes('yellow') ? 'bg-yellow-500' : catColors[c.cat]?.includes('cyan') ? 'bg-cyan-500' : 'bg-pink-500'}`}
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
              {['Unit', 'Driver', 'Date', 'Invoice', 'Service', 'Category', 'Shop', 'Cost'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repairs.sort((a, b) => b.date.localeCompare(a.date)).map(r => {
              const unit = getUnit(r.unit_id)
              if (!unit) return null
              return (
                <tr key={r.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{r.invoice}</td>
                  <td className="px-4 py-3 text-slate-300">{r.service}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${catColors[r.category] || 'bg-slate-500/15 text-slate-400'}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.shop}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-400">${r.cost.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-navy-600">
              <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-slate-400 text-right">Total</td>
              <td className="px-4 py-3 font-mono font-bold text-emerald-400">${totalCost.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
