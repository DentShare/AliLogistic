import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Moon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, AlertTriangle, Package, LayoutGrid, List, History, Minimize } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { OP_STATUS_CONFIG, type UnitOperationalStatus } from '../data/mock'

const STATUS_ORDER: UnitOperationalStatus[] = ['rolling', 'on_time', 'getting_late', 'issue', 'at_shipper', 'at_receiver', 'sleeping', 'no_load']

const STATUS_ICONS: Record<UnitOperationalStatus, typeof Truck> = {
  rolling: Truck, sleeping: Moon, at_shipper: ArrowDownToLine, at_receiver: ArrowUpFromLine,
  getting_late: Clock, on_time: CheckCircle, issue: AlertTriangle, no_load: Package,
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Updates() {
  const { units, unitStatuses, drivers, searchQuery, openModal, currentUser, fullscreen, toggleFullscreen } = useApp()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')

  const isViewer = currentUser?.role === 'viewer'

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFullscreen() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFullscreen])

  const enriched = units.map(u => {
    const st = unitStatuses.find(s => s.unit_id === u.id)
    const driver = drivers.find(d => d.unit_id === u.id)
    return { unit: u, status: st, driverName: driver?.name || u.driver, opStatus: (st?.status || 'no_load') as UnitOperationalStatus }
  }).filter(e =>
    !searchQuery || e.unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.status?.load_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = enriched.filter(e => e.opStatus === s).length
    return acc
  }, {} as Record<UnitOperationalStatus, number>)

  return (
    <div className={`flex flex-col ${fullscreen ? 'h-screen p-4 gap-4' : 'h-[calc(100vh-56px-48px)] gap-6'}`}>
      {fullscreen && (
        <button onClick={toggleFullscreen} className="fixed top-4 right-4 z-50 p-2 bg-navy-800/80 border border-navy-700 rounded-lg text-slate-400 hover:text-white backdrop-blur-sm transition-colors" title="Exit fullscreen (Esc)">
          <Minimize size={16} />
        </button>
      )}
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 shrink-0">
        <KpiCard title="Rolling" value={counts.rolling} icon={Truck} color="text-emerald-400" />
        <KpiCard title="On Time" value={counts.on_time} icon={CheckCircle} color="text-green-400" />
        <KpiCard title="Getting Late" value={counts.getting_late} icon={Clock} color="text-orange-400" />
        <KpiCard title="Issues" value={counts.issue} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="At Shipper" value={counts.at_shipper} icon={ArrowDownToLine} color="text-purple-400" />
        <KpiCard title="At Receiver" value={counts.at_receiver} icon={ArrowUpFromLine} color="text-indigo-400" />
        <KpiCard title="Sleeping" value={counts.sleeping} icon={Moon} color="text-blue-400" />
        <KpiCard title="No Load" value={counts.no_load} icon={Package} color="text-slate-400" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex gap-1 bg-navy-800 rounded-lg p-1 border border-navy-700">
          <button onClick={() => setView('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
            <LayoutGrid size={14} /> Board
          </button>
          <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'table' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
            <List size={14} /> Table
          </button>
        </div>
        <Link to="/updates/log" className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 border border-navy-700 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors">
          <History size={14} /> Status Log
        </Link>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-2 items-start flex-1 min-h-0">
          {STATUS_ORDER.map(status => {
            const cfg = OP_STATUS_CONFIG[status]
            const Icon = STATUS_ICONS[status]
            const items = enriched.filter(e => e.opStatus === status)
            return (
              <div key={status} className="rounded-xl border min-w-[220px] flex flex-col max-h-full shrink-0"
                style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}20` }}>
                <div className="px-2.5 py-2 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${cfg.color}20` }}>
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className={cfg.textColor} />
                    <span className="text-xs font-semibold text-slate-300">{cfg.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>{items.length}</span>
                </div>
                <div className="p-2 space-y-1.5 overflow-y-auto flex-1 min-h-0">
                  {items.map(({ unit, status: st, driverName }) => (
                    <div key={unit.id} className={`rounded-lg px-2.5 py-2 border border-l-2 transition-all hover:scale-[1.02] ${cfg.pulse ? 'animate-pulse-slow' : ''}`} style={{ borderLeftColor: cfg.color, borderColor: `${cfg.color}35`, backgroundColor: `${cfg.color}12`, boxShadow: cfg.pulse ? `0 0 18px ${cfg.color}35, inset 0 0 12px ${cfg.color}0A` : `0 0 8px ${cfg.color}18` }}>
                      <div className="flex items-center justify-between">
                        <Link to={`/units/${unit.id}`} className="text-xs font-bold text-white hover:text-accent transition-colors">{unit.unit_number}</Link>
                        {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: cfg.color }} />}
                      </div>
                      <div className="text-[10px] text-slate-500">{driverName}{st?.load_number ? ` · ${st.load_number}` : ''}</div>
                      {(st?.origin || st?.destination) && (
                        <div className="text-[10px] text-slate-500 truncate">{st?.origin} → {st?.destination}</div>
                      )}
                      {st?.eta && (
                        <div className="text-[10px] text-slate-600">ETA: {new Date(st.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                      {st?.note && <div className="text-[10px] text-slate-600 italic line-clamp-1">{st.note}</div>}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-slate-600">{timeAgo(st?.updated_at || '')}</span>
                        {!isViewer && (
                          <button onClick={() => openModal('update-status', { unitId: unit.id })}
                            className="text-[9px] font-medium text-accent hover:text-accent-hover transition-colors">
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-xs text-slate-600 text-center py-4">No units</div>}
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
                {['Unit', 'Driver', 'Status', 'Load #', 'Route', 'ETA', 'Note', 'Updated', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.sort((a, b) => STATUS_ORDER.indexOf(a.opStatus) - STATUS_ORDER.indexOf(b.opStatus)).map(({ unit, status: st, driverName, opStatus }) => {
                const cfg = OP_STATUS_CONFIG[opStatus]
                return (
                  <tr key={unit.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3">
                      <Link to={`/units/${unit.id}`} className="font-bold text-white hover:text-accent transition-colors">{unit.unit_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{driverName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={opStatus} label={cfg.label} pulse={cfg.pulse} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{st?.load_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                      {st?.origin && st?.destination ? `${st.origin} → ${st.destination}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {st?.eta ? new Date(st.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{st?.note || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{timeAgo(st?.updated_at || '')}</td>
                    <td className="px-4 py-3">
                      {!isViewer && (
                        <button onClick={() => openModal('update-status', { unitId: unit.id })}
                          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors">
                          Update
                        </button>
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
