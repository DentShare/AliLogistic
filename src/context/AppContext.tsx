import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  units as initUnits, oilRecords as initOil, inspections as initInsp,
  registrations as initReg, repairs as initRepairs, defects as initDefects,
  drivers as initDrivers, dispatchers as initDispatchers, auditLog as initAudit,
  unitStatuses as initUnitStatuses, unitStatusLog as initUnitStatusLog,
  type Unit, type OilRecord, type Inspection, type Registration,
  type Repair, type Defect, type Driver, type Dispatcher, type AuditEntry,
  type UnitStatus, type UnitStatusLogEntry, type UnitOperationalStatus, type UnitCondition,
  OP_STATUS_CONFIG, CONDITION_CONFIG, defaultOilThresholds,
} from '../data/mock'

interface ModalState {
  type: string | null
  data?: Record<string, unknown>
}

interface Toast {
  id: string
  message: string
  color: string
}

interface AuthUser {
  name: string
  email: string
  role: string
}

interface AppState {
  isAuthenticated: boolean
  currentUser: AuthUser | null
  units: Unit[]
  oilRecords: OilRecord[]
  inspections: Inspection[]
  registrations: Registration[]
  repairs: Repair[]
  defects: Defect[]
  drivers: Driver[]
  dispatchers: Dispatcher[]
  auditLog: AuditEntry[]
  unitStatuses: UnitStatus[]
  unitStatusLog: UnitStatusLogEntry[]
  oilThresholds: { critical: number; warning: number; soon: number }
  theme: 'dark' | 'light'
  fullscreen: boolean
  searchQuery: string
  modal: ModalState
  toasts: Toast[]
}

