import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Droplets, ShieldCheck, AlertTriangle, DollarSign, Wrench, Minimize } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

export default function Dashboard() {
  const { units, oilRecords, inspections, defects, repairs, searchQuery, oilThresholds, fullscreen, toggleFullscreen } = useApp()

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFullscreen() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, toggleFullscreen])

  const filteredUnits = searchQuery
    ? units.filter(u => u.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) || u.driver.toLowerCase().includes(searchQuery.toLowerCase()))
    : units

  const activeUnits = units.filter(u => u.status === 'active').length
  const oilUrgent = oilRecords.filter(o => {
    const st = oilStatus(o.remaining, o.change_interval, oilThresholds)
    return (st === 'critical' || st === 'warning') && !o.sent_for_change
  }).sort((a, b) => a.remaining - b.remaining)
  const sentForChange = oilRecords.filter(o => o.sent_for_change)
  const inspDue = inspections.filter(i => i.days_remaining <= 30).sort((a, b) => a.days_remaining - b.days_remaining)
  const activeDefects = defects.filter(d => d.status === 'active').sort((a, b) => {
    const sev = { critical: 0, moderate: 1, low: 2 }
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2)
  })
  const repairStatusOrder: Record<string, number> = { in_repair: 0, sent: 1, needs_repair: 2 }
  const activeRepairs = repairs.filter(r => r.status !== 'working').sort((a, b) => (repairStatusOrder[a.status] ?? 3) - (repairStatusOrder[b.status] ?? 3))
  const totalRepairCost = repairs.reduce((s, r) => s + r.cost, 0)
  const issueUnitIds = new Set([
    ...oilUrgent.map(o => o.unit_id),
    ...inspDue.map(i => i.unit_id),
    ...activeDefects.map(d => d.unit_id),
    ...activeRepairs.map(r => r.unit_id),
  ])
  const clearUnits = filteredUnits.filter(u => u.status === 'active' && !issueUnitIds.has(u.id))

  const getUnit = (id: string) => units.find(u => u.id === id)

  return (
    <div className={`flex flex-col ${fullscreen ? 'h-screen p-4 gap-4' : 'h-[calc(100vh-56px-48px)] gap-6'}`}>
      {fullscreen && (
        <button onClick={toggleFullscreen} className="fixed top-4 right-4 z-50 p-2 bg-navy-800/80 border border-navy-700 rounded-lg text-slate-400 hover:text-white backdrop-blur-sm transition-colors" title="Exit fullscreen (Esc)">
          <Minimize size={16} />
        </button>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
        <KpiCard title="Fleet Size" value={activeUnits} icon={Truck} color="text-accent" />
        <KpiCard title="Oil Urgent" value={oilUrgent.length} icon={Droplets} color="text-orange-400" />
        <KpiCard title="Inspection Due" value={inspDue.length} icon={ShieldCheck} color="text-yellow-400" />
        <KpiCard title="Active Defects" value={activeDefects.length} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Active Repairs" value={activeRepairs.length} icon={Wrench} color="text-orange-400" />
        <KpiCard title="Repair Costs" value={`$${(totalRepairCost / 1000).toFixed(1)}k`} icon={DollarSign} color="text-emerald-400" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 items-start flex-1 min-h-0">
        <Column title="Oil Change Needed" color="bg-red-500/20 text-red-400" count={oilUrgent.length}>
          {oilUrgent.map(o => { const u = getUnit(o.unit_id); return u ? (
            <TruckCard key={o.id} unit={u} pulse detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-400">{o.oil_type}</span>
                <span className="text-xs font-mono text-red-400">{o.remaining.toLocaleString()} mi left</span>
              </div>
            } />
          ) : null })}
        </Column>
        <Column title="Sent for Change" color="bg-blue-500/20 text-blue-400" count={sentForChange.length}>
          {sentForChange.map(o => { const u = getUnit(o.unit_id); return u ? (
            <TruckCard key={o.id} unit={u} detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400">{o.oil_type}</span>
                <StatusBadge status="sent" label="Sent" />
              </div>
            } />
          ) : null })}
        </Column>
        <Column title="Inspection Due" color="bg-yellow-500/20 text-yellow-400" count={inspDue.length}>
          {inspDue.map(i => { const u = getUnit(i.unit_id); return u ? (
            <TruckCard key={i.id} unit={u} pulse={i.days_remaining < 0} detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{i.doc_number}</span>
                <span className={`text-xs font-mono ${i.days_remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {i.days_remaining < 0 ? `${Math.abs(i.days_remaining)}d expired` : `${i.days_remaining}d left`}
                </span>
              </div>
            } />
          ) : null })}
        </Column>
        <Column title="Active Defects" color="bg-red-500/20 text-red-400" count={activeDefects.length}>
          {activeDefects.map(d => { const u = getUnit(d.unit_id); return u ? (
            <TruckCard key={d.id} unit={u} pulse={d.severity === 'critical'} detail={
              <div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-1">{d.description}</p>
                <StatusBadge status={d.severity} pulse={d.severity === 'critical'} />
              </div>
            } />
          ) : null })}
        </Column>
        <Column title="Repairs" color="bg-orange-500/20 text-orange-400" count={activeRepairs.length}>
          {activeRepairs.map(r => { const u = getUnit(r.unit_id); return u ? (
            <TruckCard key={r.id} unit={u} detail={
              <div>
                <p className="text-xs text-slate-400 mb-1">{r.service}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={r.status === 'needs_repair' ? 'critical' : r.status === 'sent' ? 'sent' : 'warning'} label={r.status === 'needs_repair' ? 'Needs Repair' : r.status === 'sent' ? 'Sent' : 'In Repair'} />
                  <span className="text-xs font-mono text-slate-500">${r.cost.toLocaleString()}</span>
                </div>
              </div>
            } />
          ) : null })}
        </Column>
        <Column title="All Clear" color="bg-emerald-500/20 text-emerald-400" count={clearUnits.length}>
          {clearUnits.map(u => (
            <TruckCard key={u.id} unit={u} detail={<StatusBadge status="good" label="All Clear" />} />
          ))}
        </Column>
      </div>
    </div>
  )
}

function Column({ title, color, count, children }: { title: string; color: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 min-w-[260px] flex flex-col max-h-full shrink-0">
      <div className="p-3 border-b border-navy-700 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-300">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto flex-1 min-h-0">{children}</div>
    </div>
  )
}

function TruckCard({ unit, detail, pulse }: { unit: { id: string; unit_number: string; driver: string; vin: string; mileage: number }; detail: React.ReactNode; pulse?: boolean }) {
  return (
    <Link to={`/units/${unit.id}`} className="block bg-navy-900 rounded-lg p-3 border border-navy-700 hover:border-accent/40 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-white">{unit.unit_number}</span>
        {pulse && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-slow" />}
      </div>
      <div className="text-xs text-slate-500 mb-1">{unit.driver}</div>
      <div className="text-xs font-mono text-slate-600 mb-2">{unit.vin}</div>
      <div className="text-xs font-mono text-slate-400">{unit.mileage.toLocaleString()} mi</div>
      <div className="mt-2">{detail}</div>
    </Link>
  )
}
