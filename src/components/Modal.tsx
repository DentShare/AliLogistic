import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: string
}

export default function Modal({ title, open, onClose, children, width = 'max-w-lg' }: Props) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative bg-navy-800 border border-navy-600 rounded-2xl shadow-2xl ${width} w-full mx-4`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
