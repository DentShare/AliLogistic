import { useState, useRef } from 'react'
import { AlertTriangle, Clock, CheckCircle, XCircle, LayoutGrid, List, Upload, CalendarCheck } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { daysStatus } from '../data/mock'

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

function PassInspectionBtn({ inspId, onPass }: { inspId: string; onPass: (id: string, date: string) => void }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
        <CalendarCheck size={13} /> Pass
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="px-1.5 py-0.5 text-xs rounded bg-navy-700 border border-navy-600 text-slate-300 focus:outline-none focus:border-accent" />
      <button onClick={() => { if (date) { onPass(inspId, date); setOpen(false); setDate('') } }}
        disabled={!date}
        className="px-2 py-0.5 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        OK
      </button>
      <button onClick={() => { setOpen(false); setDate('') }}
        className="px-1.5 py-0.5 text-xs rounded bg-navy-600 text-slate-400 hover:text-slate-200 transition-colors">
        X
      </button>
    </div>
  )
}

function UploadDocBtn({ inspId, onUpload }: { inspId: string; onUpload: (id: string, name: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input ref={fileRef} type="file" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) { onUpload(inspId, file.name); e.target.value = '' }
        }} />
      <button onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors">
        <Upload size={13} /> Upload
      </button>
    </>
  )
}

export default function Inspections() {
  const [view, setView] = useState<'table' | 'cards'>('cards')
  const { inspections, units, passInspection, uploadInspDocument } = useApp()
  const getUnit = (id: string) => units.find(u => u.id === id)

  // Sort: expired first, then by days_remaining ascending (most urgent first)
  const sorted = [...inspections].sort((a, b) => {
    const aExpired = a.days_remaining < 0 ? 0 : 1
    const bExpired = b.days_remaining < 0 ? 0 : 1
    if (aExpired !== bExpired) return aExpired - bExpired
    return a.days_remaining - b.days_remaining
  })

  const expired = inspections.filter(i => i.days_remaining < 0).length
  const urgent = inspections.filter(i => i.days_remaining >= 0 && i.days_remaining <= 30).length
  const soon = inspections.filter(i => i.days_remaining > 30 && i.days_remaining <= 90).length
  const valid = inspections.filter(i => i.days_remaining > 90).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Expired / <7d" value={expired} icon={XCircle} color="text-red-400" />
        <KpiCard title="Urgent 7-30d" value={urgent} icon={AlertTriangle} color="text-orange-400" />
        <KpiCard title="Soon 30-90d" value={soon} icon={Clock} color="text-yellow-400" />
        <KpiCard title="Valid >90d" value={valid} icon={CheckCircle} color="text-emerald-400" />
      </div>

      <div className="flex justify-end gap-1">
        <button onClick={() => setView('cards')} className={`p-2 rounded-lg ${view === 'cards' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><LayoutGrid size={18} /></button>
        <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300'}`}><List size={18} /></button>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {sorted.map(i => {
            const unit = getUnit(i.unit_id)
            if (!unit) return null
            const st = daysStatus(i.days_remaining)
            return (
              <div key={i.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4 flex flex-col items-center gap-3">
                <CountdownRing days={i.days_remaining} />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{unit.unit_number}</div>
                  <div className="text-xs text-slate-500">{unit.driver}</div>
                </div>
                <StatusBadge status={st} label={st === 'expired' ? 'EXPIRED' : `${i.days_remaining}d remaining`} />
                <div className="text-xs text-slate-500 space-y-1 w-full">
                  <div className="flex justify-between"><span>Certificate</span><span className="font-mono text-slate-400">{i.doc_number}</span></div>
                  <div className="flex justify-between"><span>Inspected</span><span className="font-mono text-slate-400">{i.inspection_date}</span></div>
                  <div className="flex justify-between"><span>Expires</span><span className="font-mono text-slate-400">{i.expiry_date}</span></div>
                </div>
                {i.document_name && (
                  <div className="text-[11px] text-blue-400/80 truncate w-full text-center" title={i.document_name}>
                    Doc: {i.document_name}
                  </div>
                )}
                <div className="w-full h-1.5 bg-navy-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${st === 'expired' || st === 'critical' ? 'bg-red-500' : st === 'warning' ? 'bg-orange-500' : st === 'soon' ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, (i.days_remaining / 365) * 100))}%` }} />
                </div>
                <div className="flex gap-2 w-full justify-center pt-1">
                  <PassInspectionBtn inspId={i.id} onPass={passInspection} />
                  <UploadDocBtn inspId={i.id} onUpload={uploadInspDocument} />
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
                {['Unit', 'Driver', 'VIN', 'Doc #', 'Inspected', 'Expires', 'Days Left', 'Status', 'Document', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(i => {
                const unit = getUnit(i.unit_id)
                if (!unit) return null
                const st = daysStatus(i.days_remaining)
                return (
                  <tr key={i.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                    <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{unit.vin}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{i.doc_number}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{i.inspection_date}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{i.expiry_date}</td>
                    <td className="px-4 py-3 font-mono">{i.days_remaining < 0 ? <span className="text-red-400">{i.days_remaining}d</span> : <span className="text-slate-300">{i.days_remaining}d</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={st} /></td>
                    <td className="px-4 py-3 text-xs text-blue-400/80 max-w-[140px] truncate">{i.document_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <PassInspectionBtn inspId={i.id} onPass={passInspection} />
                        <UploadDocBtn inspId={i.id} onUpload={uploadInspDocument} />
                      </div>
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
