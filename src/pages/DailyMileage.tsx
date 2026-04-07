import { useState } from 'react'
import { Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function DailyMileage() {
  const { units, dailyMileage, drivers, addDailyMileage, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mileageInput, setMileageInput] = useState('')

  const isViewer = currentUser?.role === 'viewer'
  const today = new Date().toISOString().slice(0, 10)

  // Get last 7 dates
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const activeUnits = units.filter(u => u.status === 'active')
    .filter(u => {
      if (!search) return true
      const sq = search.toLowerCase()
      const drv = drivers.find(d => d.unit_id === u.id)
      return u.unit_number.toLowerCase().includes(sq) || u.driver.toLowerCase().includes(sq) || (drv?.name || '').toLowerCase().includes(sq)
    })
    .sort((a, b) => a.unit_number.localeCompare(b.unit_number))

  const getMileage = (unitId: string, date: string) => {
    return dailyMileage.find(m => m.unit_id === unitId && m.date === date)
  }

  const getDailyDiff = (unitId: string, date: string, prevDate: string) => {
    const curr = getMileage(unitId, date)
    const prev = getMileage(unitId, prevDate)
    if (curr && prev) return curr.mileage - prev.mileage
    return null
  }

  const handleSubmit = (unitId: string) => {
    const val = Number(mileageInput)
    if (val > 0) {
      addDailyMileage(unitId, val)
      setEditingId(null)
      setMileageInput('')
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Stats
  const todayEntries = dailyMileage.filter(m => m.date === today)
  const totalToday = todayEntries.reduce((sum, m) => {
    const prev = dailyMileage.find(p => p.unit_id === m.unit_id && p.date === dates[1])
    return sum + (prev ? m.mileage - prev.mileage : 0)
  }, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white">Daily Mileage</h2>
          <p className="text-xs text-slate-500">Enter current odometer reading for each unit daily</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">Updated today</div>
            <div className="text-sm font-bold text-emerald-400">{todayEntries.length} / {activeUnits.length}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Total miles today</div>
            <div className="text-sm font-bold font-mono text-accent">{totalToday.toLocaleString()} mi</div>
          </div>
          <div className="flex items-center bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1.5 gap-1.5">
            <Search size={13} className="text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search units..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-32" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-auto flex-1 min-h-0">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-navy-800 z-10">
            <tr className="border-b border-navy-700">
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-navy-800 z-20 w-24">Unit</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase w-28">Driver</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500 uppercase w-28">Current</th>
              {dates.map(date => (
                <th key={date} className={`text-center px-2 py-2 text-xs font-semibold uppercase w-24 ${date === today ? 'text-accent' : 'text-slate-500'}`}>
                  {date === today ? 'Today' : formatDate(date)}
                </th>
              ))}
              {!isViewer && <th className="text-center px-2 py-2 text-xs font-semibold text-slate-500 uppercase w-28">Action</th>}
            </tr>
          </thead>
          <tbody>
            {activeUnits.map(unit => {
              const drv = drivers.find(d => d.unit_id === unit.id)
              const todayEntry = getMileage(unit.id, today)
              const isEditing = editingId === unit.id
              return (
                <tr key={unit.id} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                  <td className="px-3 py-1.5 font-bold text-white sticky left-0 bg-navy-800 z-10">{unit.unit_number}</td>
                  <td className="px-3 py-1.5 text-slate-400 text-xs truncate">{drv?.name || unit.driver}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-slate-300 text-xs">{unit.mileage.toLocaleString()}</td>
                  {dates.map((date, i) => {
                    const entry = getMileage(unit.id, date)
                    const diff = i < dates.length - 1 ? getDailyDiff(unit.id, date, dates[i + 1]) : null
                    return (
                      <td key={date} className={`text-center px-2 py-1.5 ${date === today ? 'bg-accent/5' : ''}`}>
                        {entry ? (
                          <div>
                            <div className="text-[10px] font-mono text-slate-400">{entry.mileage.toLocaleString()}</div>
                            {diff !== null && diff > 0 && (
                              <div className={`text-[9px] font-mono font-bold ${diff > 500 ? 'text-emerald-400' : diff > 200 ? 'text-blue-400' : 'text-slate-500'}`}>
                                +{diff.toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                    )
                  })}
                  {!isViewer && (
                    <td className="text-center px-2 py-1.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input type="number" value={mileageInput} onChange={e => setMileageInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit(unit.id)}
                            className="bg-navy-700 border border-navy-600 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-accent w-20 font-mono"
                            placeholder={String(unit.mileage)} autoFocus />
                          <button onClick={() => handleSubmit(unit.id)} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300">OK</button>
                          <button onClick={() => { setEditingId(null); setMileageInput('') }} className="text-[10px] text-slate-500 hover:text-slate-300">X</button>
                        </div>
                      ) : todayEntry ? (
                        <span className="text-[10px] text-emerald-500 font-medium">Done</span>
                      ) : (
                        <button onClick={() => { setEditingId(unit.id); setMileageInput(String(unit.mileage)) }}
                          className="text-[10px] font-medium text-accent hover:text-accent-hover">
                          Enter
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
