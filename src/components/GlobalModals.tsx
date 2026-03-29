import { useState, useEffect } from 'react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { units } = useApp()
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
      <option value="">Select unit...</option>
      {units.map(u => <option key={u.id} value={u.id}>{u.unit_number} — {u.driver}</option>)}
    </select>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>{children}</div>
}

function Input({ value, onChange, type = 'text', placeholder = '' }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent placeholder-slate-500" />
  )
}

function Btn({ children, onClick, color = 'bg-accent hover:bg-accent-hover' }: { children: React.ReactNode; onClick: () => void; color?: string }) {
  return <button onClick={onClick} className={`px-4 py-2 ${color} text-white text-sm font-semibold rounded-lg transition-colors`}>{children}</button>
}

// Mileage Modal
function MileageModal() {
  const { modal, closeModal, updateMileage, units } = useApp()
  const [mileage, setMileage] = useState('')
  const unitId = modal.data?.unitId as string
  const unit = units.find(u => u.id === unitId)

  useEffect(() => { if (unit) setMileage(String(unit.mileage)) }, [unit])

  if (modal.type !== 'mileage' || !unit) return null
  return (
    <Modal title={`Update Mileage — ${unit.unit_number}`} open onClose={closeModal}>
      <div className="space-y-4">
        <div className="bg-navy-700 rounded-lg p-3">
          <div className="text-xs text-slate-500">Current Mileage</div>
          <div className="text-lg font-mono font-bold text-white">{unit.mileage.toLocaleString()} mi</div>
        </div>
        <Field label="New Mileage">
          <Input type="number" value={mileage} onChange={setMileage} placeholder="Enter new mileage" />
        </Field>
        {Number(mileage) > unit.mileage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-400">
            +{(Number(mileage) - unit.mileage).toLocaleString()} mi since last update
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Btn onClick={closeModal} color="bg-navy-600 hover:bg-navy-500">Cancel</Btn>
          <Btn onClick={() => { updateMileage(unitId, Number(mileage)); closeModal() }}>Update Mileage</Btn>
        </div>
      </div>
    </Modal>
  )
}

// Oil Done Modal
function OilDoneModal() {
  const { modal, closeModal, completeOilChange, oilRecords, units } = useApp()
  const [mileage, setMileage] = useState('')
  const oilId = modal.data?.oilId as string
  const oil = oilRecords.find(o => o.id === oilId)
  const unit = oil ? units.find(u => u.id === oil.unit_id) : null

  useEffect(() => { if (unit) setMileage(String(unit.mileage)) }, [unit])

  if (modal.type !== 'oil-done' || !oil || !unit) return null
  const newNext = Number(mileage) + oil.change_interval
  return (
    <Modal title={`Complete Oil Change — ${unit.unit_number}`} open onClose={closeModal}>
      <div className="space-y-4">
        <div className="bg-navy-700 rounded-lg p-3 space-y-2">
          <div className="text-xs text-slate-500">Oil Type: <span className="text-slate-300">{oil.oil_type}</span></div>
          <div className="text-xs text-slate-500">Interval: <span className="text-slate-300">{oil.change_interval.toLocaleString()} mi</span></div>
        </div>
        <Field label="Mileage at time of change">
          <Input type="number" value={mileage} onChange={setMileage} placeholder="Enter mileage" />
        </Field>
        {Number(mileage) > 0 && (
          <div className="bg-navy-700 rounded-lg p-3 space-y-1">
            <div className="text-xs text-slate-500">Preview:</div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Last Changed</span><span className="text-slate-300"><s className="text-red-400 mr-2">{oil.last_changed.toLocaleString()}</s><span className="text-emerald-400">{Number(mileage).toLocaleString()}</span></span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Next Change</span><span className="text-emerald-400">{newNext.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Remaining</span><span className="text-emerald-400 font-bold">{oil.change_interval.toLocaleString()} mi</span></div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Btn onClick={closeModal} color="bg-navy-600 hover:bg-navy-500">Cancel</Btn>
          <Btn onClick={() => { completeOilChange(oilId, Number(mileage)); closeModal() }} color="bg-emerald-600 hover:bg-emerald-500">Complete Change</Btn>
        </div>
      </div>
    </Modal>
  )
}

// Create Truck Modal
function CreateTruckModal() {
  const { modal, closeModal, createUnit } = useApp()
  const [form, setForm] = useState({ unit_number: '', vin: '', driver: '', make: '', model: '', year: '2024' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  if (modal.type !== 'create-truck') return null
  return (
    <Modal title="Create New Truck" open onClose={closeModal}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit Number"><Input value={form.unit_number} onChange={v => set('unit_number', v)} placeholder="T-111" /></Field>
          <Field label="VIN"><Input value={form.vin} onChange={v => set('vin', v.toUpperCase())} placeholder="Enter VIN" /></Field>
        </div>
        <Field label="Driver Name"><Input value={form.driver} onChange={v => set('driver', v)} placeholder="Full name" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Make"><Input value={form.make} onChange={v => set('make', v)} placeholder="Freightliner" /></Field>
          <Field label="Model"><Input value={form.model} onChange={v => set('model', v)} placeholder="Cascadia" /></Field>
          <Field label="Year"><Input type="number" value={form.year} onChange={v => set('year', v)} /></Field>
        </div>
        {form.unit_number && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-xs text-accent">
            Unit <span className="font-bold">{form.unit_number}</span> is the permanent anchor. Vehicles and drivers can be swapped, but the unit number stays forever.
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Btn onClick={closeModal} color="bg-navy-600 hover:bg-navy-500">Cancel</Btn>
          <Btn onClick={() => {
            if (!form.unit_number || !form.vin) return
            createUnit({ ...form, year: Number(form.year) })
            closeModal()
          }} color="bg-emerald-600 hover:bg-emerald-500">Create Truck</Btn>
        </div>
      </div>
    </Modal>
  )
}

// Add Record Modal (universal)
function AddRecordModal() {
  const { modal, closeModal, addOilRecord, addRepair, addDefect, addInspection, addRegistration } = useApp()
  const [tab, setTab] = useState<string>(modal.data?.module as string || 'Oil')
  const [unitId, setUnitId] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [severity, setSeverity] = useState<'critical' | 'moderate' | 'low'>('moderate')
  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (modal.data?.module) setTab(modal.data.module as string)
    if (modal.data?.unitId) setUnitId(modal.data.unitId as string)
  }, [modal.data])

  if (modal.type !== 'add-record') return null

  const tabs = ['Oil', 'Inspection', 'Registration', 'Repair', 'Defect']
  const submit = () => {
    if (!unitId) return
    switch (tab) {
      case 'Oil':
        addOilRecord({ unit_id: unitId, oil_type: fields.oil_type || 'Engine Oil 15W-40', change_interval: Number(fields.interval) || 15000, last_changed: Number(fields.last_changed) || 0 })
        break
      case 'Inspection':
        addInspection({ unit_id: unitId, doc_number: fields.doc_number || `DOT-${Date.now().toString().slice(-6)}`, inspection_date: fields.date || new Date().toISOString().slice(0, 10) })
        break
      case 'Registration':
        addRegistration({ unit_id: unitId, state: fields.state || 'TX', plate_number: fields.plate || '', doc_number: fields.doc_number || `REG-${Date.now().toString().slice(-6)}`, reg_date: fields.date || new Date().toISOString().slice(0, 10) })
        break
      case 'Repair':
        addRepair({ unit_id: unitId, service: fields.service || '', cost: Number(fields.cost) || 0, category: fields.category || 'Engine', shop: fields.shop || '' })
        break
      case 'Defect':
        addDefect({ unit_id: unitId, description: fields.description || '', severity })
        break
    }
    closeModal()
  }

  return (
    <Modal title="Add Record" open onClose={closeModal} width="max-w-xl">
      <div className="space-y-4">
        <div className="flex gap-1 bg-navy-700 rounded-lg p-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
          ))}
        </div>
        <Field label="Unit"><UnitSelect value={unitId} onChange={setUnitId} /></Field>
        {tab === 'Oil' && <>
          <Field label="Oil Type">
            <select value={fields.oil_type || 'Engine Oil 15W-40'} onChange={e => set('oil_type', e.target.value)}
              className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
              {['Engine Oil 15W-40', 'Transmission Fluid', 'Differential Oil', 'Coolant', 'Power Steering'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Change Interval (mi)"><Input type="number" value={fields.interval || '15000'} onChange={v => set('interval', v)} /></Field>
          <Field label="Last Changed (mi)"><Input type="number" value={fields.last_changed || ''} onChange={v => set('last_changed', v)} placeholder="Mileage at last change" /></Field>
        </>}
        {tab === 'Inspection' && <>
          <Field label="Inspection Date"><Input type="date" value={fields.date || ''} onChange={v => set('date', v)} /></Field>
          <Field label="Certificate #"><Input value={fields.doc_number || ''} onChange={v => set('doc_number', v)} placeholder="Auto-generated if empty" /></Field>
        </>}
        {tab === 'Registration' && <>
          <Field label="Registration Date"><Input type="date" value={fields.date || ''} onChange={v => set('date', v)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State"><Input value={fields.state || ''} onChange={v => set('state', v.toUpperCase())} placeholder="TX" /></Field>
            <Field label="Plate #"><Input value={fields.plate || ''} onChange={v => set('plate', v.toUpperCase())} placeholder="TRK-XXXX" /></Field>
          </div>
          <Field label="Document #"><Input value={fields.doc_number || ''} onChange={v => set('doc_number', v)} /></Field>
        </>}
        {tab === 'Repair' && <>
          <Field label="Service Name"><Input value={fields.service || ''} onChange={v => set('service', v)} placeholder="Brake Pad Replacement" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost ($)"><Input type="number" value={fields.cost || ''} onChange={v => set('cost', v)} placeholder="0" /></Field>
            <Field label="Category">
              <select value={fields.category || 'Engine'} onChange={e => set('category', e.target.value)}
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
                {['Brakes', 'Engine', 'Tires', 'Suspension', 'Electrical', 'HVAC', 'Transmission'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Shop"><Input value={fields.shop || ''} onChange={v => set('shop', v)} placeholder="Shop name" /></Field>
        </>}
        {tab === 'Defect' && <>
          <Field label="Description"><textarea value={fields.description || ''} onChange={e => set('description', e.target.value)} placeholder="Describe the defect..."
            className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent h-20 resize-none" /></Field>
          <Field label="Severity">
            <div className="flex gap-2">
              {(['critical', 'moderate', 'low'] as const).map(s => (
                <button key={s} onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${severity === s
                    ? s === 'critical' ? 'bg-red-500/20 border-red-500 text-red-400'
                      : s === 'moderate' ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : 'border-navy-600 text-slate-500 hover:text-slate-300'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </Field>
        </>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={closeModal} color="bg-navy-600 hover:bg-navy-500">Cancel</Btn>
          <Btn onClick={submit}>Add {tab}</Btn>
        </div>
      </div>
    </Modal>
  )
}

export default function GlobalModals() {
  return <>
    <MileageModal />
    <OilDoneModal />
    <CreateTruckModal />
    <AddRecordModal />
  </>
}
