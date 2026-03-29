import { useState, useMemo } from 'react'
import { Droplets, AlertTriangle, Send, CheckCircle, TrendingDown, Settings } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

const STATUS_ORDER: Record<string, number> = { critical: 0, warning: 1, ok: 2, good: 3, sent: 4 }

export default function OilFluids() {
  const { oilRecords, units, oilThresholds, setOilThresholds, sendForChange, openModal, updateOilType, updateOilInterval } = useApp()
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editingInterval, setEditingInterval] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showSettings, setShowSettings] = useState(false)

  const st = (remaining: number, interval: number) => oilStatus(remaining, interval, oilThresholds)

  const critical = oilRecords.filter(o => st(o.remaining, o.change_interval) === 'critical').length
  const warning = oilRecords.filter(o => st(o.remaining, o.change_interval) === 'warning').length
  const sent = oilRecords.filter(o => o.sent_for_change).length
  const getUnit = (id: string) => units.find(u => u.id === id)

  const oilTypes = useMemo(() => {
    const types = Array.from(new Set(oilRecords.map(o => o.oil_type)))
    types.sort()
    return types
  }, [oilRecords])

  const sortedAndFiltered = useMemo(() => {
    const filtered = categoryFilter === 'All'
      ? oilRecords
      : oilRecords.filter(o => o.oil_type === categoryFilter)

    return [...filtered].sort((a, b) => {
      const stA = a.sent_for_change ? 'sent' : st(a.remaining, a.change_interval)
      const stB = b.sent_for_change ? 'sent' : st(b.remaining, b.change_interval)
      return (STATUS_ORDER[stA] ?? 99) - (STATUS_ORDER[stB] ?? 99)
    })
  }, [oilRecords, categoryFilter])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Records" value={oilRecords.length} icon={Droplets} />
        <KpiCard title="Critical" value={critical} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Warning" value={warning} icon={TrendingDown} color="text-orange-400" />
        <KpiCard title="Sent for Change" value={sent} icon={Send} color="text-blue-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            categoryFilter === 'All'
              ? 'bg-accent text-white'
              : 'bg-navy-700 text-slate-400 hover:bg-navy-600 hover:text-slate-200'
          }`}
        >
          All
        </button>
        {oilTypes.map(type => (
          <button
            key={type}
            onClick={() => setCategoryFilter(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              categoryFilter === type
                ? 'bg-accent text-white'
                : 'bg-navy-700 text-slate-400 hover:bg-navy-600 hover:text-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Thresholds settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical: &lt;{oilThresholds.critical.toLocaleString()} mi</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Warning: &lt;{oilThresholds.warning.toLocaleString()} mi</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Soon: &lt;{oilThresholds.soon.toLocaleString()} mi</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Good: &ge;{oilThresholds.soon.toLocaleString()} mi</span>
        </div>
        <button onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700'}`}
          title="Status Thresholds">
          <Settings size={16} />
        </button>
      </div>

      {showSettings && <ThresholdSettings thresholds={oilThresholds} onChange={setOilThresholds} onClose={() => setShowSettings(false)} />}

      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              {['Unit', 'Driver', 'Mileage', 'Oil Type', 'Interval', 'Last Changed', 'Next Change', 'Remaining', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map(o => {
              const unit = getUnit(o.unit_id)
              if (!unit) return null
              const s = st(o.remaining, o.change_interval)
              const pct = ((o.remaining / o.change_interval) * 100).toFixed(0)
              return (
                <tr key={o.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-slate-400">{unit.driver}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{unit.mileage.toLocaleString()} mi</td>
                  <td className="px-4 py-3">
                    {editingType === o.id ? (
                      <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { updateOilType(o.id, editVal); setEditingType(null) } if (e.key === 'Escape') setEditingType(null) }}
                        onBlur={() => setEditingType(null)}
                        className="bg-navy-700 border border-accent rounded px-2 py-0.5 text-sm text-white outline-none w-40" />
                    ) : (
                      <span className="text-slate-300 cursor-pointer hover:text-accent transition-colors"
                        onClick={() => { setEditingType(o.id); setEditVal(o.oil_type) }}>
                        {o.oil_type} <span className="text-slate-600 text-xs">&#9998;</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingInterval === o.id ? (
                      <input autoFocus type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && Number(editVal) >= 1000) { updateOilInterval(o.id, Number(editVal)); setEditingInterval(null) } if (e.key === 'Escape') setEditingInterval(null) }}
                        onBlur={() => setEditingInterval(null)}
                        className="bg-navy-700 border border-accent rounded px-2 py-0.5 text-sm text-white outline-none w-24 font-mono" />
                    ) : (
                      <span className="font-mono text-slate-300 bg-navy-700 px-2 py-0.5 rounded cursor-pointer hover:bg-navy-600 transition-colors"
                        onClick={() => { setEditingInterval(o.id); setEditVal(String(o.change_interval)) }}>
                        {o.change_interval.toLocaleString()} mi <span className="text-slate-600 text-xs">&#9998;</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{o.last_changed.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{o.next_change.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-navy-600 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s === 'critical' ? 'bg-red-500' : s === 'warning' ? 'bg-orange-500' : s === 'ok' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, Number(pct))}%` }} />
                      </div>
                      <span className={`font-mono text-xs ${s === 'critical' ? 'text-red-400' : s === 'warning' ? 'text-orange-400' : 'text-slate-400'}`}>
                        {o.remaining.toLocaleString()} mi
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.sent_for_change ? <StatusBadge status="sent" label="Sent" /> : <StatusBadge status={s} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openModal('mileage', { unitId: o.unit_id })}
                        className="p-1.5 rounded hover:bg-navy-600 text-slate-400 hover:text-white transition-colors" title="Update Mileage">
                        <TrendingDown size={14} />
                      </button>
                      {!o.sent_for_change && (s === 'critical' || s === 'warning') && (
                        <button onClick={() => sendForChange(o.id)}
                          className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors" title="Send for Change">
                          <Send size={14} />
                        </button>
                      )}
                      {o.sent_for_change && (
                        <button onClick={() => openModal('oil-done', { oilId: o.id })}
                          className="p-1.5 rounded hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors" title="Mark Done">
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

function ThresholdSettings({ thresholds, onChange, onClose }: {
  thresholds: { critical: number; warning: number; soon: number }
  onChange: (t: { critical: number; warning: number; soon: number }) => void
  onClose: () => void
}) {
  const [c, setC] = useState(thresholds.critical)
  const [w, setW] = useState(thresholds.warning)
  const [s, setS] = useState(thresholds.soon)

  const inputCls = 'w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent font-mono'

  return (
    <div className="bg-navy-800 rounded-xl border border-accent/30 p-5 space-y-4">
      <h4 className="text-sm font-semibold text-white">Oil Status Thresholds (miles remaining)</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Critical (below)
          </label>
          <input type="number" value={c} onChange={e => setC(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Warning (below)
          </label>
          <input type="number" value={w} onChange={e => setW(Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Soon (below)
          </label>
          <input type="number" value={s} onChange={e => setS(Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <p className="text-xs text-slate-500">Above "{s.toLocaleString()} mi" = <span className="text-emerald-400">Good</span></p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-navy-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-navy-500 transition-colors">Cancel</button>
        <button onClick={() => {
          if (c >= w || w >= s) return
          onChange({ critical: c, warning: w, soon: s })
          onClose()
        }} className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors">
          Apply
        </button>
      </div>
    </div>
  )
}
