import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { OP_STATUS_CONFIG, type UnitOperationalStatus } from '../data/mock'

export default function StatusLog() {
  const { units, unitStatusLog } = useApp()
  const [filterUnit, setFilterUnit] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBy, setFilterBy] = useState('')

  const getUnitNumber = (unitId: string) => units.find(u => u.id === unitId)?.unit_number || '?'

  const filtered = unitStatusLog.filter(e => {
    if (filterUnit && !getUnitNumber(e.unit_id).toLowerCase().includes(filterUnit.toLowerCase())) return false
    if (filterStatus && e.new_status !== filterStatus) return false
    if (filterBy && !e.changed_by.toLowerCase().includes(filterBy.toLowerCase())) return false
    return true
  })

  const allStatuses = Object.keys(OP_STATUS_CONFIG) as UnitOperationalStatus[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/updates" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-accent transition-colors">
          <ArrowLeft size={16} /> Back to Updates
        </Link>
        <h2 className="text-lg font-bold text-white">Status Change Log</h2>
        <div className="text-xs text-slate-500">{filtered.length} entries</div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={filterUnit} onChange={e => setFilterUnit(e.target.value)} placeholder="Filter by unit..."
          className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500 w-40" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
          <option value="">All statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{OP_STATUS_CONFIG[s].label}</option>)}
        </select>
        <input value={filterBy} onChange={e => setFilterBy(e.target.value)} placeholder="Filter by dispatcher..."
          className="bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500 w-44" />
      </div>

      {/* Timeline + Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Time', 'Unit', 'Change', 'Note', 'Load #', 'Changed By'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const prevCfg = e.previous_status ? OP_STATUS_CONFIG[e.previous_status] : null
              const newCfg = OP_STATUS_CONFIG[e.new_status]
              return (
                <tr key={e.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {new Date(e.changed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/units/${e.unit_id}`} className="font-bold text-white hover:text-accent transition-colors">
                      {getUnitNumber(e.unit_id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {prevCfg ? (
                        <StatusBadge status={e.previous_status!} label={prevCfg.label} />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                      <ArrowRight size={12} className="text-slate-500 shrink-0" />
                      <StatusBadge status={e.new_status} label={newCfg.label} pulse={newCfg.pulse} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">{e.note || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{e.load_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{e.changed_by}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No log entries match the filters.</div>}
      </div>
    </div>
  )
}
