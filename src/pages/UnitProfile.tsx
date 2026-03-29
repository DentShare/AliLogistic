import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Droplets, ShieldCheck, FileText, Wrench, AlertTriangle } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { oilStatus, daysStatus } from '../data/mock'

const tabs = ['Overview', 'Oil', 'Repairs', 'Defects', 'Timeline'] as const

export default function UnitProfile() {
  const { id } = useParams()
  const [tab, setTab] = useState<typeof tabs[number]>('Overview')
  const { units, oilRecords, inspections, registrations, repairs, defects, drivers, oilThresholds, resolveDefect, reopenDefect, assignDriver, openModal } = useApp()

  const unit = units.find(u => u.id === id)
  if (!unit) return <div className="text-slate-400">Unit not found</div>

  const unitOil = oilRecords.filter(o => o.unit_id === id)
  const unitInsp = inspections.find(i => i.unit_id === id)
  const unitReg = registrations.find(r => r.unit_id === id)
  const unitRepairs = repairs.filter(r => r.unit_id === id)
  const unitDefects = defects.filter(d => d.unit_id === id)
  const activeDefectCount = unitDefects.filter(d => d.status === 'active').length
  const repairTotal = unitRepairs.reduce((s, r) => s + r.cost, 0)
  const worstOil = unitOil.length ? unitOil.reduce((w, o) => (o.remaining / o.change_interval) < (w.remaining / w.change_interval) ? o : w) : null

  const timeline = [
    ...unitRepairs.map(r => ({ date: r.date, type: 'repair' as const, text: `${r.service} — $${r.cost}`, color: 'bg-orange-500' })),
    ...unitDefects.map(d => ({ date: d.date, type: 'defect' as const, text: d.description, color: d.severity === 'critical' ? 'bg-red-500' : d.severity === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500' })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-6">
      <Link to="/units" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-accent transition-colors">
        <ArrowLeft size={16} /> Back to Units
      </Link>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/15 rounded-xl flex items-center justify-center">
              <Truck size={28} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{unit.unit_number}</h2>
                <StatusBadge status={unit.status} />
                {activeDefectCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-slow">
                    {activeDefectCount} defect{activeDefectCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                <select
                  value={drivers.find(d => d.unit_id === unit.id)?.id || ''}
                  onChange={e => {
                    const drv = drivers.find(d => d.id === e.target.value)
                    if (drv) assignDriver(unit.id, drv.name, drv.id)
                    else assignDriver(unit.id, '—')
                  }}
                  className="bg-navy-700 border border-navy-600 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none focus:border-accent"
                >
                  <option value="">— No driver —</option>
                  {drivers.filter(d => d.status === 'working').map(d => (
                    <option key={d.id} value={d.id}>{d.name}{d.unit_id && d.unit_id !== unit.id ? ' (assigned)' : ''}</option>
                  ))}
                </select>
                <span className="font-mono text-xs text-slate-500">{unit.vin}</span>
                <span className="font-mono">{unit.mileage.toLocaleString()} mi</span>
              </div>
            </div>
          </div>
          <button onClick={() => openModal('mileage', { unitId: unit.id })}
            className="px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
            Update Mileage
          </button>
        </div>

        <div className="flex gap-1 border-b border-navy-700 mt-4">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
              <div className="text-xs text-slate-500 mb-1">Mileage</div>
              <div className="text-xl font-bold font-mono text-white">{unit.mileage.toLocaleString()} mi</div>
            </div>
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
              <div className="text-xs text-slate-500 mb-1">Repair Costs</div>
              <div className="text-xl font-bold font-mono text-emerald-400">${(repairTotal / 1000).toFixed(1)}k</div>
              <div className="text-xs text-slate-500">{unitRepairs.length} repairs</div>
            </div>
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
              <div className="text-xs text-slate-500 mb-1">Active Defects</div>
              <div className={`text-xl font-bold font-mono ${activeDefectCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{activeDefectCount}</div>
            </div>
            <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
              <div className="text-xs text-slate-500 mb-1">Vehicle</div>
              <div className="text-sm font-semibold text-white">{unit.year} {unit.make} {unit.model}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {worstOil && (
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                <div className="flex items-center gap-2 mb-3"><Droplets size={16} className="text-blue-400" /><span className="text-sm font-semibold text-slate-300">Oil (worst)</span></div>
                <div className="text-xs text-slate-500 mb-1">{worstOil.oil_type}</div>
                <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${oilStatus(worstOil.remaining, worstOil.change_interval, oilThresholds) === 'critical' ? 'bg-red-500' : oilStatus(worstOil.remaining, worstOil.change_interval, oilThresholds) === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (worstOil.remaining / worstOil.change_interval) * 100)}%` }} />
                </div>
                <div className="text-xs font-mono text-slate-400">{worstOil.remaining.toLocaleString()} mi remaining</div>
              </div>
            )}
            {unitInsp && (
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                <div className="flex items-center gap-2 mb-3"><ShieldCheck size={16} className="text-yellow-400" /><span className="text-sm font-semibold text-slate-300">DOT Inspection</span></div>
                <StatusBadge status={daysStatus(unitInsp.days_remaining)} label={unitInsp.days_remaining < 0 ? `${Math.abs(unitInsp.days_remaining)}d expired` : `${unitInsp.days_remaining}d remaining`} />
                <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full ${unitInsp.days_remaining < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (unitInsp.days_remaining / 365) * 100))}%` }} />
                </div>
              </div>
            )}
            {unitReg && (
              <div className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-purple-400" /><span className="text-sm font-semibold text-slate-300">Registration</span></div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-navy-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">{unitReg.state}</span>
                  <span className="font-mono text-sm text-slate-300">{unitReg.plate_number}</span>
                </div>
                <StatusBadge status={daysStatus(unitReg.days_remaining)} label={unitReg.days_remaining < 0 ? `${Math.abs(unitReg.days_remaining)}d expired` : `${unitReg.days_remaining}d remaining`} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Oil' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {unitOil.map(o => {
            const st = oilStatus(o.remaining, o.change_interval, oilThresholds)
            return (
              <div key={o.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-300">{o.oil_type}</span>
                  <StatusBadge status={o.sent_for_change ? 'sent' : st} label={o.sent_for_change ? 'Sent' : st} />
                </div>
                <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${st === 'critical' ? 'bg-red-500' : st === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (o.remaining / o.change_interval) * 100)}%` }} />
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between"><span>Last Changed</span><span className="font-mono text-slate-400">{o.last_changed.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Next Change</span><span className="font-mono text-slate-400">{o.next_change.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Interval</span><span className="font-mono text-slate-400">{o.change_interval.toLocaleString()} mi</span></div>
                  <div className="flex justify-between"><span>Remaining</span><span className={`font-mono font-semibold ${st === 'critical' ? 'text-red-400' : st === 'warning' ? 'text-orange-400' : 'text-slate-300'}`}>{o.remaining.toLocaleString()} mi</span></div>
                </div>
              </div>
            )
          })}
          {unitOil.length === 0 && <div className="text-slate-500 text-sm">No oil records.</div>}
        </div>
      )}

      {tab === 'Repairs' && (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          {unitRepairs.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700">
                  {['Date', 'Invoice', 'Service', 'Category', 'Shop', 'Cost'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unitRepairs.map(r => (
                  <tr key={r.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3 font-mono text-slate-400">{r.date}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{r.invoice}</td>
                    <td className="px-4 py-3 text-slate-300">{r.service}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.category.toLowerCase()} label={r.category} /></td>
                    <td className="px-4 py-3 text-slate-400">{r.shop}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">${r.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-navy-600">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-slate-400 text-right">Total</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">${repairTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          ) : <div className="p-6 text-slate-500 text-sm">No repairs recorded.</div>}
        </div>
      )}

      {tab === 'Defects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {unitDefects.map(d => (
            <div key={d.id} className={`bg-navy-800 rounded-xl border border-navy-700 border-l-4 ${d.severity === 'critical' ? 'border-l-red-500' : d.severity === 'moderate' ? 'border-l-orange-500' : 'border-l-yellow-500'} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={d.severity} pulse={d.severity === 'critical' && d.status === 'active'} />
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm text-slate-300 mb-2">{d.description}</p>
              <div className="text-xs text-slate-500">Reported by {d.reported_by} on {d.date}</div>
              {d.resolved_date && <div className="text-xs text-emerald-500 mt-1">Resolved {d.resolved_date}</div>}
              {d.status === 'active' ? (
                <button onClick={() => resolveDefect(d.id)} className="mt-2 w-full py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors">Resolve</button>
              ) : (
                <button onClick={() => reopenDefect(d.id)} className="mt-2 w-full py-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold rounded-lg hover:bg-orange-500/25 transition-colors">Reopen</button>
              )}
            </div>
          ))}
          {unitDefects.length === 0 && <div className="text-slate-500 text-sm">No defects.</div>}
        </div>
      )}

      {tab === 'Timeline' && (
        <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-navy-600" />
            <div className="space-y-6">
              {timeline.map((e, i) => (
                <div key={i} className="flex items-start gap-4 relative">
                  <div className={`w-6 h-6 rounded-full ${e.color} shrink-0 flex items-center justify-center z-10`}>
                    {e.type === 'repair' ? <Wrench size={12} className="text-white" /> : <AlertTriangle size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">{e.date}</span>
                      <StatusBadge status={e.type === 'repair' ? 'warning' : 'critical'} label={e.type} />
                    </div>
                    <p className="text-sm text-slate-300">{e.text}</p>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && <div className="text-slate-500 text-sm ml-10">No activity.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
