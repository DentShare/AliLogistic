import { useLocation } from 'react-router-dom'
import { Bell, Maximize, Moon, Plus, Search } from 'lucide-react'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/oil': 'Oil & Fluids',
  '/inspections': 'DOT Inspections',
  '/registrations': 'Registrations',
  '/repairs': 'Repairs',
  '/defects': 'Defects',
  '/units': 'Units',
  '/drivers': 'Drivers HR',
  '/audit': 'Audit Log',
}

export default function Header() {
  const location = useLocation()
  const title = titles[location.pathname] || (location.pathname.startsWith('/units/') ? 'Unit Profile' : 'FleetOps')

  return (
    <header className="h-14 bg-navy-900 border-b border-navy-700 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-navy-800 rounded-lg px-3 py-1.5 gap-2 mr-2">
          <Search size={14} className="text-slate-500" />
          <input className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-48" placeholder="Search units..." />
        </div>
        <button className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-1.5 text-sm font-medium">
          <Plus size={16} />
          Add Record
        </button>
        <button className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors">
          <Moon size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors">
          <Maximize size={18} />
        </button>
      </div>
    </header>
  )
}
