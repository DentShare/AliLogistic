import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Maximize, Minimize, Moon, Sun, Plus, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { oilStatus } from '../data/mock'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/updates': 'Updates',
  '/updates/log': 'Status Log',
  '/mileage': 'Daily Mileage',
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
  const { theme, fullscreen, searchQuery, toggleTheme, toggleFullscreen, setSearchQuery, openModal, units, oilRecords, inspections, defects, unitStatuses, oilThresholds } = useApp()
  const [showNotif, setShowNotif] = useState(false)
  const title = titles[location.pathname] || (location.pathname.startsWith('/units/') ? 'Unit Profile' : 'AliLogistic')

  const moduleMap: Record<string, string> = { '/oil': 'Oil', '/inspections': 'Inspection', '/registrations': 'Registration', '/repairs': 'Repair', '/defects': 'Defect' }
  const currentModule = moduleMap[location.pathname]

  return (
    <header className="h-14 bg-navy-900 border-b border-navy-700 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-white">
        <span className="text-accent">AliLogistic</span>
        <span className="text-slate-600 mx-2">/</span>
        {title}
      </h1>
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
        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 transition-colors relative" title="Notifications">
            <Bell size={18} />
            {(() => {
              const critOil = oilRecords.filter(o => oilStatus(o.remaining, o.change_interval, oilThresholds) === 'critical' && !o.sent_for_change).length
              const expInsp = inspections.filter(i => i.days_remaining < 0).length
              const critDef = defects.filter(d => d.status === 'active' && d.severity === 'critical').length
              const issues = unitStatuses.filter(s => s.condition === 'issue').length
              const total = critOil + expInsp + critDef + issues
              return total > 0 ? <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{total}</span> : null
            })()}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-72 bg-navy-800 border border-navy-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-navy-700 text-xs font-semibold text-slate-300">Alerts</div>
              <div className="max-h-64 overflow-y-auto">
                {oilRecords.filter(o => oilStatus(o.remaining, o.change_interval, oilThresholds) === 'critical' && !o.sent_for_change).map(o => {
                  const u = units.find(x => x.id === o.unit_id)
                  return <div key={`oil-${o.id}`} className="px-3 py-2 border-b border-navy-700/50 text-xs"><span className="text-red-400 font-bold">OIL CRITICAL</span> <span className="text-white">{u?.unit_number}</span> <span className="text-slate-500">— {o.remaining.toLocaleString()} mi left</span></div>
                })}
                {inspections.filter(i => i.days_remaining < 0).map(i => {
                  const u = units.find(x => x.id === i.unit_id)
                  return <div key={`insp-${i.id}`} className="px-3 py-2 border-b border-navy-700/50 text-xs"><span className="text-red-400 font-bold">EXPIRED</span> <span className="text-white">{u?.unit_number}</span> <span className="text-slate-500">— DOT {Math.abs(i.days_remaining)}d ago</span></div>
                })}
                {defects.filter(d => d.status === 'active' && d.severity === 'critical').map(d => {
                  const u = units.find(x => x.id === d.unit_id)
                  return <div key={`def-${d.id}`} className="px-3 py-2 border-b border-navy-700/50 text-xs"><span className="text-red-400 font-bold">DEFECT</span> <span className="text-white">{u?.unit_number}</span> <span className="text-slate-500">— {d.description.slice(0, 30)}</span></div>
                })}
                {unitStatuses.filter(s => s.condition === 'issue').map(s => {
                  const u = units.find(x => x.id === s.unit_id)
                  return <div key={`iss-${s.id}`} className="px-3 py-2 border-b border-navy-700/50 text-xs"><span className="text-orange-400 font-bold">ISSUE</span> <span className="text-white">{u?.unit_number}</span> <span className="text-slate-500">— {s.condition_note.slice(0, 30) || 'Issue reported'}</span></div>
                })}
                {(() => {
                  const critOil = oilRecords.filter(o => oilStatus(o.remaining, o.change_interval, oilThresholds) === 'critical' && !o.sent_for_change).length
                  const expInsp = inspections.filter(i => i.days_remaining < 0).length
                  const critDef = defects.filter(d => d.status === 'active' && d.severity === 'critical').length
                  const issues = unitStatuses.filter(s => s.condition === 'issue').length
                  return critOil + expInsp + critDef + issues === 0 ? <div className="px-3 py-4 text-xs text-slate-500 text-center">No critical alerts</div> : null
                })()}
              </div>
            </div>
          )}
        </div>
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
