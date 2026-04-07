import { useState } from 'react'
import { Save } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function DailyMileage() {
  const { units, drivers, addDailyMileage, currentUser } = useApp()
  const [inputs, setInputs] = useState<Record<string, string>>({})

  const isViewer = currentUser?.role === 'viewer'

  const activeUnits = units.filter(u => u.status === 'active').sort((a, b) => a.unit_number.localeCompare(b.unit_number))

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

  // Initialize inputs with current mileage on first render
  const getInputValue = (unitId: string, currentMileage: number) => {
    return inputs[unitId] !== undefined ? inputs[unitId] : String(currentMileage)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-slate-300">Daily Mileage Entry</h2>
        {!isViewer && (
          <button onClick={handleSaveAll} disabled={changedCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${changedCount > 0 ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-navy-700 text-slate-500 cursor-not-allowed'}`}>
            <Save size={14} /> Save All ({changedCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-auto flex-1 min-h-0">
        <table className="w-full">
          <thead className="sticky top-0 bg-navy-800 z-10">
            <tr className="border-b border-navy-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-28">Unit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Driver</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-40">Current Mileage</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-44">New Mileage</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Diff</th>
            </tr>
          </thead>
          <tbody>
            {activeUnits.map(unit => {
              const drv = drivers.find(d => d.unit_id === unit.id)
              const diff = getDiff(unit.id)
              return (
                <tr key={unit.id} className="border-b border-navy-700/30 hover:bg-navy-700/20">
                  <td className="px-4 py-3 text-sm font-bold text-white">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{drv?.name || unit.driver}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-mono text-slate-300">{unit.mileage.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!isViewer ? (
                      <input
                        type="number"
                        value={getInputValue(unit.id, unit.mileage)}
                        onChange={e => setInput(unit.id, e.target.value)}
                        className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center outline-none focus:border-accent w-32"
                      />
                    ) : (
                      <span className="text-sm font-mono text-slate-500">{unit.mileage.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {diff ? (
                      <span className={`text-sm font-mono font-semibold ${diff > 500 ? 'text-emerald-400' : diff > 200 ? 'text-blue-400' : 'text-slate-400'}`}>
                        +{diff.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
