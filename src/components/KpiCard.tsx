import { type LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
}

export default function KpiCard({ title, value, icon: Icon, color = 'text-accent', subtitle }: Props) {
  return (
    <div className="bg-navy-800 rounded-xl p-4 border border-navy-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <Icon size={18} className={color} />
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  )
}
