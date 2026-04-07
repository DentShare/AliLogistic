import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Moon, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Clock, CheckCircle, Package, LayoutGrid, List, History, Minimize, Search, X } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { OP_STATUS_CONFIG, CONDITION_CONFIG, type UnitOperationalStatus, type UnitCondition } from '../data/mock'

const COLUMN_ORDER: UnitOperationalStatus[] = ['rolling', 'at_shipper', 'at_receiver', 'sleeping', 'no_load']

const STATUS_ICONS: Record<UnitOperationalStatus, typeof Truck> = {
  rolling: Truck, sleeping: Moon, at_shipper: ArrowDownToLine, at_receiver: ArrowUpFromLine, no_load: Package,
}

const COND_ICONS: Record<string, typeof AlertTriangle> = {
  issue: AlertTriangle, getting_late: Clock, on_time: CheckCircle,
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function sleepTimer(lastActivityAt: string): string {
  if (!lastActivityAt) return ''
  const diff = Date.now() - new Date(lastActivityAt).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return `${hours}h ${mins}m awake`
}

function smartSearch(query: string, data: { unitNumber: string; driver: string; load: string; origin: string; dest: string; note: string; condNote: string; status: string; condition: string }) {
  if (!query) return true
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = `${data.unitNumber} ${data.driver} ${data.load} ${data.origin} ${data.dest} ${data.note} ${data.condNote} ${data.status} ${data.condition}`.toLowerCase()
  return words.every(w => haystack.includes(w))
}

export default function Updates() {
  const { units, unitStatuses, unitStatusLog, drivers, searchQuery, openModal, currentUser, fullscreen, toggleFullscreen, setUnitCondition } = useApp()
  const [view, setView] = useState<'board' | 'table'>('board')
  const [filterStatus, setFilterStatus] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [conditionInput, setConditionInput] = useState<UnitCondition>(null)
  const [conditionNote, setConditionNote] = useState('')

  const isViewer = currentUser?.role === 'viewer'

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (selectedUnitId) setSelectedUnitId(null); else toggleFullscreen() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFullscreen, selectedUnitId])

  const enriched = units.map(u => {
    const st = unitStatuses.find(s => s.unit_id === u.id)
    const driver = drivers.find(d => d.unit_id === u.id)
    return { unit: u, status: st, driverName: driver?.name || u.driver, opStatus: (st?.status || 'no_load') as UnitOperationalStatus }
  }).filter(e => {
    const sq = searchQuery || localSearch
    if (!smartSearch(sq, {
      unitNumber: e.unit.unit_number, driver: e.driverName,
      load: e.status?.load_number || '', origin: e.status?.origin || '', dest: e.status?.destination || '',
      note: e.status?.note || '', condNote: e.status?.condition_note || '',
      status: OP_STATUS_CONFIG[e.opStatus]?.label || '', condition: e.status?.condition ? (CONDITION_CONFIG[e.status.condition]?.label || '') : '',
    })) return false
    if (filterStatus && e.opStatus !== filterStatus && e.status?.condition !== filterStatus) return false
    return true
  })

  const selectedUnit = selectedUnitId ? enriched.find(e => e.unit.id === selectedUnitId) : null
  const selectedHistory = selectedUnitId ? unitStatusLog.filter(l => l.unit_id === selectedUnitId).slice(0, 10) : []

  const handleSetCondition = () => {
    if (!selectedUnitId) return
    setUnitCondition(selectedUnitId, conditionInput, conditionNote)
    setConditionInput(null)
    setConditionNote('')
  }

  const allFilterOptions = [...COLUMN_ORDER, 'issue', 'getting_late', 'on_time'] as string[]

  return (
    <div className={`flex ${fullscreen ? 'h-screen p-2' : 'h-[calc(100vh-56px-48px)]'}`}>
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {fullscreen && (
          <button onClick={toggleFullscreen} className="fixed top-3 right-3 z-50 p-2 bg-navy-800/80 border border-navy-700 rounded-lg text-slate-400 hover:text-white backdrop-blur-sm transition-colors" title="Exit fullscreen (Esc)">
            <Minimize size={16} />
          </button>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex gap-1 bg-navy-800 rounded-lg p-1 border border-navy-700">
            <button onClick={() => setView('board')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${view === 'board' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid size={13} /> Board
            </button>
            <button onClick={() => setView('table')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              <List size={13} /> Table
            </button>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-navy-800 border border-navy-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-accent">
            <option value="">All</option>
            {allFilterOptions.map(s => <option key={s} value={s}>{OP_STATUS_CONFIG[s as UnitOperationalStatus]?.label || CONDITION_CONFIG[s]?.label || s}</option>)}
          </select>
          <div className="flex items-center bg-navy-800 border border-navy-700 rounded-lg px-2 py-1 gap-1">
            <Search size={12} className="text-slate-500" />
            <input value={localSearch} onChange={e => setLocalSearch(e.target.value)} placeholder="Smart search..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-36" />
          </div>
          <Link to="/updates/log" className="flex items-center gap-1 px-2.5 py-1 bg-navy-800 border border-navy-700 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors ml-auto">
            <History size={13} /> Log
          </Link>
        </div>

        {/* Board View */}
        {view === 'board' && (
          <div className="flex gap-2 items-start flex-1 min-h-0">
            {COLUMN_ORDER.map(colStatus => {
              const colCfg = OP_STATUS_CONFIG[colStatus]
              const ColIcon = STATUS_ICONS[colStatus]
              const items = enriched.filter(e => e.opStatus === colStatus)
              items.sort((a, b) => {
                const order: Record<string, number> = { issue: 0, getting_late: 1, on_time: 2 }
                return (order[a.status?.condition || ''] ?? 3) - (order[b.status?.condition || ''] ?? 3)
              })
              return (
                <div key={colStatus} className="rounded-xl border flex flex-col max-h-full flex-1 min-w-0"
                  style={{ backgroundColor: `${colCfg.color}08`, borderColor: `${colCfg.color}20` }}>
                  <div className="px-2 py-1 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colCfg.color}20` }}>
                    <div className="flex items-center gap-1">
                      <ColIcon size={12} className={colCfg.textColor} />
                      <span className="text-[11px] font-semibold text-slate-300">{colCfg.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${colCfg.bgColor} ${colCfg.textColor}`}>{items.length}</span>
                  </div>
                  <div className={`p-1 flex-1 min-h-0 overflow-y-auto ${items.length > 40 ? 'grid grid-cols-2 gap-0.5 auto-rows-min content-start' : 'space-y-0.5'}`}>
                    {items.map(({ unit, status: st, driverName }) => {
                      const cond = st?.condition
                      const condCfg = cond ? CONDITION_CONFIG[cond] : null
                      const CondIcon = cond ? COND_ICONS[cond] : null
                      const cardColor = condCfg ? condCfg.color : colCfg.color
                      const isSelected = selectedUnitId === unit.id
                      const isSleeping = colStatus === 'sleeping'
                      return (
                        <div key={unit.id}
                          onClick={() => { setSelectedUnitId(unit.id); setConditionInput(st?.condition || null); setConditionNote(st?.condition_note || '') }}
                          className={`rounded px-1.5 py-0.5 border-l-2 cursor-pointer transition-all text-[11px] flex items-center gap-1 justify-between ${condCfg?.pulse ? 'animate-pulse-slow' : ''} ${isSelected ? 'ring-1 ring-accent' : ''}`}
                          style={{
                            borderLeftColor: cardColor,
                            backgroundColor: `${cardColor}10`,
                            boxShadow: condCfg?.pulse ? `0 0 10px ${cardColor}25` : undefined,
                          }}>
                          <div className="flex items-center gap-1 min-w-0">
                            {condCfg && CondIcon && <CondIcon size={10} style={{ color: cardColor }} />}
                            {condCfg && <span className="text-[9px] font-bold shrink-0" style={{ color: cardColor }}>{condCfg.label}</span>}
                            <span className="font-bold text-white shrink-0">{unit.unit_number}</span>
                            <span className="text-slate-400 truncate">{driverName}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isSleeping && st?.last_activity_at && <span className="text-[8px] text-blue-400">{sleepTimer(st.last_activity_at)}</span>}
                            {!isSleeping && <span className="text-[8px] text-slate-600">{timeAgo(st?.updated_at || '')}</span>}
                            {condCfg?.pulse && <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: cardColor }} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Table View */}
        {view === 'table' && (
          <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-auto flex-1 min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-navy-800 z-10">
                <tr className="border-b border-navy-700">
                  {['Unit', 'Driver', 'Location', 'Condition', 'Load', 'Route', 'Updated', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map(({ unit, status: st, driverName, opStatus }) => {
                  const colCfg = OP_STATUS_CONFIG[opStatus]
                  const condCfg = st?.condition ? CONDITION_CONFIG[st.condition] : null
                  return (
                    <tr key={unit.id} className="border-b border-navy-700/50 hover:bg-navy-700/30 cursor-pointer" onClick={() => { setSelectedUnitId(unit.id); setConditionInput(st?.condition || null); setConditionNote(st?.condition_note || '') }}>
                      <td className="px-3 py-2 font-bold text-white">{unit.unit_number}</td>
                      <td className="px-3 py-2 text-slate-400">{driverName}</td>
                      <td className="px-3 py-2"><StatusBadge status={opStatus} label={colCfg?.label} /></td>
                      <td className="px-3 py-2">
                        {condCfg ? <span className="text-xs font-bold" style={{ color: condCfg.color }}>{condCfg.label}</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-400 text-xs">{st?.load_number || '—'}</td>
                      <td className="px-3 py-2 text-slate-400 text-xs truncate max-w-[180px]">{st?.origin && st?.destination ? `${st.origin} → ${st.destination}` : '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{timeAgo(st?.updated_at || '')}</td>
                      <td className="px-3 py-2">
                        {!isViewer && <button onClick={e => { e.stopPropagation(); openModal('update-status', { unitId: unit.id }) }} className="text-xs text-accent hover:text-accent-hover">Status</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Detail Panel */}
      {selectedUnit && (
        <div className="w-[340px] shrink-0 bg-navy-800 border-l border-navy-700 flex flex-col overflow-y-auto ml-2 rounded-xl">
          <div className="p-4 border-b border-navy-700 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">{selectedUnit.unit.unit_number}</div>
              <div className="text-sm text-slate-400">{selectedUnit.driverName}</div>
            </div>
            <button onClick={() => setSelectedUnitId(null)} className="p-1 rounded hover:bg-navy-700 text-slate-400"><X size={18} /></button>
          </div>

          {/* Current Status & Condition */}
          <div className="p-4 space-y-3 border-b border-navy-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Location</span>
              <StatusBadge status={selectedUnit.opStatus} label={OP_STATUS_CONFIG[selectedUnit.opStatus]?.label} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Condition</span>
              {selectedUnit.status?.condition ? (
                <span className="text-xs font-bold" style={{ color: CONDITION_CONFIG[selectedUnit.status.condition]?.color }}>{CONDITION_CONFIG[selectedUnit.status.condition]?.label}</span>
              ) : <span className="text-xs text-slate-600">None</span>}
            </div>
            {selectedUnit.status?.condition_note && (
              <div className="text-xs text-slate-400 italic bg-navy-700 rounded p-2">{selectedUnit.status.condition_note}</div>
            )}
            {selectedUnit.opStatus === 'sleeping' && selectedUnit.status?.last_activity_at && (
              <div className="text-xs text-blue-400 font-mono">{sleepTimer(selectedUnit.status.last_activity_at)}</div>
            )}
          </div>

          {/* Load & Route */}
          <div className="p-4 space-y-2 border-b border-navy-700">
            {selectedUnit.status?.load_number && <div className="text-xs"><span className="text-slate-500">Load:</span> <span className="text-white font-mono">{selectedUnit.status.load_number}</span></div>}
            {selectedUnit.status?.origin && <div className="text-xs"><span className="text-slate-500">Route:</span> <span className="text-white">{selectedUnit.status.origin} → {selectedUnit.status.destination}</span></div>}
            {selectedUnit.status?.eta && <div className="text-xs"><span className="text-slate-500">ETA:</span> <span className="text-white">{new Date(selectedUnit.status.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
            {selectedUnit.status?.note && <div className="text-xs"><span className="text-slate-500">Note:</span> <span className="text-slate-300 italic">{selectedUnit.status.note}</span></div>}
            <div className="text-[10px] text-slate-600">Updated {timeAgo(selectedUnit.status?.updated_at || '')} by {selectedUnit.status?.updated_by}</div>
          </div>

          {/* Set Condition */}
          {!isViewer && (
            <div className="p-4 space-y-2 border-b border-navy-700">
              <span className="text-xs font-semibold text-slate-300">Set Condition</span>
              <div className="flex gap-1">
                {(['issue', 'getting_late', 'on_time', null] as UnitCondition[]).map(c => {
                  const cfg = c ? CONDITION_CONFIG[c] : null
                  const isActive = conditionInput === c
                  return (
                    <button key={c || 'clear'} onClick={() => setConditionInput(c)}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors ${isActive ? 'border-accent' : 'border-navy-600'}`}
                      style={cfg ? { color: cfg.color, backgroundColor: isActive ? `${cfg.color}20` : 'transparent' } : { color: '#64748b' }}>
                      {cfg?.label || 'CLEAR'}
                    </button>
                  )
                })}
              </div>
              <textarea value={conditionNote} onChange={e => setConditionNote(e.target.value)} placeholder="Comment..."
                className="w-full bg-navy-700 border border-navy-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent h-12 resize-none placeholder-slate-500" />
              <button onClick={handleSetCondition} className="w-full py-1.5 bg-accent text-white text-xs font-semibold rounded hover:bg-accent-hover transition-colors">Apply Condition</button>
            </div>
          )}

          {/* Change Status */}
          {!isViewer && (
            <div className="p-4 border-b border-navy-700">
              <button onClick={() => openModal('update-status', { unitId: selectedUnit.unit.id })} className="w-full py-1.5 bg-navy-700 text-slate-300 text-xs font-semibold rounded hover:bg-navy-600 transition-colors">
                Change Location Status
              </button>
            </div>
          )}

          {/* Recent History */}
          <div className="p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Recent Changes</span>
            {selectedHistory.map(e => (
              <div key={e.id} className="text-[10px] text-slate-500 border-l-2 border-navy-600 pl-2">
                <span className="text-slate-400">{new Date(e.changed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {' '}{e.previous_status || '—'} → {e.new_status}
                {e.note && <span className="italic"> — {e.note}</span>}
                <div className="text-slate-600">by {e.changed_by}</div>
              </div>
            ))}
            {selectedHistory.length === 0 && <div className="text-[10px] text-slate-600">No history</div>}
          </div>
        </div>
      )}
    </div>
  )
}
