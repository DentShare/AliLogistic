export interface Unit {
  id: string;
  unit_number: string;
  status: 'active' | 'in_repair' | 'inactive';
  vin: string;
  driver: string;
  mileage: number;
  make: string;
  model: string;
  year: number;
  created: string;
}

export interface OilRecord {
  id: string;
  unit_id: string;
  oil_type: string;
  change_interval: number;
  last_changed: number;
  next_change: number;
  remaining: number;
  sent_for_change: boolean;
}

export interface Inspection {
  id: string;
  unit_id: string;
  doc_number: string;
  inspection_date: string;
  expiry_date: string;
  days_remaining: number;
}

export interface Registration {
  id: string;
  unit_id: string;
  state: string;
  plate_number: string;
  doc_number: string;
  reg_date: string;
  expiry_date: string;
  days_remaining: number;
}

export interface Repair {
  id: string;
  unit_id: string;
  date: string;
  invoice: string;
  service: string;
  category: string;
  shop: string;
  cost: number;
}

export interface Defect {
  id: string;
  unit_id: string;
  description: string;
  severity: 'critical' | 'moderate' | 'low';
  status: 'active' | 'resolved';
  reported_by: string;
  date: string;
  resolved_date?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'working' | 'reviewing' | 'terminated';
  unit_id?: string;
  cdl_number: string;
  cdl_expiry: string;
  medical_expiry: string;
  hire_date: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  dispatcher: string;
  unit_number: string;
  module: string;
  description: string;
  field: string;
  old_value: string;
  new_value: string;
}

export const units: Unit[] = [
  { id: '1', unit_number: 'T-101', status: 'active', vin: '1HGBH41JXMN109186', driver: 'John Smith', mileage: 245830, make: 'Freightliner', model: 'Cascadia', year: 2021, created: '2024-01-15' },
  { id: '2', unit_number: 'T-102', status: 'active', vin: '1FUJGLDR5CLBP8834', driver: 'Mike Johnson', mileage: 189420, make: 'Peterbilt', model: '579', year: 2022, created: '2024-02-01' },
  { id: '3', unit_number: 'T-103', status: 'in_repair', vin: '3AKJGLDR7KSKZ9021', driver: 'Alex Brown', mileage: 312750, make: 'Kenworth', model: 'T680', year: 2020, created: '2024-01-20' },
  { id: '4', unit_number: 'T-104', status: 'active', vin: '1XKAD49X1GJ150987', driver: 'David Lee', mileage: 156200, make: 'Volvo', model: 'VNL 860', year: 2023, created: '2024-03-10' },
  { id: '5', unit_number: 'T-105', status: 'active', vin: '2HSCEAPR5SC054892', driver: 'Chris Davis', mileage: 278900, make: 'International', model: 'LT', year: 2021, created: '2024-01-25' },
  { id: '6', unit_number: 'T-106', status: 'active', vin: '1FUJGLDR8DLBQ4567', driver: 'Sam Wilson', mileage: 198340, make: 'Mack', model: 'Anthem', year: 2022, created: '2024-04-05' },
  { id: '7', unit_number: 'T-107', status: 'inactive', vin: '3HSDJAPR2RC087123', driver: 'Tom Clark', mileage: 345120, make: 'Freightliner', model: 'Cascadia', year: 2019, created: '2024-02-15' },
  { id: '8', unit_number: 'T-108', status: 'active', vin: '1XKWD49X4HJ198765', driver: 'Ryan Martinez', mileage: 134560, make: 'Kenworth', model: 'W990', year: 2023, created: '2024-05-01' },
  { id: '9', unit_number: 'T-109', status: 'active', vin: '1FUJHHDR3CLBR2345', driver: 'Jake Taylor', mileage: 267800, make: 'Peterbilt', model: '389', year: 2021, created: '2024-03-20' },
  { id: '10', unit_number: 'T-110', status: 'active', vin: '4V4NC9EH5EN567890', driver: 'Nick Anderson', mileage: 223450, make: 'Volvo', model: 'VNR 640', year: 2022, created: '2024-06-01' },
];

