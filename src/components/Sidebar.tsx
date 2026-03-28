import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Droplets, ShieldCheck, FileText, Wrench, AlertTriangle, Truck, Users, ClipboardList } from 'lucide-react'
import { defects, oilRecords, inspections } from '../data/mock'

const urgentOil = oilRecords.filter(o => (o.remaining / o.change_interval) <= 0.25 && !o.sent_for_change).length
const urgentInsp = inspections.filter(i => i.days_remaining <= 30).length
const activeDefects = defects.filter(d => d.status === 'active').length

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/oil', icon: Droplets, label: 'Oil & Fluids', badge: urgentOil },
  { to: '/inspections', icon: ShieldCheck, label: 'DOT Inspection', badge: urgentInsp },
  { to: '/registrations', icon: FileText, label: 'Registration' },
  { to: '/repairs', icon: Wrench, label: 'Repairs' },
  { to: '/defects', icon: AlertTriangle, label: 'Defects', badge: activeDefects },
  { to: '/units', icon: Truck, label: 'Units' },
  { to: '/drivers', icon: Users, label: 'Drivers HR' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
]

export default function Sidebar() {
  const location = useLocation()
  return (
    <aside className="w-60 bg-navy-900 border-r border-navy-700 flex flex-col shrink-0">
      <div className="p-5 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white">FleetOps</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(n => {
          const isActive = location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to))
          return (
            <NavLink
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
              }`}
            >
              <n.icon size={18} />
              <span className="flex-1">{n.label}</span>
              {n.badge ? (
                <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {n.badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent text-sm font-semibold">AD</div>
          <div>
            <div className="text-sm font-medium text-white">Admin</div>
            <div className="text-xs text-slate-500">admin@fleetops.io</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
