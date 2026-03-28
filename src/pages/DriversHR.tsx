import { useState } from 'react'
import { Users, CheckCircle, Clock, XCircle, AlertTriangle, LayoutGrid, List } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { drivers, units } from '../data/mock'

const working = drivers.filter(d => d.status === 'working').length
const reviewing = drivers.filter(d => d.status === 'reviewing').length
const terminated = drivers.filter(d => d.status === 'terminated').length

function daysTill(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date('2026-03-28').getTime()) / 86400000)
}
const expiringDocs = drivers.filter(d => daysTill(d.cdl_expiry) < 90 || daysTill(d.medical_expiry) < 90).length

function tenure(hire: string) {
  const months = Math.round((new Date('2026-03-28').getTime() - new Date(hire).getTime()) / (30 * 86400000))
  return months
}
const avgTenure = Math.round(drivers.reduce((s, d) => s + tenure(d.hire_date), 0) / drivers.length)

const statusColors: Record<string, string> = { working: 'bg-emerald-500', reviewing: 'bg-yellow-500', terminated: 'bg-red-500' }
const initials = (name: string) => name.split(' ').map(n => n[0]).join('')

export default function DriversHR() {
  const [view, setView] = useState<'cards' | 'table'>('cards')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Working" value={working} icon={CheckCircle} color="text-emerald-400" />
        <KpiCard title="Reviewing" value={reviewing} icon={Clock} color="text-yellow-400" />
        <KpiCard title="Terminated" value={terminated} icon={XCircle} color="text-red-400" />
        <KpiCard title="Expiring Docs" value={expiringDocs} icon={AlertTriangle} color="text-orange-400" />
        <KpiCard title="Avg Tenure" value={`${avgTenure}mo`} icon={Users} />
      </div>

      <div className="flex justify-end gap-1">
        <button onClick={() => setView('cards')} className={`p-2 rounded-lg ${view === 'cards' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18} /></button>
        <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><List size={18} /></button>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(d => {
            const unit = d.unit_id ? units.find(u => u.id === d.unit_id) : null
            const cdlDays = daysTill(d.cdl_expiry)
            const medDays = daysTill(d.medical_expiry)
            return (
              <div key={d.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${statusColors[d.status]} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                    {initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.phone}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="text-xs text-slate-500 space-y-2">
                  <div className="flex justify-between"><span>Hired</span><span className="font-mono text-slate-400">{d.hire_date}</span></div>
                  <div className="flex justify-between"><span>Tenure</span><span className="font-mono text-slate-400">{tenure(d.hire_date)} months</span></div>
                  {unit && <div className="flex justify-between"><span>Assigned</span><span className="font-semibold text-white">{unit.unit_number}</span></div>}
                  <div className="flex justify-between items-center">
                    <span>CDL</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{d.cdl_number}</span>
                      <span className={`font-mono text-xs ${cdlDays < 30 ? 'text-red-400' : cdlDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.cdl_expiry}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Medical</span>
                    <span className={`font-mono text-xs ${medDays < 30 ? 'text-red-400' : medDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.medical_expiry}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                {['Name', 'Status', 'Phone', 'Unit', 'CDL', 'CDL Expiry', 'Medical Expiry', 'Tenure', 'Hired'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => {
                const unit = d.unit_id ? units.find(u => u.id === d.unit_id) : null
                const cdlDays = daysTill(d.cdl_expiry)
                const medDays = daysTill(d.medical_expiry)
                return (
                  <tr key={d.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${statusColors[d.status]} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{initials(d.name)}</div>
                        <span className="font-semibold text-white">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-slate-400">{d.phone}</td>
                    <td className="px-4 py-3 font-semibold text-white">{unit?.unit_number || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{d.cdl_number}</td>
                    <td className={`px-4 py-3 font-mono ${cdlDays < 30 ? 'text-red-400' : cdlDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.cdl_expiry}</td>
                    <td className={`px-4 py-3 font-mono ${medDays < 30 ? 'text-red-400' : medDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.medical_expiry}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{tenure(d.hire_date)}mo</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{d.hire_date}</td>
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
