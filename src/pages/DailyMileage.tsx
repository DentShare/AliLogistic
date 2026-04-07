import { useState } from 'react'
import { Save, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'

function daysAgo(dateStr: string): number {
  if (!dateStr) return 999
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default function DailyMileage() {
  const { units, drivers, dailyMileage, addDailyMileage, currentUser } = useApp()
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const isViewer = currentUser?.role === 'viewer'
  const sq = search.toLowerCase()

  const activeUnits = units
    .filter(u => {
      if (!sq) return true
      const drv = drivers.find(d => d.unit_id === u.id)
      return u.unit_number.toLowerCase().includes(sq) || u.driver.toLowerCase().includes(sq) || (drv?.name || '').toLowerCase().includes(sq)
    })
    .map(u => {
      const lastEntry = dailyMileage.find(m => m.unit_id === u.id)
      const lastDate = lastEntry?.date || ''
      const days = daysAgo(lastDate)
      return { ...u, lastDate, daysAgo: days }
    })
    .sort((a, b) => b.daysAgo - a.daysAgo) // oldest update first

  const setInput = (unitId: string, val: string) => {
    setInputs(prev => ({ ...prev, [unitId]: val }))
  }

  const getDiff = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    const val = Number(inputs[unitId])
    if (!unit || !val || val <= unit.mileage) return null
    return val - unit.mileage
  }

  const changedCount = activeUnits.filter(u => {
    const val = Number(inputs[u.id])
    return val && val > u.mileage
  }).length

  const handleSaveAll = () => {
    activeUnits.forEach(u => {
      const val = Number(inputs[u.id])
      if (val && val > u.mileage) {
        addDailyMileage(u.id, val)
      }
    })
    setInputs({})
  }

  const getInputValue = (unitId: string, currentMileage: number) => {
    return inputs[unitId] !== undefined ? inputs[unitId] : String(currentMileage)
  }

  // Split into 2 columns
  const half = Math.ceil(activeUnits.length / 2)
  const col1 = activeUnits.slice(0, half)
  const col2 = activeUnits.slice(half)

  const renderRow = (unit: typeof activeUnits[0]) => {
    const drv = drivers.find(d => d.unit_id === unit.id)
    const diff = getDiff(unit.id)
    const stale = unit.daysAgo > 3
    return (
      <tr key={unit.id} className={`border-b border-navy-700/30 hover:bg-navy-700/20 ${stale ? 'bg-red-500/5' : ''}`}>
        <td className="px-2 py-1.5 text-xs font-bold text-white whitespace-nowrap">{unit.unit_number}</td>
        <td className="px-2 py-1.5 text-xs text-slate-400 truncate max-w-[100px]">{drv?.name || unit.driver}</td>
        <td className="px-2 py-1.5 text-center">
          <span className="text-xs font-mono text-slate-300">{unit.mileage.toLocaleString()}</span>
        </td>
        <td className="px-2 py-1.5 text-center">
          {!isViewer ? (
            <input type="number" value={getInputValue(unit.id, unit.mileage)} onChange={e => setInput(unit.id, e.target.value)}
              className="bg-navy-700 border border-navy-600 rounded px-2 py-0.5 text-xs text-white font-mono text-center outline-none focus:border-accent w-24" />
          ) : (
            <span className="text-xs font-mono text-slate-500">{unit.mileage.toLocaleString()}</span>
          )}
        </td>
        <td className="px-2 py-1.5 text-right whitespace-nowrap">
          {diff ? (
            <span className={`text-xs font-mono font-semibold ${diff > 500 ? 'text-emerald-400' : diff > 200 ? 'text-blue-400' : 'text-slate-400'}`}>+{diff.toLocaleString()}</span>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </td>
        <td className="px-2 py-1.5 text-right">
          <span className={`text-[10px] ${stale ? 'text-red-400 font-semibold' : 'text-slate-600'}`}>
            {unit.lastDate ? (unit.daysAgo === 0 ? 'today' : `${unit.daysAgo}d ago`) : 'never'}
          </span>
        </td>
      </tr>
    )
  }

  const renderTable = (items: typeof activeUnits) => (
    <table className="w-full">
      <thead className="sticky top-0 bg-navy-800 z-10">
        <tr className="border-b border-navy-700">
          <th className="text-left px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">Unit</th>
          <th className="text-left px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">Driver</th>
          <th className="text-center px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">Current</th>
          <th className="text-center px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">New</th>
          <th className="text-right px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">Diff</th>
          <th className="text-right px-2 py-2 text-[10px] font-semibold text-slate-500 uppercase">Updated</th>
        </tr>
      </thead>
      <tbody>{items.map(renderRow)}</tbody>
    </table>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)] gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-slate-300">Daily Mileage Entry</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-navy-800 border border-navy-700 rounded-lg px-2.5 py-1.5 gap-1.5">
            <Search size={13} className="text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search units..."
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-32" />
          </div>
          {!isViewer && (
            <button onClick={handleSaveAll} disabled={changedCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${changedCount > 0 ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-navy-700 text-slate-500 cursor-not-allowed'}`}>
              <Save size={14} /> Save All ({changedCount})
            </button>
          )}
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-3 flex-1 min-h-0">
        <div className="flex-1 bg-navy-800 rounded-xl border border-navy-700 overflow-auto">
          {renderTable(col1)}
        </div>
        <div className="flex-1 bg-navy-800 rounded-xl border border-navy-700 overflow-auto">
          {renderTable(col2)}
        </div>
      </div>
    </div>
  )
}