export const oilRecords: OilRecord[] = [
  { id: '1', unit_id: '1', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 234000, next_change: 249000, remaining: 3170, sent_for_change: false },
  { id: '2', unit_id: '1', oil_type: 'Transmission Fluid', change_interval: 30000, last_changed: 220000, next_change: 250000, remaining: 4170, sent_for_change: false },
  { id: '3', unit_id: '2', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 180000, next_change: 195000, remaining: 5580, sent_for_change: false },
  { id: '4', unit_id: '2', oil_type: 'Differential Oil', change_interval: 50000, last_changed: 150000, next_change: 200000, remaining: 10580, sent_for_change: false },
  { id: '5', unit_id: '3', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 310000, next_change: 325000, remaining: 12250, sent_for_change: false },
  { id: '6', unit_id: '4', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 145000, next_change: 160000, remaining: 3800, sent_for_change: true },
  { id: '7', unit_id: '5', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 275000, next_change: 290000, remaining: 11100, sent_for_change: false },
  { id: '8', unit_id: '5', oil_type: 'Coolant', change_interval: 40000, last_changed: 250000, next_change: 290000, remaining: 11100, sent_for_change: false },
  { id: '9', unit_id: '6', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 185000, next_change: 200000, remaining: 1660, sent_for_change: false },
  { id: '10', unit_id: '8', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 130000, next_change: 145000, remaining: 10440, sent_for_change: false },
  { id: '11', unit_id: '9', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 260000, next_change: 275000, remaining: 7200, sent_for_change: false },
  { id: '12', unit_id: '10', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 215000, next_change: 230000, remaining: 6550, sent_for_change: false },
  { id: '13', unit_id: '6', oil_type: 'Power Steering', change_interval: 60000, last_changed: 150000, next_change: 210000, remaining: 11660, sent_for_change: false },
];

export const inspections: Inspection[] = [
  { id: '1', unit_id: '1', doc_number: 'DOT-2024-1101', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 18 },
  { id: '2', unit_id: '2', doc_number: 'DOT-2024-1102', inspection_date: '2025-06-01', expiry_date: '2026-06-01', days_remaining: 65 },
  { id: '3', unit_id: '3', doc_number: 'DOT-2024-1103', inspection_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: -77 },
  { id: '4', unit_id: '4', doc_number: 'DOT-2024-1104', inspection_date: '2025-09-20', expiry_date: '2026-09-20', days_remaining: 176 },
  { id: '5', unit_id: '5', doc_number: 'DOT-2024-1105', inspection_date: '2025-03-25', expiry_date: '2026-03-25', days_remaining: -3 },
  { id: '6', unit_id: '6', doc_number: 'DOT-2024-1106', inspection_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 135 },
  { id: '7', unit_id: '7', doc_number: 'DOT-2024-1107', inspection_date: '2024-12-01', expiry_date: '2025-12-01', days_remaining: -117 },
  { id: '8', unit_id: '8', doc_number: 'DOT-2024-1108', inspection_date: '2025-11-15', expiry_date: '2026-11-15', days_remaining: 232 },
  { id: '9', unit_id: '9', doc_number: 'DOT-2024-1109', inspection_date: '2025-04-01', expiry_date: '2026-04-01', days_remaining: 4 },
  { id: '10', unit_id: '10', doc_number: 'DOT-2024-1110', inspection_date: '2025-05-20', expiry_date: '2026-05-20', days_remaining: 53 },
];

