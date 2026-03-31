import { useState } from 'react'
import { UserPlus, Shield, Eye, UserCheck, UserX, Mail, Phone, Clock } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import { useApp } from '../context/AppContext'
import type { Dispatcher } from '../data/mock'

const ALL_MODULES = ['Dashboard', 'Oil', 'Inspections', 'Registrations', 'Repairs', 'Defects', 'Units', 'Drivers', 'Audit']

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  dispatcher: 'bg-accent/15 text-accent border-accent/30',
  viewer: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  dispatcher: UserCheck,
  viewer: Eye,
}

export default function Dispatchers() {
  const { dispatchers, createDispatcher, updateDispatcherStatus, updateDispatcherRole, updateDispatcherModules, searchQuery } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [editingAccess, setEditingAccess] = useState<string | null>(null)

  const filteredDispatchers = searchQuery
    ? dispatchers.filter(d => { const q = searchQuery.toLowerCase(); return d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || d.role.toLowerCase().includes(q) })
    : dispatchers

  const active = filteredDispatchers.filter(d => d.status === 'active').length
  const invited = filteredDispatchers.filter(d => d.status === 'invited').length
  const disabled = filteredDispatchers.filter(d => d.status === 'disabled').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total" value={dispatchers.length} icon={UserCheck} />
        <KpiCard title="Active" value={active} icon={UserCheck} color="text-emerald-400" />
        <KpiCard title="Invited" value={invited} icon={Mail} color="text-blue-400" />
        <KpiCard title="Disabled" value={disabled} icon={UserX} color="text-red-400" />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-400">Dispatchers & Access</h3>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover transition-colors">
          <UserPlus size={16} /> Add Dispatcher
        </button>
      </div>

      {showCreate && <CreateForm onClose={() => setShowCreate(false)} onCreate={createDispatcher} />}

      <div className="space-y-3">
        {filteredDispatchers.map(d => (
          <div key={d.id} className="bg-navy-800 rounded-xl border border-navy-700 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  d.status === 'active' ? 'bg-accent/20 text-accent' : d.status === 'invited' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {d.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white">{d.name}</span>
                    <RoleBadge role={d.role} />
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Mail size={11} /> {d.email}</span>
                    <span className="flex items-center gap-1"><Phone size={11} /> {d.phone}</span>
                    {d.last_login && <span className="flex items-center gap-1"><Clock size={11} /> Last: {d.last_login}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select value={d.role} onChange={e => updateDispatcherRole(d.id, e.target.value as Dispatcher['role'])}
                  className="bg-navy-700 border border-navy-600 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-accent">
                  <option value="admin">Admin</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button onClick={() => setEditingAccess(editingAccess === d.id ? null : d.id)}
                  className="px-3 py-1.5 bg-navy-700 text-xs font-medium text-slate-300 rounded-lg hover:bg-navy-600 transition-colors">
                  Access ({d.modules.length})
                </button>

                {d.status === 'active' && (
                  <button onClick={() => updateDispatcherStatus(d.id, 'disabled')}
                    className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/25 transition-colors">
                    Disable
                  </button>
                )}
                {d.status === 'disabled' && (
                  <button onClick={() => updateDispatcherStatus(d.id, 'active')}
                    className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors">
                    Enable
                  </button>
                )}
                {d.status === 'invited' && (
                  <button onClick={() => updateDispatcherStatus(d.id, 'active')}
                    className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors">
                    Activate
                  </button>
                )}
              </div>
            </div>

            {editingAccess === d.id && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <div className="text-xs font-medium text-slate-400 mb-2">Module Access</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULES.map(m => {
                    const has = d.modules.includes(m)
                    return (
                      <button key={m} onClick={() => {
                        const next = has ? d.modules.filter(x => x !== m) : [...d.modules, m]
                        updateDispatcherModules(d.id, next)
                      }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          has ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-navy-700 border-navy-600 text-slate-500 hover:text-slate-300'
                        }`}>
                        {m}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateDispatcherModules(d.id, [...ALL_MODULES])}
                    className="text-xs text-accent hover:text-accent-hover transition-colors">Select All</button>
                  <button onClick={() => updateDispatcherModules(d.id, [])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const Icon = roleIcons[role] || Eye
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[role] || roleColors.viewer}`}>
      <Icon size={11} /> {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

function CreateForm({ onClose, onCreate }: { onClose: () => void; onCreate: (data: { name: string; email: string; phone: string; role: Dispatcher['role']; modules: string[] }) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Dispatcher['role']>('dispatcher')
  const [modules, setModules] = useState<string[]>(['Dashboard'])

  const toggle = (m: string) => setModules(ms => ms.includes(m) ? ms.filter(x => x !== m) : [...ms, m])

  return (
    <div className="bg-navy-800 rounded-xl border border-accent/30 p-5 space-y-4">
      <h4 className="text-sm font-semibold text-white">Invite New Dispatcher</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@logistictab.io"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Role</label>
        <div className="flex gap-2">
          {(['admin', 'dispatcher', 'viewer'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                role === r ? 'bg-accent/15 border-accent text-accent' : 'border-navy-600 text-slate-500 hover:text-slate-300'
              }`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Module Access</label>
        <div className="flex flex-wrap gap-2">
          {ALL_MODULES.map(m => (
            <button key={m} onClick={() => toggle(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                modules.includes(m) ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-navy-700 border-navy-600 text-slate-500'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 bg-navy-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-navy-500 transition-colors">Cancel</button>
        <button onClick={() => {
          if (!name || !email) return
          onCreate({ name, email, phone, role, modules })
          onClose()
        }} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
          Send Invite
        </button>
      </div>
    </div>
  )
}
