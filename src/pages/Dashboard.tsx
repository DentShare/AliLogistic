import { Link } from 'react-router-dom'
import { Truck, Droplets, ShieldCheck, AlertTriangle, AlertCircle, DollarSign } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { units, oilRecords, inspections, defects, repairs, getUnit } from '../data/mock'

const activeUnits = units.filter(u => u.status === 'active').length
const oilUrgent = oilRecords.filter(o => (o.remaining / o.change_interval) <= 0.25 && !o.sent_for_change)
const sentForChange = oilRecords.filter(o => o.sent_for_change)
const inspDue = inspections.filter(i => i.days_remaining <= 30)
const activeDefects = defects.filter(d => d.status === 'active')
const inRepairUnits = units.filter(u => u.status === 'in_repair')
const totalRepairCost = repairs.reduce((s, r) => s + r.cost, 0)
const issueUnitIds = new Set([
  ...oilUrgent.map(o => o.unit_id),
  ...inspDue.map(i => i.unit_id),
  ...activeDefects.map(d => d.unit_id),
  ...inRepairUnits.map(u => u.id),
])
const clearUnits = units.filter(u => u.status === 'active' && !issueUnitIds.has(u.id))

interface ColumnProps {
  title: string
  color: string
  count: number
  children: React.ReactNode
}

function Column({ title, color, count, children }: ColumnProps) {
  return (
    <div className="bg-navy-800 rounded-xl border border-navy-700 min-w-[260px] flex flex-col">
      <div className="p-3 border-b border-navy-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-300">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-auto max-h-[420px]">{children}</div>
    </div>
  )
}

interface TruckCardProps {
  unit_id: string
  detail: React.ReactNode
  pulse?: boolean
}

function TruckCard({ unit_id, detail, pulse }: TruckCardProps) {
  const u = getUnit(unit_id)
  if (!u) return null
  return (
    <Link to={`/units/${u.id}`} className="block bg-navy-900 rounded-lg p-3 border border-navy-700 hover:border-accent/40 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-bold text-white">{u.unit_number}</span>
        {pulse && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-slow" />}
      </div>
      <div className="text-xs text-slate-500 mb-1">{u.driver}</div>
      <div className="text-xs font-mono text-slate-600 mb-2">{u.vin}</div>
      <div className="text-xs font-mono text-slate-400">{u.mileage.toLocaleString()} mi</div>
      <div className="mt-2">{detail}</div>
    </Link>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Fleet Size" value={activeUnits} icon={Truck} color="text-accent" />
        <KpiCard title="Oil Urgent" value={oilUrgent.length} icon={Droplets} color="text-orange-400" />
        <KpiCard title="Inspection Due" value={inspDue.length} icon={ShieldCheck} color="text-yellow-400" />
        <KpiCard title="Active Defects" value={activeDefects.length} icon={AlertTriangle} color="text-red-400" />
        <KpiCard title="Issues" value={issueUnitIds.size} icon={AlertCircle} color="text-orange-400" />
        <KpiCard title="Repair Costs" value={`$${(totalRepairCost / 1000).toFixed(1)}k`} icon={DollarSign} color="text-emerald-400" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        <Column title="Oil Change Needed" color="bg-red-500/20 text-red-400" count={oilUrgent.length}>
          {oilUrgent.map(o => (
            <TruckCard key={o.id} unit_id={o.unit_id} pulse detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-orange-400">{o.oil_type}</span>
                <span className="text-xs font-mono text-red-400">{o.remaining.toLocaleString()} mi left</span>
              </div>
            } />
          ))}
        </Column>

        <Column title="Sent for Change" color="bg-blue-500/20 text-blue-400" count={sentForChange.length}>
          {sentForChange.map(o => (
            <TruckCard key={o.id} unit_id={o.unit_id} detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400">{o.oil_type}</span>
                <StatusBadge status="sent" label="Sent" />
              </div>
            } />
          ))}
        </Column>

        <Column title="Inspection Due" color="bg-yellow-500/20 text-yellow-400" count={inspDue.length}>
          {inspDue.map(i => (
            <TruckCard key={i.id} unit_id={i.unit_id} pulse={i.days_remaining < 0} detail={
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{i.doc_number}</span>
                <span className={`text-xs font-mono ${i.days_remaining < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {i.days_remaining < 0 ? `${Math.abs(i.days_remaining)}d expired` : `${i.days_remaining}d left`}
                </span>
              </div>
            } />
          ))}
        </Column>

        <Column title="Active Defects" color="bg-red-500/20 text-red-400" count={activeDefects.length}>
          {activeDefects.map(d => (
            <TruckCard key={d.id} unit_id={d.unit_id} pulse={d.severity === 'critical'} detail={
              <div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-1">{d.description}</p>
                <StatusBadge status={d.severity} pulse={d.severity === 'critical'} />
              </div>
            } />
          ))}
        </Column>

        <Column title="In Repair" color="bg-orange-500/20 text-orange-400" count={inRepairUnits.length}>
          {inRepairUnits.map(u => (
            <TruckCard key={u.id} unit_id={u.id} detail={
              <StatusBadge status="in_repair" label="In Repair" />
            } />
          ))}
        </Column>

        <Column title="All Clear" color="bg-emerald-500/20 text-emerald-400" count={clearUnits.length}>
          {clearUnits.map(u => (
            <TruckCard key={u.id} unit_id={u.id} detail={
              <StatusBadge status="good" label="All Clear" />
            } />
          ))}
        </Column>
      </div>
    </div>
  )
}
