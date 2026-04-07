import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Droplets, ShieldCheck, AlertTriangle, DollarSign, Wrench, Minimize, Navigation } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

export default function Dashboard() {
  const { units, oilRecords, inspections, defects, repairs, unitStatuses, searchQuery, oilThresholds, fullscreen, toggleFullscreen } = useApp()

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFullscreen() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFullscreen])

  // Search helper — applies to ALL columns
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
  const totalRepairCost = repairs.reduce((s, r) => s + r.cost, 0)
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

  return (
    <div className={`flex flex-col ${fullscreen ? 'h-screen p-4 gap-4' : 'h-[calc(100vh-56px-48px)] gap-6'}`}>
      {fullscreen && (
        <button onClick={toggleFullscreen} className="fixed top-4 right-4 z-50 p-2 bg-navy-800/80 border border-navy-700 rounded-lg text-slate-400 hover:text-white backdrop-blur-sm transition-colors" title="Exit fullscreen (Esc)">
          <Minimize size={16} />
        </button>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 shrink-0">
        <KpiCard title="Fleet Size" value={activeUnits} icon={Truck} color="text-accent" />
        <KpiCard title="Rolling" value={rollingUnits.length} icon={Navigation} color="text-emerald-400" />
        <KpiCard title="Oil Urgent" value={oilUrgent.length} icon={Droplets} color="text-orange-400" />
        <KpiCard title="Inspection Due" value={inspDue.length} icon={ShieldCheck} color="text-yellow-400" />
        <KpiCard title="Active Defects" value={activeDefects.length} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="In Repair" value={inRepair.length} icon={Wrench} color="text-orange-400" />
        <KpiCard title="Needs Repair" value={needsRepair.length} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Repair Costs" value={`$${(totalRepairCost / 1000).toFixed(1)}k`} icon={DollarSign} color="text-emerald-400" />
      </div>

      <div className={`flex gap-3 pb-2 items-start flex-1 min-h-0 ${fullscreen ? '' : 'overflow-x-auto'}`}>
        <Column stretch={fullscreen} title="Rolling" color="bg-emerald-500/20 text-emerald-400" count={rollingUnits.length}>
          {rollingUnits.map(s => { const u = getUnit(s.unit_id); return u ? (
            <TruckCard key={s.id} unit={u} severity="good" detail={
              <div>
                {s.origin && s.destination && <div className="text-[10px] text-slate-400 truncate">{s.origin} → {s.destination}</div>}
                {s.load_number && <div className="text-[10px] font-mono text-emerald-400">{s.load_number}</div>}
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="Oil Change Needed" color="bg-red-500/20 text-red-400" count={oilUrgent.length}>
          {oilUrgent.map(o => { const u = getUnit(o.unit_id); const st = oilStatus(o.remaining, o.change_interval, oilThresholds); return u ? (
            <TruckCard key={o.id} unit={u} severity={st === 'critical' ? 'critical' : 'warning'} detail={
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-orange-400">{o.oil_type}</span>
                <span className="text-[10px] font-mono text-red-400">{o.remaining.toLocaleString()} mi</span>
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="Sent for Change" color="bg-blue-500/20 text-blue-400" count={sentForChange.length}>
          {sentForChange.map(o => { const u = getUnit(o.unit_id); return u ? (
            <TruckCard key={o.id} unit={u} severity="sent" detail={
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-blue-400">{o.oil_type}</span>
                <StatusBadge status="sent" label="Sent" />
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="Inspection Due" color="bg-yellow-500/20 text-yellow-400" count={inspDue.length}>
          {inspDue.map(i => { const u = getUnit(i.unit_id); return u ? (
            <TruckCard key={i.id} unit={u} severity={i.days_remaining < 0 ? 'expired' : i.days_remaining <= 7 ? 'critical' : 'warning'} detail={
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{i.doc_number}</span>
                <span className={`text-[10px] font-mono ${i.days_remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {i.days_remaining < 0 ? `${Math.abs(i.days_remaining)}d exp` : `${i.days_remaining}d left`}
                </span>
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="Active Defects" color="bg-red-500/20 text-red-400" count={activeDefects.length}>
          {activeDefects.map(d => { const u = getUnit(d.unit_id); return u ? (
            <TruckCard key={d.id} unit={u} severity={d.severity} detail={
              <div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{d.description}</p>
                <StatusBadge status={d.severity} pulse={d.severity === 'critical'} />
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="In Repair" color="bg-orange-500/20 text-orange-400" count={inRepair.length}>
          {inRepair.map(r => { const u = getUnit(r.unit_id); return u ? (
            <TruckCard key={r.id} unit={u} severity={r.status === 'sent' ? 'sent' : 'in_repair'} detail={
              <div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{r.service}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={r.status === 'sent' ? 'sent' : 'warning'} label={r.status === 'sent' ? 'Sent' : 'In Repair'} />
                  <span className="text-[10px] font-mono text-slate-500">${r.cost.toLocaleString()}</span>
                </div>
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="Needs Repair" color="bg-red-500/20 text-red-400" count={needsRepair.length}>
          {needsRepair.map(r => { const u = getUnit(r.unit_id); return u ? (
            <TruckCard key={r.id} unit={u} severity="needs_repair" detail={
              <div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{r.service}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status="critical" label="Needs Repair" pulse />
                  <span className="text-[10px] font-mono text-slate-500">${r.cost.toLocaleString()}</span>
                </div>
              </div>
            } />
          ) : null })}
        </Column>
        <Column stretch={fullscreen} title="All Clear" color="bg-emerald-500/20 text-emerald-400" count={clearUnits.length}>
          {clearUnits.map(u => (
            <TruckCard key={u.id} unit={u} severity="good" detail={<StatusBadge status="good" label="All Clear" />} />
          ))}
        </Column>
      </div>
    </div>
  )
}

// Column hex colors for tinted backgrounds
const colHex: Record<string, string> = {
  'Rolling': '#22c55e', 'Oil Change Needed': '#ef4444', 'Sent for Change': '#3b82f6',
  'Inspection Due': '#eab308', 'Active Defects': '#ef4444', 'In Repair': '#f97316',
  'Needs Repair': '#ef4444', 'All Clear': '#10b981',
}

function Column({ title, color, count, children, stretch }: { title: string; color: string; count: number; children: React.ReactNode; stretch?: boolean }) {
  const hex = colHex[title] || '#3b82f6'
  return (
    <div className={`rounded-xl border border-navy-700 flex flex-col max-h-full ${stretch ? 'flex-1 min-w-0' : 'min-w-[200px] shrink-0'}`}
      style={{ backgroundColor: `${hex}08`, borderColor: `${hex}20` }}>
      <div className="px-2.5 py-2 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${hex}20` }}>
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1 min-h-0">{children}</div>
    </div>
  )
}

// Card severity colors
const severityHex: Record<string, string> = {
  critical: '#ef4444', expired: '#ef4444', warning: '#f97316', needs_repair: '#ef4444',
  sent: '#3b82f6', in_repair: '#f97316', ok: '#eab308', good: '#10b981',
  moderate: '#f97316', low: '#eab308',
}

function TruckCard({ unit, detail, severity = 'ok' }: {
  unit: { id: string; unit_number: string; driver: string; mileage: number }
  detail: React.ReactNode
  severity?: string
}) {
  const hex = severityHex[severity] || '#3b82f6'
  const isPulse = severity === 'critical' || severity === 'expired' || severity === 'needs_repair'
  return (
    <Link to={`/units/${unit.id}`}
      className={`block rounded-lg px-2.5 py-2 border border-l-2 transition-all hover:scale-[1.02] ${isPulse ? 'animate-pulse-slow' : ''}`}
      style={{
        borderLeftColor: hex,
        borderColor: `${hex}35`,
        backgroundColor: `${hex}12`,
        boxShadow: isPulse ? `0 0 18px ${hex}35, inset 0 0 12px ${hex}0A` : `0 0 8px ${hex}18`,
      }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">{unit.unit_number}</span>
          <span className="text-[10px] text-slate-400">{unit.driver}</span>
        </div>
        {isPulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: hex }} />}
      </div>
      <div className="mt-1">{detail}</div>
    </Link>
  )
}
