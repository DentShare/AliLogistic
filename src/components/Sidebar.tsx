import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Radio, Droplets, ShieldCheck, FileText, Wrench, AlertTriangle, Truck, Users, ClipboardList, Shield, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

export default function Sidebar() {
  const location = useLocation()
  const { oilRecords, inspections, defects, unitStatuses, oilThresholds, currentUser, logout } = useApp()

  const urgentOil = oilRecords.filter(o => oilStatus(o.remaining, o.change_interval, oilThresholds) === 'critical' || oilStatus(o.remaining, o.change_interval, oilThresholds) === 'warning').filter(o => !o.sent_for_change).length
  const urgentInsp = inspections.filter(i => i.days_remaining <= 30).length
  const activeDefects = defects.filter(d => d.status === 'active').length
  const urgentStatuses = unitStatuses.filter(s => s.status === 'getting_late' || s.status === 'issue').length

  const nav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/updates', icon: Radio, label: 'Updates', badge: urgentStatuses },
    { to: '/oil', icon: Droplets, label: 'Oil & Fluids', badge: urgentOil },
    { to: '/inspections', icon: ShieldCheck, label: 'DOT Inspection', badge: urgentInsp },
    { to: '/registrations', icon: FileText, label: 'Registration' },
    { to: '/repairs', icon: Wrench, label: 'Repairs' },
    { to: '/defects', icon: AlertTriangle, label: 'Defects', badge: activeDefects },
    { to: '/units', icon: Truck, label: 'Units' },
    { to: '/drivers', icon: Users, label: 'Drivers HR' },
    { to: '/dispatchers', icon: Shield, label: 'Dispatchers' },
    { to: '/audit', icon: ClipboardList, label: 'Audit Log' },
  ]

  return (
    <aside className="w-60 bg-navy-900 border-r border-navy-700 flex flex-col shrink-0">
      <div className="p-5 border-b border-navy-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold text-white">Logistic Tab</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(n => {
          const isActive = location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to))
          return (
            <NavLink key={n.to} to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent/15 text-accent' : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
              }`}>
              <n.icon size={18} />
              <span className="flex-1">{n.label}</span>
              {n.badge ? (
                <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">{n.badge}</span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t border-navy-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-semibold">
            {currentUser?.name.split(' ').map(n => n[0]).join('') || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{currentUser?.name || 'User'}</div>
            <div className="text-xs text-slate-500 truncate">{currentUser?.email}</div>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
