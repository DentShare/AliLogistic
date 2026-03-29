import { useLocation } from 'react-router-dom'
import { Bell, Maximize, Minimize, Moon, Sun, Plus, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/oil': 'Oil & Fluids',
  '/inspections': 'DOT Inspections',
  '/registrations': 'Registrations',
  '/repairs': 'Repairs',
  '/defects': 'Defects',
  '/units': 'Units',
  '/drivers': 'Drivers HR',
  '/dispatchers': 'Dispatchers',
  '/audit': 'Audit Log',
}

export default function Header() {
  const location = useLocation()
  const { theme, fullscreen, searchQuery, toggleTheme, toggleFullscreen, setSearchQuery, openModal, addToast } = useApp()
  const title = titles[location.pathname] || (location.pathname.startsWith('/units/') ? 'Unit Profile' : 'Logistic Tab')

  const moduleMap: Record<string, string> = { '/oil': 'Oil', '/inspections': 'Inspection', '/registrations': 'Registration', '/repairs': 'Repair', '/defects': 'Defect' }
  const currentModule = moduleMap[location.pathname]

  return (
    <header className="h-14 bg-navy-900 border-b border-navy-700 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-navy-800 rounded-lg px-3 py-1.5 gap-2 mr-2">
          <Search size={14} className="text-slate-500" />
          <input
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-48"
            placeholder="Search units..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal('add-record', currentModule ? { module: currentModule } : undefined)}
          className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors flex items-center gap-1.5 text-sm font-medium"
        >
          <Plus size={16} />
          Add Record
        </button>
        <button
          onClick={() => addToast('No new notifications', 'bg-navy-600')}
          className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </header>
  )
}
