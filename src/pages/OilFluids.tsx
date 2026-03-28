import { Droplets, AlertTriangle, Send, CheckCircle, TrendingDown } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { oilRecords, getUnit, oilStatus } from '../data/mock'

export default function OilFluids() {
  const critical = oilRecords.filter(o => oilStatus(o.remaining, o.change_interval) === 'critical').length
  const warning = oilRecords.filter(o => oilStatus(o.remaining, o.change_interval) === 'warning').length
  const sent = oilRecords.filter(o => o.sent_for_change).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Records" value={oilRecords.length} icon={Droplets} />
        <KpiCard title="Critical" value={critical} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Warning" value={warning} icon={TrendingDown} color="text-orange-400" />
        <KpiCard title="Sent for Change" value={sent} icon={Send} color="text-blue-400" />
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Unit', 'Driver', 'Oil Type', 'Interval', 'Last Changed', 'Next Change', 'Remaining', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {oilRecords.map(o => {
              const unit = getUnit(o.unit_id)
              if (!unit) return null
              const st = oilStatus(o.remaining, o.change_interval)
              const pct = ((o.remaining / o.change_interval) * 100).toFixed(0)
              return (
                <tr key={o.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 cursor-pointer hover:text-accent transition-colors">{o.oil_type} <span className="text-slate-600 text-xs">&#9998;</span></span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-300 bg-navy-700 px-2 py-0.5 rounded cursor-pointer hover:bg-navy-600 transition-colors">
                      {o.change_interval.toLocaleString()} mi <span className="text-slate-600 text-xs">&#9998;</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{o.last_changed.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{o.next_change.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-navy-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${st === 'critical' ? 'bg-red-500' : st === 'warning' ? 'bg-orange-500' : st === 'ok' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, Number(pct))}%` }}
                        />
                      </div>
                      <span className={`font-mono text-xs ${st === 'critical' ? 'text-red-400' : st === 'warning' ? 'text-orange-400' : 'text-slate-400'}`}>
                        {o.remaining.toLocaleString()} mi
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.sent_for_change ? (
                      <StatusBadge status="sent" label="Sent" />
                    ) : (
                      <StatusBadge status={st} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-navy-600 text-slate-400 hover:text-white transition-colors" title="Update Mileage">
                        <TrendingDown size={14} />
                      </button>
                      {!o.sent_for_change && (st === 'critical' || st === 'warning') && (
                        <button className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Send for Change">
                          <Send size={14} />
                        </button>
                      )}
                      {o.sent_for_change && (
                        <button className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors" title="Mark Done">
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