interface AppContextType extends AppState {
  // Oil actions
  updateMileage: (unitId: string, mileage: number) => void
  sendForChange: (oilId: string) => void
  completeOilChange: (oilId: string, mileage: number) => void
  updateOilType: (oilId: string, newType: string) => void
  updateOilInterval: (oilId: string, newInterval: number) => void
  // Defect actions
  resolveDefect: (defectId: string) => void
  reopenDefect: (defectId: string) => void
  // Registration
  renewRegistration: (regId: string) => void
  updateRegistration: (regId: string, data: Partial<Registration>) => void
  uploadRegDocument: (regId: string, name: string) => void
  // Inspection actions
  passInspection: (inspId: string, newDate: string) => void
  uploadInspDocument: (inspId: string, name: string) => void
  // Repair actions
  updateRepairStatus: (repairId: string, status: Repair['status']) => void
  // Driver actions
  createDriver: (data: { name: string; phone: string; cdl_number: string; cdl_expiry: string; medical_expiry: string; unit_id?: string }) => void
  updateDriverStatus: (driverId: string, status: Driver['status']) => void
  // Dispatcher actions
  createDispatcher: (data: { name: string; email: string; phone: string; role: Dispatcher['role']; modules: string[] }) => void
  updateDispatcherStatus: (id: string, status: Dispatcher['status']) => void
  updateDispatcherRole: (id: string, role: Dispatcher['role']) => void
  updateDispatcherModules: (id: string, modules: string[]) => void
  // Unit actions
  assignDriver: (unitId: string, driverName: string, driverId?: string) => void
  createUnit: (data: { unit_number: string; vin: string; driver: string; make: string; model: string; year: number }) => void
  // Add records
  addOilRecord: (data: { unit_id: string; oil_type: string; change_interval: number; last_changed: number }) => void
  addRepair: (data: { unit_id: string; service: string; cost: number; category: string; shop: string }) => void
  addDefect: (data: { unit_id: string; description: string; severity: Defect['severity'] }) => void
  addInspection: (data: { unit_id: string; doc_number: string; inspection_date: string }) => void
  addRegistration: (data: { unit_id: string; state: string; plate_number: string; doc_number: string; reg_date: string }) => void
  // Unit Status actions
  updateUnitStatus: (unitId: string, newStatus: UnitOperationalStatus, fields: { note?: string; load_number?: string; origin?: string; destination?: string; eta?: string }) => void
  setUnitCondition: (unitId: string, condition: UnitCondition, conditionNote: string) => void
  // Oil thresholds
  setOilThresholds: (t: { critical: number; warning: number; soon: number }) => void
  // Auth
  login: (email: string, password: string) => boolean
  logout: () => void
  // UI
  toggleTheme: () => void
  toggleFullscreen: () => void
  setSearchQuery: (q: string) => void
  openModal: (type: string, data?: Record<string, unknown>) => void
  closeModal: () => void
  addToast: (message: string, color?: string) => void
  removeToast: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function addAuditEntry(audit: AuditEntry[], unitNum: string, module: string, desc: string, field: string, oldVal: string, newVal: string): AuditEntry[] {
  return [{
    id: String(Date.now()),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    dispatcher: 'Admin',
    unit_number: unitNum,
    module, description: desc, field,
    old_value: oldVal, new_value: newVal,
  }, ...audit]
}

const VALID_CREDENTIALS = [
  { email: 'admin@logistictab.io', password: 'admin123', name: 'Admin', role: 'admin' },
  { email: 'mike@logistictab.io', password: 'mike123', name: 'Mike Johnson', role: 'dispatcher' },
  { email: 'alex@logistictab.io', password: 'alex123', name: 'Alex Brown', role: 'dispatcher' },
  { email: 'demo@logistictab.io', password: 'demo123', name: 'Demo User', role: 'viewer' },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('lt_auth'))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('lt_auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((email: string, password: string): boolean => {
    const user = VALID_CREDENTIALS.find(c => c.email === email && c.password === password)
    if (!user) return false
    const authUser: AuthUser = { name: user.name, email: user.email, role: user.role }
    localStorage.setItem('lt_auth', JSON.stringify(authUser))
    setCurrentUser(authUser)
    setIsAuthenticated(true)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lt_auth')
    setCurrentUser(null)
    setIsAuthenticated(false)
  }, [])

  const [units, setUnits] = useState<Unit[]>(structuredClone(initUnits))
  const [oilRecords, setOilRecords] = useState<OilRecord[]>(structuredClone(initOil))
  const [inspections, setInspections] = useState<Inspection[]>(structuredClone(initInsp))
  const [registrations, setRegistrations] = useState<Registration[]>(structuredClone(initReg))
  const [repairs, setRepairs] = useState<Repair[]>(structuredClone(initRepairs))
  const [defects, setDefects] = useState<Defect[]>(structuredClone(initDefects))
  const [drivers, setDrivers] = useState<Driver[]>(structuredClone(initDrivers))
  const [dispatchers, setDispatchers] = useState<Dispatcher[]>(structuredClone(initDispatchers))
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(structuredClone(initAudit))
  const [unitStatuses, setUnitStatuses] = useState<UnitStatus[]>(structuredClone(initUnitStatuses))
  const [unitStatusLog, setUnitStatusLog] = useState<UnitStatusLogEntry[]>(structuredClone(initUnitStatusLog))
  const [oilThresholds, setOilThresholds] = useState(defaultOilThresholds)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [fullscreen, setFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: null })
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, color = 'bg-accent') => {
    const id = String(Date.now())
    setToasts(t => [...t, { id, message, color }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  const removeToast = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), [])
  const openModal = useCallback((type: string, data?: Record<string, unknown>) => setModal({ type, data }), [])
  const closeModal = useCallback(() => setModal({ type: null }), [])

  const getUnitNumber = (unitId: string) => units.find(u => u.id === unitId)?.unit_number || '?'

  const updateMileage = useCallback((unitId: string, mileage: number) => {
    const unit = units.find(u => u.id === unitId)
    if (!unit) return
    const oldMileage = unit.mileage
    setUnits(us => us.map(u => u.id === unitId ? { ...u, mileage } : u))
    setOilRecords(ors => ors.map(o => o.unit_id === unitId ? { ...o, remaining: o.next_change - mileage } : o))
    setAuditLog(a => addAuditEntry(a, unit.unit_number, 'Mileage', 'Updated mileage', 'mileage', oldMileage.toLocaleString(), mileage.toLocaleString()))
    addToast(`${unit.unit_number} mileage updated to ${mileage.toLocaleString()} mi`)
  }, [units, addToast])

  const sendForChange = useCallback((oilId: string) => {
    const oil = oilRecords.find(o => o.id === oilId)
    if (!oil) return
    setOilRecords(ors => ors.map(o => o.id === oilId ? { ...o, sent_for_change: true } : o))
    setAuditLog(a => addAuditEntry(a, getUnitNumber(oil.unit_id), 'Oil', `Sent ${oil.oil_type} for change`, 'sent_for_change', 'false', 'true'))
    addToast(`${getUnitNumber(oil.unit_id)} — ${oil.oil_type} sent for change`, 'bg-blue-500')
  }, [oilRecords, units, addToast])

  const completeOilChange = useCallback((oilId: string, mileage: number) => {
    const oil = oilRecords.find(o => o.id === oilId)
    if (!oil) return
    setOilRecords(ors => ors.map(o => o.id === oilId ? {
      ...o, last_changed: mileage, next_change: mileage + o.change_interval,
      remaining: o.change_interval, sent_for_change: false,
    } : o))
    setUnits(us => us.map(u => u.id === oil.unit_id ? { ...u, mileage } : u))
    setAuditLog(a => addAuditEntry(a, getUnitNumber(oil.unit_id), 'Oil', `Completed ${oil.oil_type} change`, 'remaining', `${oil.remaining.toLocaleString()} mi`, `${oil.change_interval.toLocaleString()} mi`))
    addToast(`${getUnitNumber(oil.unit_id)} — ${oil.oil_type} change completed`, 'bg-emerald-500')
  }, [oilRecords, units, addToast])

  const updateOilType = useCallback((oilId: string, newType: string) => {
    setOilRecords(ors => ors.map(o => o.id === oilId ? { ...o, oil_type: newType } : o))
    addToast(`Oil type updated to "${newType}"`)
  }, [addToast])

  const updateOilInterval = useCallback((oilId: string, newInterval: number) => {
    setOilRecords(ors => ors.map(o => {
      if (o.id !== oilId) return o
      const next = o.last_changed + newInterval
      return { ...o, change_interval: newInterval, next_change: next, remaining: next - (units.find(u => u.id === o.unit_id)?.mileage || 0) }
    }))
    addToast(`Interval updated to ${newInterval.toLocaleString()} mi`)
  }, [units, addToast])

  const resolveDefect = useCallback((defectId: string) => {
    const def = defects.find(d => d.id === defectId)
    if (!def) return
    setDefects(ds => ds.map(d => d.id === defectId ? { ...d, status: 'resolved', resolved_date: new Date().toISOString().slice(0, 10) } : d))
    setAuditLog(a => addAuditEntry(a, getUnitNumber(def.unit_id), 'Defects', 'Resolved defect', 'status', 'Active', 'Resolved'))
    addToast(`Defect resolved on ${getUnitNumber(def.unit_id)}`, 'bg-emerald-500')
  }, [defects, units, addToast])

  const reopenDefect = useCallback((defectId: string) => {
    const def = defects.find(d => d.id === defectId)
    if (!def) return
    setDefects(ds => ds.map(d => d.id === defectId ? { ...d, status: 'active', resolved_date: undefined } : d))
    addToast(`Defect reopened on ${getUnitNumber(def.unit_id)}`, 'bg-orange-500')
  }, [defects, units, addToast])

  const renewRegistration = useCallback((regId: string) => {
    const reg = registrations.find(r => r.id === regId)
    if (!reg) return
    const newDate = new Date()
    const expiry = new Date(newDate); expiry.setFullYear(expiry.getFullYear() + 1)
    setRegistrations(rs => rs.map(r => r.id === regId ? {
      ...r, reg_date: newDate.toISOString().slice(0, 10),
      expiry_date: expiry.toISOString().slice(0, 10),
      days_remaining: 365,
    } : r))
    setAuditLog(a => addAuditEntry(a, getUnitNumber(reg.unit_id), 'Registration', 'Renewed registration', 'expiry_date', reg.expiry_date, expiry.toISOString().slice(0, 10)))
    addToast(`${getUnitNumber(reg.unit_id)} registration renewed`, 'bg-emerald-500')
  }, [registrations, units, addToast])

  const createDriver = useCallback((data: { name: string; phone: string; cdl_number: string; cdl_expiry: string; medical_expiry: string; unit_id?: string }) => {
    const rec: Driver = { id: String(Date.now()), ...data, status: 'reviewing', hire_date: new Date().toISOString().slice(0, 10) }
    setDrivers(d => [rec, ...d])
    setAuditLog(a => addAuditEntry(a, data.unit_id ? getUnitNumber(data.unit_id) : '—', 'Drivers', `New driver ${data.name}`, 'status', '—', 'Reviewing'))
    addToast(`Driver ${data.name} added for review`, 'bg-emerald-500')
  }, [units, addToast])

  const updateDriverStatus = useCallback((driverId: string, status: Driver['status']) => {
    const drv = drivers.find(d => d.id === driverId)
    if (!drv) return
    setDrivers(ds => ds.map(d => d.id === driverId ? { ...d, status } : d))
    addToast(`${drv.name} status → ${status}`, status === 'terminated' ? 'bg-red-500' : 'bg-emerald-500')
  }, [drivers, addToast])

  const assignDriver = useCallback((unitId: string, driverName: string, driverId?: string) => {
    const unit = units.find(u => u.id === unitId)
    if (!unit) return
    const oldDriver = unit.driver
    // Unassign old driver from this unit
    setDrivers(ds => ds.map(d => d.unit_id === unitId ? { ...d, unit_id: undefined } : d))
    // Assign new driver to this unit
    if (driverId) {
      // Unassign new driver from their previous unit
      setUnits(us => us.map(u => {
        const drv = drivers.find(d => d.id === driverId)
        if (drv?.unit_id && drv.unit_id !== unitId && u.id === drv.unit_id) return { ...u, driver: '—' }
        return u
      }))
      setDrivers(ds => ds.map(d => d.id === driverId ? { ...d, unit_id: unitId } : d))
    }
    setUnits(us => us.map(u => u.id === unitId ? { ...u, driver: driverName } : u))
    setAuditLog(a => addAuditEntry(a, unit.unit_number, 'Units', 'Driver reassigned', 'driver', oldDriver, driverName))
    addToast(`${unit.unit_number} driver → ${driverName}`, 'bg-accent')
  }, [units, drivers, addToast])

  const createUnit = useCallback((data: { unit_number: string; vin: string; driver: string; make: string; model: string; year: number }) => {
    const newUnit: Unit = {
      id: String(Date.now()), ...data, status: 'active',
      mileage: 0, created: new Date().toISOString().slice(0, 10),
    }
    setUnits(us => [...us, newUnit])
    setAuditLog(a => addAuditEntry(a, data.unit_number, 'Units', 'Created new unit', 'status', '—', 'Active'))
    addToast(`Unit ${data.unit_number} created`, 'bg-emerald-500')
  }, [addToast])

  const addOilRecord = useCallback((data: { unit_id: string; oil_type: string; change_interval: number; last_changed: number }) => {
    const unit = units.find(u => u.id === data.unit_id)
    const next = data.last_changed + data.change_interval
    const remaining = next - (unit?.mileage || 0)
    const rec: OilRecord = { id: String(Date.now()), ...data, next_change: next, remaining, sent_for_change: false }
    setOilRecords(o => [...o, rec])
    addToast(`Oil record added for ${unit?.unit_number || '?'}`)
  }, [units, addToast])

  const addRepair = useCallback((data: { unit_id: string; service: string; cost: number; category: string; shop: string }) => {
    const unit = units.find(u => u.id === data.unit_id)
    const rec: Repair = { id: String(Date.now()), ...data, date: new Date().toISOString().slice(0, 10), invoice: `INV-${Date.now().toString().slice(-4)}`, status: 'needs_repair' }
    setRepairs(r => [rec, ...r])
    setAuditLog(a => addAuditEntry(a, unit?.unit_number || '?', 'Repairs', 'Added repair', 'cost', '—', `$${data.cost}`))
    addToast(`Repair added for ${unit?.unit_number || '?'}: $${data.cost}`, 'bg-orange-500')
  }, [units, addToast])

  const addDefect = useCallback((data: { unit_id: string; description: string; severity: Defect['severity'] }) => {
    const unit = units.find(u => u.id === data.unit_id)
    const rec: Defect = { id: String(Date.now()), ...data, status: 'active', reported_by: 'Admin', date: new Date().toISOString().slice(0, 10) }
    setDefects(d => [rec, ...d])
    addToast(`Defect reported on ${unit?.unit_number || '?'}`, 'bg-red-500')
  }, [units, addToast])

  const addInspection = useCallback((data: { unit_id: string; doc_number: string; inspection_date: string }) => {
    const expiry = new Date(data.inspection_date); expiry.setFullYear(expiry.getFullYear() + 1)
    const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
    const rec: Inspection = { id: String(Date.now()), ...data, expiry_date: expiry.toISOString().slice(0, 10), days_remaining: days }
    setInspections(i => [...i, rec])
    addToast(`Inspection added`, 'bg-emerald-500')
  }, [addToast])

  const passInspection = useCallback((inspId: string, newDate: string) => {
    const insp = inspections.find(i => i.id === inspId)
    if (!insp) return
    const expiry = new Date(newDate); expiry.setFullYear(expiry.getFullYear() + 1)
    const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
    setInspections(is => is.map(i => i.id === inspId ? {
      ...i, inspection_date: newDate, expiry_date: expiry.toISOString().slice(0, 10), days_remaining: days,
    } : i))
    setAuditLog(a => addAuditEntry(a, getUnitNumber(insp.unit_id), 'Inspection', 'Inspection passed', 'inspection_date', insp.inspection_date, newDate))
    addToast(`Inspection passed for ${getUnitNumber(insp.unit_id)}`, 'bg-emerald-500')
  }, [inspections, units, addToast])

  const uploadInspDocument = useCallback((inspId: string, name: string) => {
    setInspections(is => is.map(i => i.id === inspId ? { ...i, document_name: name } : i))
    addToast(`Document "${name}" uploaded`, 'bg-blue-500')
  }, [addToast])

  const updateRegistration = useCallback((regId: string, data: Partial<Registration>) => {
    setRegistrations(rs => rs.map(r => r.id === regId ? { ...r, ...data } : r))
    addToast(`Registration updated`, 'bg-emerald-500')
  }, [addToast])

  const uploadRegDocument = useCallback((regId: string, name: string) => {
    setRegistrations(rs => rs.map(r => r.id === regId ? { ...r, document_name: name } : r))
    addToast(`Document "${name}" uploaded`, 'bg-blue-500')
  }, [addToast])

  const updateRepairStatus = useCallback((repairId: string, status: Repair['status']) => {
    const rep = repairs.find(r => r.id === repairId)
    if (!rep) return
    setRepairs(rs => rs.map(r => r.id === repairId ? { ...r, status } : r))
    const labels: Record<string, string> = { needs_repair: 'Needs Repair', sent: 'Sent', in_repair: 'In Repair', working: 'Working' }
    setAuditLog(a => addAuditEntry(a, getUnitNumber(rep.unit_id), 'Repairs', `Status → ${labels[status]}`, 'status', labels[rep.status], labels[status]))
    addToast(`${getUnitNumber(rep.unit_id)} repair → ${labels[status]}`, status === 'working' ? 'bg-emerald-500' : 'bg-orange-500')
  }, [repairs, units, addToast])

  const addRegistration = useCallback((data: { unit_id: string; state: string; plate_number: string; doc_number: string; reg_date: string }) => {
    const expiry = new Date(data.reg_date); expiry.setFullYear(expiry.getFullYear() + 1)
    const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000)
    const rec: Registration = { id: String(Date.now()), ...data, expiry_date: expiry.toISOString().slice(0, 10), days_remaining: days }
    setRegistrations(r => [...r, rec])
    addToast(`Registration added`, 'bg-emerald-500')
  }, [addToast])

  const createDispatcher = useCallback((data: { name: string; email: string; phone: string; role: Dispatcher['role']; modules: string[] }) => {
    const rec: Dispatcher = { id: String(Date.now()), ...data, status: 'invited', created: new Date().toISOString().slice(0, 10) }
    setDispatchers(d => [...d, rec])
    addToast(`Dispatcher ${data.name} invited`, 'bg-emerald-500')
  }, [addToast])

  const updateDispatcherStatus = useCallback((id: string, status: Dispatcher['status']) => {
    const d = dispatchers.find(x => x.id === id)
    if (!d) return
    setDispatchers(ds => ds.map(x => x.id === id ? { ...x, status } : x))
    addToast(`${d.name} → ${status}`, status === 'disabled' ? 'bg-red-500' : 'bg-emerald-500')
  }, [dispatchers, addToast])

  const updateDispatcherRole = useCallback((id: string, role: Dispatcher['role']) => {
    setDispatchers(ds => ds.map(x => x.id === id ? { ...x, role } : x))
    addToast(`Role updated to ${role}`)
  }, [addToast])

  const updateDispatcherModules = useCallback((id: string, modules: string[]) => {
    setDispatchers(ds => ds.map(x => x.id === id ? { ...x, modules } : x))
    addToast(`Access updated`)
  }, [addToast])

  const updateUnitStatus = useCallback((unitId: string, newStatus: UnitOperationalStatus, fields: { note?: string; load_number?: string; origin?: string; destination?: string; eta?: string }) => {
    const current = unitStatuses.find(s => s.unit_id === unitId)
    const unit = units.find(u => u.id === unitId)
    if (!unit) return
    const now = new Date().toISOString()
    const dispatcher = currentUser?.name || 'Admin'
    const note = fields.note || ''
    const load_number = newStatus === 'no_load' ? '' : (fields.load_number ?? current?.load_number ?? '')
    const origin = newStatus === 'no_load' ? '' : (fields.origin ?? current?.origin ?? '')
    const destination = newStatus === 'no_load' ? '' : (fields.destination ?? current?.destination ?? '')
    const eta = newStatus === 'no_load' ? '' : (fields.eta ?? current?.eta ?? '')
    const prevStatus = current?.status || null

    if (current) {
      setUnitStatuses(ss => ss.map(s => s.unit_id === unitId ? { ...s, status: newStatus, note, load_number, origin, destination, eta, updated_by: dispatcher, updated_at: now } : s))
    } else {
      setUnitStatuses(ss => [...ss, { id: String(Date.now()), unit_id: unitId, status: newStatus, condition: null, condition_note: '', note, load_number, origin, destination, eta, updated_by: dispatcher, updated_at: now, last_activity_at: now }])
    }

    setUnitStatusLog(log => [{
      id: String(Date.now()), unit_id: unitId, previous_status: prevStatus, new_status: newStatus,
      note, load_number, changed_by: dispatcher, changed_at: now,
    }, ...log])

    const prevLabel = prevStatus ? OP_STATUS_CONFIG[prevStatus].label : '—'
    const newLabel = OP_STATUS_CONFIG[newStatus].label
    setAuditLog(a => addAuditEntry(a, unit.unit_number, 'Updates', `Status changed`, 'status', prevLabel, newLabel))
    addToast(`${unit.unit_number} → ${newLabel}`, 'bg-emerald-500')
  }, [unitStatuses, units, currentUser, addToast])

  const setUnitCondition = useCallback((unitId: string, condition: UnitCondition, conditionNote: string) => {
    const unit = units.find(u => u.id === unitId)
    if (!unit) return
    const current = unitStatuses.find(s => s.unit_id === unitId)
    const now = new Date().toISOString()
    const dispatcher = currentUser?.name || 'Admin'
    const prevCondition = current?.condition || null
    const prevLabel = prevCondition ? (CONDITION_CONFIG[prevCondition]?.label || '—') : '—'
    const newLabel = condition ? (CONDITION_CONFIG[condition]?.label || '—') : 'Clear'

    setUnitStatuses(ss => ss.map(s => s.unit_id === unitId ? { ...s, condition, condition_note: conditionNote, updated_by: dispatcher, updated_at: now, last_activity_at: now } : s))
    setAuditLog(a => addAuditEntry(a, unit.unit_number, 'Updates', `Condition changed`, 'condition', prevLabel, newLabel))
    addToast(`${unit.unit_number} condition → ${newLabel}`, condition === 'issue' ? 'bg-red-500' : condition === 'getting_late' ? 'bg-orange-500' : 'bg-emerald-500')
  }, [unitStatuses, units, currentUser, addToast])

  const toggleTheme = useCallback(() => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    return next
  }), [])
  const toggleFullscreen = useCallback(() => setFullscreen(f => !f), [])

  return (
    <AppContext.Provider value={{
      isAuthenticated, currentUser,
      units, oilRecords, inspections, registrations, repairs, defects, drivers, dispatchers, auditLog, unitStatuses, unitStatusLog,
      oilThresholds, setOilThresholds, updateUnitStatus, setUnitCondition,
      theme, fullscreen, searchQuery, modal, toasts, login, logout,
      updateMileage, sendForChange, completeOilChange, updateOilType, updateOilInterval,
      resolveDefect, reopenDefect, renewRegistration, updateRegistration, uploadRegDocument,
      passInspection, uploadInspDocument, updateRepairStatus, createDriver, updateDriverStatus,
      createDispatcher, updateDispatcherStatus, updateDispatcherRole, updateDispatcherModules, assignDriver, createUnit,
      addOilRecord, addRepair, addDefect, addInspection, addRegistration,
      toggleTheme, toggleFullscreen, setSearchQuery, openModal, closeModal, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}