export const registrations: Registration[] = [
  { id: '1', unit_id: '1', state: 'TX', plate_number: 'TRK-4521', doc_number: 'REG-TX-101', reg_date: '2025-05-01', expiry_date: '2026-05-01', days_remaining: 34 },
  { id: '2', unit_id: '2', state: 'CA', plate_number: 'TRK-8934', doc_number: 'REG-CA-102', reg_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 109 },
  { id: '3', unit_id: '3', state: 'TX', plate_number: 'TRK-2287', doc_number: 'REG-TX-103', reg_date: '2025-02-20', expiry_date: '2026-02-20', days_remaining: -36 },
  { id: '4', unit_id: '4', state: 'IL', plate_number: 'TRK-6610', doc_number: 'REG-IL-104', reg_date: '2025-10-01', expiry_date: '2026-10-01', days_remaining: 187 },
  { id: '5', unit_id: '5', state: 'GA', plate_number: 'TRK-1193', doc_number: 'REG-GA-105', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 13 },
  { id: '6', unit_id: '6', state: 'FL', plate_number: 'TRK-5578', doc_number: 'REG-FL-106', reg_date: '2025-09-01', expiry_date: '2026-09-01', days_remaining: 157 },
  { id: '7', unit_id: '7', state: 'TX', plate_number: 'TRK-3341', doc_number: 'REG-TX-107', reg_date: '2024-11-15', expiry_date: '2025-11-15', days_remaining: -133 },
  { id: '8', unit_id: '8', state: 'OH', plate_number: 'TRK-9925', doc_number: 'REG-OH-108', reg_date: '2025-12-01', expiry_date: '2026-12-01', days_remaining: 248 },
  { id: '9', unit_id: '9', state: 'NJ', plate_number: 'TRK-7762', doc_number: 'REG-NJ-109', reg_date: '2025-03-28', expiry_date: '2026-03-28', days_remaining: 0 },
  { id: '10', unit_id: '10', state: 'PA', plate_number: 'TRK-4408', doc_number: 'REG-PA-110', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 74 },
];

export const repairs: Repair[] = [
  { id: '1', unit_id: '1', date: '2026-03-15', invoice: 'INV-2401', service: 'Brake Pad Replacement', category: 'Brakes', shop: 'FleetPro Service', cost: 1850 },
  { id: '2', unit_id: '1', date: '2026-02-20', invoice: 'INV-2398', service: 'Oil Leak Repair', category: 'Engine', shop: 'TruckCare Center', cost: 2400 },
  { id: '3', unit_id: '2', date: '2026-03-10', invoice: 'INV-2399', service: 'Tire Rotation & Balance', category: 'Tires', shop: 'TireMax', cost: 680 },
  { id: '4', unit_id: '3', date: '2026-03-22', invoice: 'INV-2402', service: 'Suspension Overhaul', category: 'Suspension', shop: 'Heavy Duty Repair', cost: 4500 },
  { id: '5', unit_id: '3', date: '2026-01-15', invoice: 'INV-2390', service: 'Electrical Wiring Repair', category: 'Electrical', shop: 'AutoElectric Pro', cost: 1200 },
  { id: '6', unit_id: '4', date: '2026-03-05', invoice: 'INV-2397', service: 'AC Compressor Replace', category: 'HVAC', shop: 'CoolAir Trucks', cost: 3200 },
  { id: '7', unit_id: '5', date: '2026-02-28', invoice: 'INV-2396', service: 'Transmission Service', category: 'Transmission', shop: 'GearBox Specialists', cost: 5600 },
  { id: '8', unit_id: '6', date: '2026-03-18', invoice: 'INV-2400', service: 'Front Brake Drums', category: 'Brakes', shop: 'FleetPro Service', cost: 2100 },
  { id: '9', unit_id: '8', date: '2026-03-01', invoice: 'INV-2395', service: 'DPF Cleaning', category: 'Engine', shop: 'TruckCare Center', cost: 900 },
  { id: '10', unit_id: '9', date: '2026-02-10', invoice: 'INV-2393', service: 'Leaf Spring Replace', category: 'Suspension', shop: 'Heavy Duty Repair', cost: 3800 },
  { id: '11', unit_id: '10', date: '2026-03-25', invoice: 'INV-2403', service: 'Alternator Replacement', category: 'Electrical', shop: 'AutoElectric Pro', cost: 1450 },
  { id: '12', unit_id: '2', date: '2026-01-20', invoice: 'INV-2391', service: 'Coolant Flush', category: 'Engine', shop: 'TruckCare Center', cost: 350 },
];

