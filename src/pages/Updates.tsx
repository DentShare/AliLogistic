import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Moon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, AlertTriangle, Package, LayoutGrid, List, History, Minimize } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { OP_STATUS_CONFIG, type UnitOperationalStatus } from '../data/mock'

// Location-based columns
const COLUMN_ORDER: UnitOperationalStatus[] = ['rolling', 'at_shipper', 'at_receiver', 'sleeping', 'no_load']
// Statuses that map to Rolling column but show as card-level badge
const ROAD_STATUSES: UnitOperationalStatus[] = ['issue', 'getting_late', 'on_time']

const STATUS_ICONS: Record<UnitOperationalStatus, typeof Truck> = {
  rolling: Truck, sleeping: Moon, at_shipper: ArrowDownToLine, at_receiver: ArrowUpFromLine,
  getting_late: Clock, on_time: CheckCircle, issue: AlertTriangle, no_load: Package,
}

// Card-level status config for issue/late/on_time badges
const CARD_STATUS: Record<string, { label: string; color: string; icon: typeof AlertTriangle; pulse?: boolean }> = {
  issue:        { label: 'ISSUE',        color: '#ef4444', icon: AlertTriangle, pulse: true },
  getting_late: { label: 'GETTING LATE', color: '#f97316', icon: Clock, pulse: true },
  on_time:      { label: 'ON TIME',      color: '#4ade80', icon: CheckCircle },
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

function getColumnForStatus(status: UnitOperationalStatus): UnitOperationalStatus {
  if (ROAD_STATUSES.includes(status)) return 'rolling'
  return status
}

export default function Updates() {
  const { units, unitStatuses, drivers, searchQuery, openModal, currentUser, fullscreen, toggleFullscreen } = useApp()
  const [view, setView] = useState<'board' | 'table'>('board')

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

  // Count all 8 statuses for KPIs
  const allStatuses: UnitOperationalStatus[] = ['rolling', 'on_time', 'getting_late', 'issue', 'at_shipper', 'at_receiver', 'sleeping', 'no_load']
  const counts = allStatuses.reduce((acc, s) => {
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
        <KpiCard title="Rolling" value={counts.rolling + counts.on_time + counts.getting_late + counts.issue} icon={Truck} color="text-emerald-400" />
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
          <button onClick={() => setView('board')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'board' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
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

      {/* Board View — 5 location columns */}
      {view === 'board' && (
        <div className="flex gap-3 overflow-x-auto pb-2 items-start flex-1 min-h-0">
          {COLUMN_ORDER.map(colStatus => {
            const colCfg = OP_STATUS_CONFIG[colStatus]
            const ColIcon = STATUS_ICONS[colStatus]
            const items = enriched.filter(e => getColumnForStatus(e.opStatus) === colStatus)
            // Sort: issue first, then getting_late, then on_time, then base status
            items.sort((a, b) => {
              const order: Record<string, number> = { issue: 0, getting_late: 1, on_time: 2 }
              return (order[a.opStatus] ?? 3) - (order[b.opStatus] ?? 3)
            })
            return (
              <div key={colStatus} className="rounded-xl border min-w-[240px] flex flex-col max-h-full shrink-0 flex-1"
                style={{ backgroundColor: `${colCfg.color}08`, borderColor: `${colCfg.color}20` }}>
                <div className="px-3 py-2 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${colCfg.color}20` }}>
                  <div className="flex items-center gap-1.5">
                    <ColIcon size={15} className={colCfg.textColor} />
                    <span className="text-xs font-semibold text-slate-300">{colCfg.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colCfg.bgColor} ${colCfg.textColor}`}>{items.length}</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-0">
                  {items.map(({ unit, status: st, driverName, opStatus }) => {
                    const cardBadge = CARD_STATUS[opStatus]
                    // Card color: if has special status (issue/late/on_time) use that color, otherwise use column color
                    const cardColor = cardBadge ? cardBadge.color : colCfg.color
                    const CardBadgeIcon = cardBadge?.icon
                    return (
                      <div key={unit.id}
                        className={`rounded-lg border border-l-3 transition-all hover:scale-[1.01] ${cardBadge?.pulse ? 'animate-pulse-slow' : ''}`}
                        style={{
                          borderLeftColor: cardColor,
                          borderColor: `${cardColor}35`,
                          backgroundColor: `${cardColor}12`,
                          boxShadow: cardBadge?.pulse ? `0 0 16px ${cardColor}35, inset 0 0 10px ${cardColor}08` : `0 0 6px ${cardColor}15`,
                        }}>
                        {/* Card-level status badge (Issue / Getting Late / On Time) */}
                        {cardBadge && (
                          <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-0.5">
                            {CardBadgeIcon && <CardBadgeIcon size={16} style={{ color: cardColor }} />}
                            <span className="text-xs font-bold" style={{ color: cardColor }}>{cardBadge.label}</span>
                            {cardBadge.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto" style={{ backgroundColor: cardColor }} />}
                          </div>
                        )}
                        {/* Unit info */}
                        <div className={`px-2.5 ${cardBadge ? 'pt-0.5' : 'pt-2'} pb-2`}>
                          <div className="flex items-center gap-1.5">
                            <Link to={`/units/${unit.id}`} className="text-xs font-bold text-white hover:text-accent transition-colors">{unit.unit_number}</Link>
                            <span className="text-[10px] text-slate-400">{driverName}</span>
                          </div>
                          {st?.load_number && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{st.load_number}</div>}
                          {(st?.origin || st?.destination) && (
                            <div className="text-[10px] text-slate-500 truncate">{st?.origin} → {st?.destination}</div>
                          )}
                          {st?.eta && (
                            <div className="text-[10px] text-slate-500">ETA: {new Date(st.eta).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                          {st?.note && <div className="text-[10px] text-slate-600 italic line-clamp-1">{st.note}</div>}
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] text-slate-600">{timeAgo(st?.updated_at || '')}</span>
                            {!isViewer && (
                              <button onClick={() => openModal('update-status', { unitId: unit.id })}
                                className="text-[10px] font-medium text-accent hover:text-accent-hover transition-colors">
                                Update
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                {['Unit', 'Driver', 'Location', 'Status', 'Load #', 'Route', 'ETA', 'Note', 'Updated', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.sort((a, b) => {
                const order: Record<string, number> = { issue: 0, getting_late: 1, on_time: 2, rolling: 3, at_shipper: 4, at_receiver: 5, sleeping: 6, no_load: 7 }
                return (order[a.opStatus] ?? 8) - (order[b.opStatus] ?? 8)
              }).map(({ unit, status: st, driverName, opStatus }) => {
                const colStatus = getColumnForStatus(opStatus)
                const colCfg = OP_STATUS_CONFIG[colStatus]
                const cardBadge = CARD_STATUS[opStatus]
                return (
                  <tr key={unit.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="px-4 py-3">
                      <Link to={`/units/${unit.id}`} className="font-bold text-white hover:text-accent transition-colors">{unit.unit_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{driverName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={colStatus} label={colCfg.label} />
                    </td>
                    <td className="px-4 py-3">
                      {cardBadge ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border" style={{ color: cardBadge.color, borderColor: `${cardBadge.color}40`, backgroundColor: `${cardBadge.color}15` }}>
                          {cardBadge.label}
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
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
