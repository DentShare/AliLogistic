import { useState, useRef } from 'react'
import { AlertTriangle, Clock, CheckCircle, XCircle, LayoutGrid, List, Upload, FileText, Pencil } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { daysStatus } from '../data/mock'
import type { Registration } from '../data/mock'

function CountdownRing({ days, max = 365 }: { days: number; max?: number }) {
  const pct = Math.max(0, Math.min(1, days / max))
  const r = 36; const c = 2 * Math.PI * r; const offset = c * (1 - pct)
  const color = days < 0 ? '#ef4444' : days <= 7 ? '#ef4444' : days <= 30 ? '#f97316' : days <= 90 ? '#eab308' : '#22c55e'
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--color-navy-700)" strokeWidth="6" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 45 45)" />
      <text x="45" y="42" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="JetBrains Mono">{days < 0 ? Math.abs(days) : days}</text>
      <text x="45" y="56" textAnchor="middle" fill="var(--color-navy-500)" fontSize="9">{days < 0 ? 'EXPIRED' : 'DAYS'}</text>
    </svg>
  )
}

function InlineEdit({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:bg-navy-600/50 px-1 rounded group inline-flex items-center gap-1"
        onClick={() => { setDraft(value); setEditing(true) }}
        title="Click to edit"
      >
        {value}
        <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') { onSave(draft); setEditing(false) }
        if (e.key === 'Escape') setEditing(false)
      }}
      onBlur={() => setEditing(false)}
      className="bg-navy-700 border border-accent/40 rounded px-1.5 py-0.5 text-white text-xs w-20 outline-none focus:ring-1 focus:ring-accent"
    />
  )
}

function UploadButton({ regId, documentName, onUpload }: { regId: string; documentName?: string; onUpload: (id: string, name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            onUpload(regId, file.name)
            e.target.value = ''
          }
        }}
      />
      {documentName ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 max-w-[140px] truncate" title={documentName}>
          <FileText size={12} className="shrink-0" />
          {documentName}
        </span>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-semibold transition-colors"
        >
          <Upload size={12} />
          Upload
        </button>
      )}
    </div>
  )
}

function sortRegistrations(regs: Registration[]): Registration[] {
  return [...regs].sort((a, b) => {
    const aExpired = a.days_remaining < 0 ? 0 : 1
    const bExpired = b.days_remaining < 0 ? 0 : 1
    if (aExpired !== bExpired) return aExpired - bExpired
    return a.days_remaining - b.days_remaining
  })
}

export default function Registrations() {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const { registrations, units, renewRegistration, updateRegistration, uploadRegDocument, searchQuery } = useApp()
  const getUnit = (id: string) => units.find(u => u.id === id)

  const filteredRegs = searchQuery
    ? registrations.filter(r => { const u = getUnit(r.unit_id); const q = searchQuery.toLowerCase(); return u?.unit_number.toLowerCase().includes(q) || u?.driver.toLowerCase().includes(q) || r.plate_number.toLowerCase().includes(q) || r.state.toLowerCase().includes(q) })
    : registrations
  const sorted = sortRegistrations(filteredRegs)

  const expired = registrations.filter(r => r.days_remaining < 0).length
  const urgent = registrations.filter(r => r.days_remaining >= 0 && r.days_remaining <= 30).length
  const soon = registrations.filter(r => r.days_remaining > 30 && r.days_remaining <= 90).length
  const valid = registrations.filter(r => r.days_remaining > 90).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Expired" value={expired} icon={XCircle} color="text-red-400" />
        <KpiCard title="Urgent <30d" value={urgent} icon={AlertTriangle} color="text-orange-400" />
        <KpiCard title="Soon 30-90d" value={soon} icon={Clock} color="text-yellow-400" />
        <KpiCard title="Valid >90d" value={valid} icon={CheckCircle} color="text-emerald-400" />
      </div>

      <div className="flex justify-end gap-1">
        <button onClick={() => setView('cards')} className={`p-2 rounded-lg ${view === 'cards' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18} /></button>
        <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><List size={18} /></button>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {sorted.map(r => {
            const unit = getUnit(r.unit_id)
            if (!unit) return null
            const st = daysStatus(r.days_remaining)
            return (
              <div key={r.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4 flex flex-col items-center gap-3">
                <CountdownRing days={r.days_remaining} />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{unit.unit_number}</div>
                  <div className="text-xs text-slate-500">{unit.driver}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-navy-600 text-white text-xs font-bold px-2 py-1 rounded">
                    <InlineEdit value={r.state} onSave={v => updateRegistration(r.id, { state: v })} />
                  </span>
                  <span className="font-mono text-sm text-slate-300">
                    <InlineEdit value={r.plate_number} onSave={v => updateRegistration(r.id, { plate_number: v })} />
                  </span>
                </div>
                <StatusBadge status={st} label={st === 'expired' ? 'EXPIRED' : `${r.days_remaining}d remaining`} />
                <div className="text-xs text-slate-500 space-y-1 w-full">
                  <div className="flex justify-between"><span>Doc #</span><span className="font-mono text-slate-400">{r.doc_number}</span></div>
                  <div className="flex justify-between"><span>Registered</span><span className="font-mono text-slate-400">{r.reg_date}</span></div>
                  <div className="flex justify-between"><span>Expires</span><span className="font-mono text-slate-400">{r.expiry_date}</span></div>
                </div>
                <UploadButton regId={r.id} documentName={r.document_name} onUpload={uploadRegDocument} />
                {(st === 'expired' || st === 'critical' || st === 'warning') && (
                  <button onClick={() => renewRegistration(r.id)}
                    className="w-full py-1.5 bg-accent/15 text-accent text-xs font-semibold rounded-lg hover:bg-accent/25 transition-colors">Renew</button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                {['Unit', 'Driver', 'State', 'Plate', 'Doc #', 'Registered', 'Expires', 'Days Left', 'Status', 'Document', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const unit = getUnit(r.unit_id)
                if (!unit) return null
                const st = daysStatus(r.days_remaining)
                return (
                  <tr key={r.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                    <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                    <td className="px-4 py-3">
                      <span className="bg-navy-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        <InlineEdit value={r.state} onSave={v => updateRegistration(r.id, { state: v })} />
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      <InlineEdit value={r.plate_number} onSave={v => updateRegistration(r.id, { plate_number: v })} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.doc_number}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.reg_date}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{r.expiry_date}</td>
                    <td className="px-4 py-3 font-mono">{r.days_remaining < 0 ? <span className="text-red-400">{r.days_remaining}d</span> : <span className="text-slate-300">{r.days_remaining}d</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={st} /></td>
                    <td className="px-4 py-3">
                      <UploadButton regId={r.id} documentName={r.document_name} onUpload={uploadRegDocument} />
                    </td>
                    <td className="px-4 py-3">
                      {(st === 'expired' || st === 'critical' || st === 'warning') && (
                        <button onClick={() => renewRegistration(r.id)} className="text-xs text-accent hover:text-accent-hover font-semibold">Renew</button>
                      )}
                    </td>
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