export const defects: Defect[] = [
  { id: '1', unit_id: '1', description: 'Check engine light on — intermittent P0420 code', severity: 'moderate', status: 'active', reported_by: 'John Smith', date: '2026-03-20' },
  { id: '2', unit_id: '3', description: 'Air brake pressure dropping below safe threshold', severity: 'critical', status: 'active', reported_by: 'Alex Brown', date: '2026-03-18' },
  { id: '3', unit_id: '5', description: 'Minor coolant leak at upper radiator hose', severity: 'low', status: 'active', reported_by: 'Chris Davis', date: '2026-03-22' },
  { id: '4', unit_id: '6', description: 'Driver side mirror cracked', severity: 'low', status: 'active', reported_by: 'Sam Wilson', date: '2026-03-15' },
  { id: '5', unit_id: '9', description: 'Trailer ABS warning light on', severity: 'moderate', status: 'active', reported_by: 'Jake Taylor', date: '2026-03-24' },
  { id: '6', unit_id: '2', description: 'Windshield wiper motor failure', severity: 'moderate', status: 'resolved', reported_by: 'Mike Johnson', date: '2026-02-10', resolved_date: '2026-02-15' },
  { id: '7', unit_id: '4', description: 'Fifth wheel lock mechanism stiff', severity: 'critical', status: 'resolved', reported_by: 'David Lee', date: '2026-03-01', resolved_date: '2026-03-05' },
  { id: '8', unit_id: '8', description: 'Headlight alignment off', severity: 'low', status: 'resolved', reported_by: 'Ryan Martinez', date: '2026-02-25', resolved_date: '2026-03-02' },
];

export const drivers: Driver[] = [
  { id: '1', name: 'John Smith', phone: '+1 (555) 101-0001', status: 'working', unit_id: '1', cdl_number: 'CDL-TX-445521', cdl_expiry: '2026-08-15', medical_expiry: '2026-05-20', hire_date: '2023-06-01' },
  { id: '2', name: 'Mike Johnson', phone: '+1 (555) 101-0002', status: 'working', unit_id: '2', cdl_number: 'CDL-CA-332198', cdl_expiry: '2027-01-10', medical_expiry: '2026-09-30', hire_date: '2023-08-15' },
  { id: '3', name: 'Alex Brown', phone: '+1 (555) 101-0003', status: 'working', unit_id: '3', cdl_number: 'CDL-TX-887432', cdl_expiry: '2026-04-20', medical_expiry: '2026-04-10', hire_date: '2022-11-01' },
  { id: '4', name: 'David Lee', phone: '+1 (555) 101-0004', status: 'working', unit_id: '4', cdl_number: 'CDL-IL-556789', cdl_expiry: '2027-06-01', medical_expiry: '2026-12-15', hire_date: '2024-01-15' },
  { id: '5', name: 'Chris Davis', phone: '+1 (555) 101-0005', status: 'working', unit_id: '5', cdl_number: 'CDL-GA-221098', cdl_expiry: '2026-11-30', medical_expiry: '2026-07-25', hire_date: '2023-04-10' },
  { id: '6', name: 'Sam Wilson', phone: '+1 (555) 101-0006', status: 'working', unit_id: '6', cdl_number: 'CDL-FL-998877', cdl_expiry: '2027-03-15', medical_expiry: '2027-01-20', hire_date: '2024-03-01' },
  { id: '7', name: 'Tom Clark', phone: '+1 (555) 101-0007', status: 'terminated', unit_id: '7', cdl_number: 'CDL-TX-112233', cdl_expiry: '2026-06-01', medical_expiry: '2026-03-15', hire_date: '2022-05-20' },
  { id: '8', name: 'Ryan Martinez', phone: '+1 (555) 101-0008', status: 'working', unit_id: '8', cdl_number: 'CDL-OH-667788', cdl_expiry: '2027-09-01', medical_expiry: '2027-02-10', hire_date: '2024-05-15' },
  { id: '9', name: 'Jake Taylor', phone: '+1 (555) 101-0009', status: 'working', unit_id: '9', cdl_number: 'CDL-NJ-445566', cdl_expiry: '2026-12-20', medical_expiry: '2026-08-05', hire_date: '2023-10-01' },
  { id: '10', name: 'Nick Anderson', phone: '+1 (555) 101-0010', status: 'working', unit_id: '10', cdl_number: 'CDL-PA-334455', cdl_expiry: '2027-04-10', medical_expiry: '2026-11-30', hire_date: '2024-06-01' },
  { id: '11', name: 'Eric White', phone: '+1 (555) 101-0011', status: 'reviewing', cdl_number: 'CDL-TX-778899', cdl_expiry: '2026-10-15', medical_expiry: '2026-06-20', hire_date: '2024-07-10' },
];

