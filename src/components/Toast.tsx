import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ToastContainer() {
  const { toasts, removeToast } = useApp()
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`${t.color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-[slideIn_0.3s_ease-out] min-w-[280px]`}>
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
