import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Droplets, ShieldCheck, AlertTriangle, Wrench, Minimize, Navigation, Radio } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

export default function Dashboard() {
  const { units, oilRecords, inspections, defects, repairs, unitStatuses, searchQuery, oilThresholds, fullscreen, toggleFullscreen } = useApp()
  const [lastChange, setLastChange] = useState<string>('')
  const [flash, setFlash] = useState(false)
  const prevSnapshot = useRef('')

  // Track per-unit changes for flip animation
  const [changedUnits, setChangedUnits] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Build per-unit snapshot — track ALL fields that affect Dashboard
    const snapshot: Record<string, string> = {}
    units.forEach(u => {
      const st = unitStatuses.find(s => s.unit_id === u.id)
      const oils = oilRecords.filter(o => o.unit_id === u.id).map(o => `${o.remaining}:${o.sent_for_change}`).join(',')
      const defs = defects.filter(d => d.unit_id === u.id).map(d => `${d.status}:${d.severity}`).join(',')
      const reps = repairs.filter(r => r.unit_id === u.id).map(r => r.status).join(',')
      const insps = inspections.filter(i => i.unit_id === u.id).map(i => `${i.days_remaining}`).join(',')
      snapshot[u.id] = `${u.mileage}|${u.status}|${st?.status}|${st?.condition}|${oils}|${defs}|${reps}|${insps}`
    })
    const snapStr = JSON.stringify(snapshot)

    if (prevSnapshot.current && prevSnapshot.current !== snapStr) {
      const prev = JSON.parse(prevSnapshot.current) as Record<string, string>
      const changed = new Set<string>()
      for (const id of Object.keys(snapshot)) {
        if (prev[id] !== snapshot[id]) changed.add(id)
      }
      if (changed.size > 0) {
        setChangedUnits(changed)
        setTimeout(() => setChangedUnits(new Set()), 2500)
      }
      setLastChange(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setFlash(true)
      setTimeout(() => setFlash(false), 2000)
    }
    prevSnapshot.current = snapStr
  }, [unitStatuses, units, oilRecords, defects, repairs, inspections])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFullscreen() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFullscreen])

  // Search helper
  const sq = searchQuery.toLowerCase()
  const matchesSearch = (unitId: string) => {
    if (!searchQuery) return true
    const u = units.find(x => x.id === unitId)
    return u ? (u.unit_number.toLowerCase().includes(sq) || u.driver.toLowerCase().includes(sq)) : false
  }

  const activeUnits = units.filter(u => u.status === 'active').length
  const rollingUnits = unitStatuses.filter(s => s.status === 'rolling' && matchesSearch(s.unit_id))
  const oilUrgent = oilRecords.filter(o => {
    const st = oilStatus(o.remaining, o.change_interval, oilThresholds)
    return (st === 'critical' || st === 'warning') && !o.sent_for_change && matchesSearch(o.unit_id)
  }).sort((a, b) => a.remaining - b.remaining)
  const sentForChange = oilRecords.filter(o => o.sent_for_change && matchesSearch(o.unit_id))
  const inspDue = inspections.filter(i => i.days_remaining <= 30 && matchesSearch(i.unit_id)).sort((a, b) => a.days_remaining - b.days_remaining)
  const activeDefects = defects.filter(d => d.status === 'active' && matchesSearch(d.unit_id)).sort((a, b) => {
    const sev = { critical: 0, moderate: 1, low: 2 }
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2)
  })
  const inRepair = repairs.filter(r => (r.status === 'in_repair' || r.status === 'sent') && matchesSearch(r.unit_id))
  const needsRepair = repairs.filter(r => r.status === 'needs_repair' && matchesSearch(r.unit_id))
  const issueUnitIds = new Set([
    ...oilUrgent.map(o => o.unit_id),
    ...inspDue.map(i => i.unit_id),
    ...activeDefects.map(d => d.unit_id),
    ...inRepair.map(r => r.unit_id),
    ...needsRepair.map(r => r.unit_id),
  ])
  const filteredUnits = searchQuery
    ? units.filter(u => u.unit_number.toLowerCase().includes(sq) || u.driver.toLowerCase().includes(sq))
    : units
  const clearUnits = filteredUnits.filter(u => u.status === 'active' && !issueUnitIds.has(u.id))

  const getUnit = (id: string) => units.find(u => u.id === id)

  // Fullscreen uses variant 4 (hide empty columns, no KPI)
  const variant = fullscreen ? 4 : 0
  const v4HideEmpty = fullscreen

  // Column data for filtering empty ones in V4
  type ColData = {
    key: string
    title: string
    color: string
    count: number
    children: React.ReactNode
  }

  const columns: ColData[] = [
    {
      key: 'rolling',
      title: 'Rolling',
      color: 'bg-emerald-500/20 text-emerald-400',
      count: rollingUnits.length,
      children: rollingUnits.map(s => { const u = getUnit(s.unit_id); return u ? (
        <TruckCard key={s.id} unit={u} severity="good" extra={undefined} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'oil',
      title: 'Oil Change Needed',
      color: 'bg-red-500/20 text-red-400',
      count: oilUrgent.length,
      children: oilUrgent.map(o => { const u = getUnit(o.unit_id); const st = oilStatus(o.remaining, o.change_interval, oilThresholds); return u ? (
        <TruckCard key={o.id} unit={u} severity={st === 'critical' ? 'critical' : 'warning'} extra={`${o.remaining.toLocaleString()} mi`} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'sent',
      title: 'Sent for Change',
      color: 'bg-blue-500/20 text-blue-400',
      count: sentForChange.length,
      children: sentForChange.map(o => { const u = getUnit(o.unit_id); return u ? (
        <TruckCard key={o.id} unit={u} severity="sent" extra="Sent" variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'insp',
      title: 'Inspection Due',
      color: 'bg-yellow-500/20 text-yellow-400',
      count: inspDue.length,
      children: inspDue.map(i => { const u = getUnit(i.unit_id); return u ? (
        <TruckCard key={i.id} unit={u} severity={i.days_remaining < 0 ? 'expired' : i.days_remaining <= 7 ? 'critical' : 'warning'} extra={i.days_remaining < 0 ? `${Math.abs(i.days_remaining)}d exp` : `${i.days_remaining}d left`} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'defects',
      title: 'Active Defects',
      color: 'bg-red-500/20 text-red-400',
      count: activeDefects.length,
      children: activeDefects.map(d => { const u = getUnit(d.unit_id); return u ? (
        <TruckCard key={d.id} unit={u} severity={d.severity} extra={d.severity} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'inRepair',
      title: 'In Repair',
      color: 'bg-orange-500/20 text-orange-400',
      count: inRepair.length,
      children: inRepair.map(r => { const u = getUnit(r.unit_id); return u ? (
        <TruckCard key={r.id} unit={u} severity={r.status === 'sent' ? 'sent' : 'in_repair'} extra={r.status === 'sent' ? 'Sent' : 'In Repair'} shopType={r.shop_type} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'needsRepair',
      title: 'Needs Repair',
      color: 'bg-red-500/20 text-red-400',
      count: needsRepair.length,
      children: needsRepair.map(r => { const u = getUnit(r.unit_id); return u ? (
        <TruckCard key={r.id} unit={u} severity="needs_repair" extra="Needs Repair" shopType={r.shop_type} variant={variant} changedUnits={changedUnits} />
      ) : null }),
    },
    {
      key: 'clear',
      title: 'All Clear',
      color: 'bg-emerald-500/20 text-emerald-400',
      count: clearUnits.length,
      children: clearUnits.map(u => (
        <TruckCard key={u.id} unit={u} severity="good" extra="All Clear" variant={variant} changedUnits={changedUnits} />
      )),
    },
  ]

  const visibleColumns = v4HideEmpty ? columns.filter(c => c.count > 0) : columns

  return (
    <div className={`flex flex-col ${fullscreen ? 'h-screen p-2 gap-1' : 'h-[calc(100vh-56px-48px)] gap-6'}`}>
      {fullscreen && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800/80 border border-navy-700 rounded-lg backdrop-blur-sm transition-all ${flash ? 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <Radio size={12} className="text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400">LIVE</span>
            {lastChange && <span className="text-[9px] text-slate-500 ml-1">{lastChange}</span>}
          </div>
          <button onClick={toggleFullscreen} className="p-2 bg-navy-800/80 border border-navy-700 rounded-lg text-slate-400 hover:text-white backdrop-blur-sm transition-colors" title="Exit fullscreen (Esc)">
            <Minimize size={16} />
          </button>
        </div>
      )}

      {/* KPI Row — hidden in fullscreen */}
      {!fullscreen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 shrink-0">
          <KpiCard title="Fleet Size" value={activeUnits} icon={Truck} color="text-accent" />
          <KpiCard title="Rolling" value={rollingUnits.length} icon={Navigation} color="text-emerald-400" />
          <KpiCard title="Oil Urgent" value={oilUrgent.length} icon={Droplets} color="text-orange-400" />
          <KpiCard title="Inspection Due" value={inspDue.length} icon={ShieldCheck} color="text-yellow-400" />
          <KpiCard title="Active Defects" value={activeDefects.length} icon={AlertTriangle} color="text-red-400" />
          <KpiCard title="In Repair" value={inRepair.length} icon={Wrench} color="text-orange-400" />
          <KpiCard title="Needs Repair" value={needsRepair.length} icon={AlertTriangle} color="text-red-400" />
          {/* LIVE indicator */}
          <div className={`bg-navy-800 rounded-xl border border-navy-700 p-4 flex flex-col items-center justify-center transition-all ${flash ? 'border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : ''}`}>
            <div className="flex items-center gap-1.5">
              <Radio size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400">LIVE</span>
            </div>
            {lastChange && <div className="text-[9px] text-slate-500 mt-1">{lastChange}</div>}
          </div>
        </div>
      )}
      {/* Fullscreen: count shown in column headers, no KPI needed */}

      <div className={`flex gap-3 pb-2 items-start flex-1 min-h-0 ${fullscreen ? '' : 'overflow-x-auto'}`}>
        {visibleColumns.map(col => (
          <Column
            key={col.key}
            stretch={fullscreen}
            title={col.title}
            color={col.color}
            count={col.count}
            variant={variant}
          >
            {col.children}
          </Column>
        ))}
      </div>
    </div>
  )
}

/* Compact KPI item for Variant 4 */

// Column hex colors for tinted backgrounds
const colHex: Record<string, string> = {
  'Rolling': '#22c55e', 'Oil Change Needed': '#ef4444', 'Sent for Change': '#3b82f6',
  'Inspection Due': '#eab308', 'Active Defects': '#ef4444', 'In Repair': '#f97316',
  'Needs Repair': '#ef4444', 'All Clear': '#10b981',
}

function Column({ title, color, count, children, stretch, variant = 0 }: {
  title: string; color: string; count: number; children: React.ReactNode; stretch?: boolean; variant?: number
}) {
  const hex = colHex[title] || '#3b82f6'

  // Variant 1: chips flow in flex-wrap
  // Variant 2: 2-column CSS grid
  const innerClass =
    variant === 1
      ? 'p-1 flex flex-wrap gap-0.5 overflow-y-auto flex-1 min-h-0'
      : variant === 2
        ? 'p-1 grid grid-cols-2 gap-0.5 overflow-y-auto flex-1 min-h-0'
        : 'p-1.5 space-y-1 overflow-y-auto flex-1 min-h-0'

  return (
    <div className={`rounded-xl border border-navy-700 flex flex-col max-h-full ${stretch ? 'flex-1 min-w-0' : 'min-w-[200px] shrink-0'}`}
      style={{ backgroundColor: `${hex}08`, borderColor: `${hex}20` }}>
      <div className="px-2 py-1 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${hex}20` }}>
        <span className="text-[10px] font-semibold text-slate-300">{title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className={innerClass}>{children}</div>
    </div>
  )
}

// Card severity colors
const severityHex: Record<string, string> = {
  critical: '#ef4444', expired: '#ef4444', warning: '#f97316', needs_repair: '#ef4444',
  sent: '#3b82f6', in_repair: '#f97316', ok: '#eab308', good: '#10b981',
  moderate: '#f97316', low: '#eab308',
}

function TruckCard({ unit, severity = 'ok', extra, shopType, variant = 0, changedUnits }: {
  unit: { id: string; unit_number: string; driver: string; mileage: number }
  severity?: string
  extra?: string
  shopType?: 'local' | 'our'
  variant?: number
  changedUnits?: Set<string>
}) {
  const hex = severityHex[severity] || '#3b82f6'
  const isPulse = severity === 'critical' || severity === 'expired' || severity === 'needs_repair'
  const isChanged = changedUnits?.has(unit.id) || false
  const glowClass = isPulse ? 'animate-critical-glow' : severity === 'warning' || severity === 'moderate' || severity === 'in_repair' ? 'animate-warning-glow' : ''

  // Show old value during first half of flip, new value after
  const prevExtra = useRef(extra)
  const [displayExtra, setDisplayExtra] = useState(extra)

  useEffect(() => {
    if (isChanged && prevExtra.current !== extra) {
      // Keep showing old value during flip
      setDisplayExtra(prevExtra.current)
      // Switch to new value at midpoint of animation
      const timer = setTimeout(() => {
        setDisplayExtra(extra)
        prevExtra.current = extra
      }, 800) // flip midpoint
      return () => clearTimeout(timer)
    } else {
      setDisplayExtra(extra)
      prevExtra.current = extra
    }
  }, [extra, isChanged])

  // Variant 1: tiny colored chip, just unit number
  if (variant === 1) {
    return (
      <Link to={`/units/${unit.id}`}
        className="inline-flex items-center rounded px-1 text-[9px] font-bold leading-[20px] hover:brightness-125 transition-all"
        style={{
          backgroundColor: `${hex}25`,
          color: hex,
          border: `1px solid ${hex}40`,
          height: '20px',
        }}>
        {unit.unit_number}
      </Link>
    )
  }

  // Variant 2: compact side-by-side card, unit+driver+extra in one line
  if (variant === 2) {
    return (
      <Link to={`/units/${unit.id}`}
        className={`block rounded px-1 py-0 border border-l-2 transition-all hover:scale-[1.01] ${isPulse ? 'animate-pulse-slow' : ''}`}
        style={{
          borderLeftColor: hex,
          borderColor: `${hex}35`,
          backgroundColor: `${hex}12`,
        }}>
        <div className="flex items-center gap-0.5 text-[9px] leading-[18px]">
          <span className="font-bold text-white shrink-0">{unit.unit_number}</span>
          <span className="text-slate-500 truncate">{unit.driver.split(' ')[0]}</span>
          {extra && <span className="ml-auto font-mono font-semibold shrink-0" style={{ color: hex }}>{extra}</span>}
        </div>
      </Link>
    )
  }

  // Variant 3: no driver name, minimal height ~16px
  if (variant === 3) {
    return (
      <Link to={`/units/${unit.id}`}
        className={`block rounded px-1 border border-l-2 transition-all hover:scale-[1.01] ${isPulse ? 'animate-pulse-slow' : ''}`}
        style={{
          borderLeftColor: hex,
          borderColor: `${hex}35`,
          backgroundColor: `${hex}12`,
          lineHeight: '16px',
        }}>
        <div className="flex items-center gap-1 justify-between text-[9px]" style={{ height: '16px' }}>
          <span className="font-bold text-white shrink-0">{unit.unit_number}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            {extra && <span className="font-mono font-semibold" style={{ color: hex }}>{extra}</span>}
            {isPulse && <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: hex }} />}
          </div>
        </div>
      </Link>
    )
  }

  // Variant 0 (default) and Variant 4 (same card rendering as default)
  return (
    <Link to={`/units/${unit.id}`}
      className={`block rounded-md px-1.5 py-0.5 border border-l-2 transition-all hover:scale-[1.01] ${glowClass} ${isChanged ? 'animate-flip' : ''}`}
      style={{
        borderLeftColor: hex,
        borderColor: `${hex}35`,
        backgroundColor: `${hex}12`,
      }}>
      <div className="flex items-center gap-1 justify-between">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-xs font-bold text-white shrink-0">{unit.unit_number}</span>
          <span className="text-[10px] text-slate-400 truncate">{unit.driver}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {shopType && <span className={`text-[9px] font-bold px-1 rounded ${shopType === 'our' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>{shopType === 'our' ? 'OUR' : 'LOCAL'}</span>}
          {displayExtra && <span className="text-[10px] font-mono font-semibold" style={{ color: hex }}>{displayExtra}</span>}
          {isPulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: hex }} />}
        </div>
      </div>
    </Link>
  )
}
