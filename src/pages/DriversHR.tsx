import { useState } from 'react'
import { CheckCircle, Clock, XCircle, UserPlus } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { useApp } from '../context/AppContext'

function daysTill(date: string) { return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000) }
const statusColors: Record<string, string> = { working: 'bg-emerald-500', reviewing: 'bg-yellow-500', terminated: 'bg-red-500' }
const initials = (name: string) => name.split(' ').map(n => n[0]).join('')

export default function DriversHR() {
  const { drivers, units, createDriver, updateDriverStatus, searchQuery } = useApp()
  const [showCreate, setShowCreate] = useState(false)

  const filteredDrivers = searchQuery
    ? drivers.filter(d => { const q = searchQuery.toLowerCase(); return d.name.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q) || d.cdl_number.toLowerCase().includes(q) })
    : drivers

  const reviewing = filteredDrivers.filter(d => d.status === 'reviewing')
  const working = filteredDrivers.filter(d => d.status === 'working')
  const terminated = filteredDrivers.filter(d => d.status === 'terminated')

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* KPI cards + Add button */}
      <div className="flex items-start gap-4 shrink-0">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <KpiCard title="Reviewing" value={reviewing.length} icon={Clock} color="text-yellow-400" />
          <KpiCard title="Working" value={working.length} icon={CheckCircle} color="text-emerald-400" />
          <KpiCard title="Terminated" value={terminated.length} icon={XCircle} color="text-red-400" />
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors shrink-0">
          <UserPlus size={16} /> New Driver
        </button>
      </div>

      {showCreate && <CreateDriverForm onClose={() => setShowCreate(false)} onCreate={createDriver} units={units} />}

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        <KanbanColumn
          title="Reviewing"
          color="bg-yellow-500/20 text-yellow-400"
          count={reviewing.length}
        >
          {reviewing.map(d => {
            const unit = d.unit_id ? units.find(u => u.id === d.unit_id) : null
            return (
              <DriverCard key={d.id} driver={d} unitNumber={unit?.unit_number}>
                <button onClick={() => updateDriverStatus(d.id, 'working')} className="flex-1 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors">Approve</button>
                <button onClick={() => updateDriverStatus(d.id, 'terminated')} className="flex-1 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/25 transition-colors">Terminate</button>
              </DriverCard>
            )
          })}
        </KanbanColumn>

        <KanbanColumn
          title="Working"
          color="bg-emerald-500/20 text-emerald-400"
          count={working.length}
        >
          {working.map(d => {
            const unit = d.unit_id ? units.find(u => u.id === d.unit_id) : null
            return (
              <DriverCard key={d.id} driver={d} unitNumber={unit?.unit_number}>
                <button onClick={() => updateDriverStatus(d.id, 'reviewing')} className="flex-1 py-1.5 bg-yellow-500/15 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-500/25 transition-colors">Review</button>
                <button onClick={() => updateDriverStatus(d.id, 'terminated')} className="flex-1 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/25 transition-colors">Terminate</button>
              </DriverCard>
            )
          })}
        </KanbanColumn>

        <KanbanColumn
          title="Terminated"
          color="bg-red-500/20 text-red-400"
          count={terminated.length}
        >
          {terminated.map(d => {
            const unit = d.unit_id ? units.find(u => u.id === d.unit_id) : null
            return (
              <DriverCard key={d.id} driver={d} unitNumber={unit?.unit_number}>
                <button onClick={() => updateDriverStatus(d.id, 'reviewing')} className="flex-1 py-1.5 bg-yellow-500/15 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-500/25 transition-colors">Re-review</button>
              </DriverCard>
            )
          })}
        </KanbanColumn>
      </div>
    </div>
  )
}

function KanbanColumn({ title, color, count, children }: { title: string; color: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 flex flex-col max-h-full">
      <div className="p-3 border-b border-navy-700 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-300">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">{children}</div>
    </div>
  )
}

function CreateDriverForm({ onClose, onCreate, units }: {
  onClose: () => void
  onCreate: (data: { name: string; phone: string; cdl_number: string; cdl_expiry: string; medical_expiry: string; unit_id?: string }) => void
  units: { id: string; unit_number: string }[]
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cdl, setCdl] = useState('')
  const [cdlExp, setCdlExp] = useState('')
  const [medExp, setMedExp] = useState('')
  const [unitId, setUnitId] = useState('')

  const inputCls = 'w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500'

  return (
    <div className="bg-navy-800 rounded-xl border border-accent/30 p-5 space-y-4 shrink-0">
      <h4 className="text-sm font-semibold text-white">Register New Driver</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Phone *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Assign Unit</label>
          <select value={unitId} onChange={e => setUnitId(e.target.value)}
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
            <option value="">— No unit —</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">CDL Number *</label>
          <input value={cdl} onChange={e => setCdl(e.target.value)} placeholder="CDL-XXXXXXXX" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">CDL Expiry *</label>
          <input type="date" value={cdlExp} onChange={e => setCdlExp(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Medical Expiry *</label>
          <input type="date" value={medExp} onChange={e => setMedExp(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 bg-navy-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-navy-500 transition-colors">Cancel</button>
        <button onClick={() => {
          if (!name || !phone || !cdl || !cdlExp || !medExp) return
          onCreate({ name, phone, cdl_number: cdl, cdl_expiry: cdlExp, medical_expiry: medExp, unit_id: unitId || undefined })
          onClose()
        }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
          Register Driver
        </button>
      </div>
    </div>
  )
}

function DriverCard({ driver: d, unitNumber, children }: { driver: any; unitNumber?: string; children: React.ReactNode }) {
  const cdlDays = daysTill(d.cdl_expiry)
  const medDays = daysTill(d.medical_expiry)

  return (
    <div className="bg-navy-900 rounded-lg p-3 border border-navy-700">
      {/* Header: avatar + name + phone */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-9 h-9 ${statusColors[d.status]} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {initials(d.name)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{d.name}</div>
          <div className="text-xs text-slate-500">{d.phone}</div>
        </div>
      </div>

      {/* Details */}
      <div className="text-xs text-slate-500 space-y-1.5 mb-3">
        <div className="flex justify-between">
          <span>CDL</span>
          <span className="font-mono text-slate-400">{d.cdl_number}</span>
        </div>
        <div className="flex justify-between">
          <span>CDL Expiry</span>
          <span className={`font-mono ${cdlDays < 30 ? 'text-red-400' : cdlDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.cdl_expiry}</span>
        </div>
        <div className="flex justify-between">
          <span>Medical Expiry</span>
          <span className={`font-mono ${medDays < 30 ? 'text-red-400' : medDays < 90 ? 'text-yellow-400' : 'text-slate-400'}`}>{d.medical_expiry}</span>
        </div>
        <div className="flex justify-between">
          <span>Hired</span>
          <span className="font-mono text-slate-400">{d.hire_date}</span>
        </div>
        {unitNumber && (
          <div className="flex justify-between">
            <span>Unit</span>
            <span className="font-semibold text-white">{unitNumber}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">{children}</div>
    </div>
  )
}