export const auditLog: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-28 09:15', dispatcher: 'Mike Johnson', unit_number: 'T-101', module: 'Oil', description: 'Updated mileage', field: 'mileage', old_value: '245,500', new_value: '245,830' },
  { id: '2', timestamp: '2026-03-28 08:45', dispatcher: 'Alex Brown', unit_number: 'T-106', module: 'Oil', description: 'Sent for oil change', field: 'sent_for_change', old_value: 'false', new_value: 'true' },
  { id: '3', timestamp: '2026-03-27 16:30', dispatcher: 'Mike Johnson', unit_number: 'T-103', module: 'Defects', description: 'Created critical defect', field: 'status', old_value: '—', new_value: 'Active' },
  { id: '4', timestamp: '2026-03-27 14:20', dispatcher: 'Alex Brown', unit_number: 'T-102', module: 'Repairs', description: 'Added repair record', field: 'cost', old_value: '—', new_value: '$680' },
  { id: '5', timestamp: '2026-03-27 11:00', dispatcher: 'Mike Johnson', unit_number: 'T-104', module: 'Oil', description: 'Completed oil change', field: 'remaining', old_value: '1,200 mi', new_value: '15,000 mi' },
  { id: '6', timestamp: '2026-03-26 17:45', dispatcher: 'Alex Brown', unit_number: 'T-105', module: 'Inspection', description: 'Updated inspection', field: 'expiry_date', old_value: '2026-03-25', new_value: '2027-03-25' },
  { id: '7', timestamp: '2026-03-26 10:30', dispatcher: 'Mike Johnson', unit_number: 'T-108', module: 'Mileage', description: 'Daily mileage update', field: 'mileage', old_value: '134,200', new_value: '134,560' },
  { id: '8', timestamp: '2026-03-25 15:10', dispatcher: 'Alex Brown', unit_number: 'T-109', module: 'Defects', description: 'Resolved defect', field: 'status', old_value: 'Active', new_value: 'Resolved' },
  { id: '9', timestamp: '2026-03-25 09:00', dispatcher: 'Mike Johnson', unit_number: 'T-110', module: 'Registration', description: 'Updated registration', field: 'plate_number', old_value: 'TRK-4407', new_value: 'TRK-4408' },
  { id: '10', timestamp: '2026-03-24 14:55', dispatcher: 'Alex Brown', unit_number: 'T-101', module: 'Repairs', description: 'Added brake repair', field: 'cost', old_value: '—', new_value: '$1,850' },
];

export function getUnit(id: string) { return units.find(u => u.id === id); }
export function getUnitByNumber(num: string) { return units.find(u => u.unit_number === num); }

export function oilStatus(remaining: number, interval: number): 'critical' | 'warning' | 'good' | 'ok' {
  const pct = remaining / interval;
  if (pct <= 0.1) return 'critical';
  if (pct <= 0.25) return 'warning';
  if (pct <= 0.5) return 'ok';
  return 'good';
}

export function daysStatus(days: number): 'expired' | 'critical' | 'warning' | 'soon' | 'valid' {
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'soon';
  return 'valid';
}
