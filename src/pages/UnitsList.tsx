import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, CheckCircle, Wrench, MinusCircle, LayoutGrid, List, Plus } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { oilStatus, daysStatus } from '../data/mock'

export default function UnitsList() {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const { units, oilRecords, inspections, defects, drivers, assignDriver, openModal, searchQuery, oilThresholds } = useApp()

  const filtered = searchQuery
    ? units.filter(u => u.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) || u.driver.toLowerCase().includes(searchQuery.toLowerCase()))
    : units

  const activeCount = units.filter(u => u.status === 'active').length
  const inRepairCount = units.filter(u => u.status === 'in_repair').length
  const inactiveCount = units.filter(u => u.status === 'inactive').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Fleet" value={units.length} icon={Truck} />
        <KpiCard title="Active" value={activeCount} icon={CheckCircle} color="text-emerald-400" />
        <KpiCard title="In Repair" value={inRepairCount} icon={Wrench} color="text-orange-400" />
        <KpiCard title="Inactive" value={inactiveCount} icon={MinusCircle} color="text-yellow-400" />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => openModal('create-truck')}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
          <Plus size={16} /> Create Truck
        </button>
        <div className="flex gap-1">
          <button onClick={() => setView('cards')} className={`p-2 rounded-lg ${view === 'cards' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18} /></button>
          <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><List size={18} /></button>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(u => {
            const unitOil = oilRecords.filter(o => o.unit_id === u.id)
            const worstOil = unitOil.length ? unitOil.reduce((w, o) => (o.remaining / o.change_interval) < (w.remaining / w.change_interval) ? o : w) : null
            const worstOilSt = worstOil ? oilStatus(worstOil.remaining, worstOil.change_interval, oilThresholds) : null
            const insp = inspections.find(i => i.unit_id === u.id)
            const inspSt = insp ? daysStatus(insp.days_remaining) : null
            const defectCount = defects.filter(d => d.unit_id === u.id && d.status === 'active').length
            return (
              <Link key={u.id} to={`/units/${u.id}`} className="bg-navy-800 rounded-xl border border-navy-700 p-4 hover:border-accent/40 transition-colors block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">{u.unit_number}</span>
                  <StatusBadge status={u.status} />
                </div>
                <div className="text-xs text-slate-500 mb-1">{u.driver}</div>
                <div className="text-xs font-mono text-slate-600 mb-1">{u.vin}</div>
                <div className="text-sm font-mono text-slate-400 mb-3">{u.mileage.toLocaleString()} mi</div>
                <div className="text-xs text-slate-500 mb-2">{u.year} {u.make} {u.model}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {worstOilSt && <StatusBadge status={worstOilSt} label={`Oil: ${worstOilSt}`} />}
                  {inspSt && <StatusBadge status={inspSt} label={`DOT: ${inspSt}`} />}
                  {defectCount > 0 && <StatusBadge status="critical" label={`${defectCount} defect${defectCount > 1 ? 's' : ''}`} pulse />}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                {['Unit', 'Status', 'VIN', 'Driver', 'Mileage', 'Oil', 'DOT', 'Defects', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const unitOil = oilRecords.filter(o => o.unit_id === u.id)
                const worstOil = unitOil.length ? unitOil.reduce((w, o) => (o.remaining / o.change_interval) < (w.remaining / w.change_interval) ? o : w) : null
                const worstOilSt = worstOil ? oilStatus(worstOil.remaining, worstOil.change_interval, oilThresholds) : null
                const insp = inspections.find(i => i.unit_id === u.id)
                const inspSt = insp ? daysStatus(insp.days_remaining) : null
                const defectCount = defects.filter(d => d.unit_id === u.id && d.status === 'active').length
                return (
                  <tr key={u.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3"><Link to={`/units/${u.id}`} className="font-semibold text-white hover:text-accent">{u.unit_number}</Link></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.vin}</td>
                    <td className="px-4 py-3">
                      <select
                        value={drivers.find(d => d.unit_id === u.id)?.id || ''}
                        onChange={e => {
                          const drv = drivers.find(d => d.id === e.target.value)
                          if (drv) assignDriver(u.id, drv.name, drv.id)
                          else assignDriver(u.id, '—')
                        }}
                        onClick={e => e.preventDefault()}
                        className="bg-navy-700 border border-navy-600 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none focus:border-accent"
                      >
                        <option value="">— No driver —</option>
                        {drivers.filter(d => d.status === 'working').map(d => (
                          <option key={d.id} value={d.id}>{d.name}{d.unit_id && d.unit_id !== u.id ? ' (assigned)' : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{u.mileage.toLocaleString()}</td>
                    <td className="px-4 py-3">{worstOilSt && <StatusBadge status={worstOilSt} />}</td>
                    <td className="px-4 py-3">{inspSt && <StatusBadge status={inspSt} />}</td>
                    <td className="px-4 py-3">{defectCount > 0 ? <span className="text-red-400 font-semibold">{defectCount}</span> : <span className="text-slate-600">0</span>}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{u.created}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
