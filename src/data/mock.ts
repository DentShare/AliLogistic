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
  document_name?: string;
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
  document_name?: string;
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
  status: 'needs_repair' | 'sent' | 'in_repair' | 'working';
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

export interface Dispatcher {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'dispatcher' | 'viewer';
  status: 'active' | 'invited' | 'disabled';
  modules: string[];
  created: string;
  last_login?: string;
}

export type UnitOperationalStatus = 'rolling' | 'sleeping' | 'at_shipper' | 'at_receiver' | 'no_load';
export type UnitCondition = 'issue' | 'getting_late' | 'on_time' | null;

export interface UnitStatus {
  id: string;
  unit_id: string;
  status: UnitOperationalStatus;
  condition: UnitCondition;
  condition_note: string;
  note: string;
  load_number: string;
  origin: string;
  destination: string;
  eta: string;
  updated_by: string;
  updated_at: string;
  last_activity_at: string;
}

export interface UnitStatusLogEntry {
  id: string;
  unit_id: string;
  previous_status: UnitOperationalStatus | null;
  new_status: UnitOperationalStatus;
  note: string;
  load_number: string;
  changed_by: string;
  changed_at: string;
}

export const OP_STATUS_CONFIG: Record<UnitOperationalStatus, { label: string; color: string; bgColor: string; textColor: string; borderColor: string }> = {
  rolling:      { label: 'Rolling',        color: '#22c55e', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
  sleeping:     { label: 'Sleeping',       color: '#3b82f6', bgColor: 'bg-blue-500/15',    textColor: 'text-blue-400',    borderColor: 'border-blue-500/30' },
  at_shipper:   { label: 'At Shipper',     color: '#a855f7', bgColor: 'bg-purple-500/15',  textColor: 'text-purple-400',  borderColor: 'border-purple-500/30' },
  at_receiver:  { label: 'At Receiver',    color: '#6366f1', bgColor: 'bg-indigo-500/15',  textColor: 'text-indigo-400',  borderColor: 'border-indigo-500/30' },
  no_load:      { label: 'No Load',        color: '#6b7280', bgColor: 'bg-slate-500/15',   textColor: 'text-slate-400',   borderColor: 'border-slate-500/30' },
};

export const CONDITION_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  issue:        { label: 'ISSUE',          color: '#ef4444', pulse: true },
  getting_late: { label: 'LATE',           color: '#f97316', pulse: true },
  on_time:      { label: 'ON TIME',        color: '#4ade80' },
};

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
  { id: '11', unit_number: 'T-111', status: 'active', vin: '10000000013580236', driver: 'Mark Gonzalez', mileage: 126081, make: 'International', model: 'LoneStar', year: 2020, created: '2024-03-12' },
  { id: '12', unit_number: 'T-112', status: 'active', vin: '10000000014814804', driver: 'Donald Wilson', mileage: 128452, make: 'Mack', model: 'Anthem', year: 2021, created: '2024-04-13' },
  { id: '13', unit_number: 'T-113', status: 'active', vin: '10000000016049372', driver: 'Steven Anderson', mileage: 130823, make: 'Western Star', model: '5700XE', year: 2022, created: '2024-05-14' },
  { id: '14', unit_number: 'T-114', status: 'active', vin: '10000000017283938', driver: 'Paul Thomas', mileage: 133194, make: 'Freightliner', model: 'Cascadia', year: 2023, created: '2024-06-15' },
  { id: '15', unit_number: 'T-115', status: 'inactive', vin: '10000000018518504', driver: 'Andrew Taylor', mileage: 135565, make: 'Peterbilt', model: '389', year: 2019, created: '2024-07-16' },
  { id: '16', unit_number: 'T-116', status: 'active', vin: '10000000019753072', driver: 'Joshua Moore', mileage: 137936, make: 'Kenworth', model: 'T680', year: 2020, created: '2024-08-17' },
  { id: '17', unit_number: 'T-117', status: 'active', vin: '10000000020987640', driver: 'Kenneth Jackson', mileage: 140307, make: 'Volvo', model: 'VNR 640', year: 2021, created: '2024-09-18' },
  { id: '18', unit_number: 'T-118', status: 'in_repair', vin: '10000000022222206', driver: 'Kevin Martin', mileage: 142678, make: 'International', model: 'LT', year: 2022, created: '2024-01-19' },
  { id: '19', unit_number: 'T-119', status: 'active', vin: '10000000023456772', driver: 'Brian Lee', mileage: 145049, make: 'Mack', model: 'Pinnacle', year: 2023, created: '2024-02-20' },
  { id: '20', unit_number: 'T-120', status: 'active', vin: '10000000024691340', driver: 'George Perez', mileage: 147420, make: 'Western Star', model: '5700XE', year: 2019, created: '2024-03-21' },
  { id: '21', unit_number: 'T-121', status: 'active', vin: '10000000025925908', driver: 'Timothy Thompson', mileage: 149791, make: 'Freightliner', model: 'Columbia', year: 2020, created: '2024-04-22' },
  { id: '22', unit_number: 'T-122', status: 'active', vin: '10000000027160474', driver: 'Ronald White', mileage: 152162, make: 'Peterbilt', model: '579', year: 2021, created: '2024-05-23' },
  { id: '23', unit_number: 'T-123', status: 'active', vin: '10000000028395040', driver: 'Edward Harris', mileage: 154533, make: 'Kenworth', model: 'W990', year: 2022, created: '2024-06-24' },
  { id: '24', unit_number: 'T-124', status: 'active', vin: '10000000029629608', driver: 'Jason Sanchez', mileage: 156904, make: 'Volvo', model: 'VNL 860', year: 2023, created: '2024-07-25' },
  { id: '25', unit_number: 'T-125', status: 'active', vin: '10000000030864176', driver: 'Jeffrey Clark', mileage: 159275, make: 'International', model: 'LoneStar', year: 2019, created: '2024-08-26' },
  { id: '26', unit_number: 'T-126', status: 'active', vin: '10000000032098742', driver: 'Ryan Ramirez', mileage: 161646, make: 'Mack', model: 'Anthem', year: 2020, created: '2024-09-27' },
  { id: '27', unit_number: 'T-127', status: 'active', vin: '10000000033333308', driver: 'Jacob Lewis', mileage: 164017, make: 'Western Star', model: '5700XE', year: 2021, created: '2024-01-28' },
  { id: '28', unit_number: 'T-128', status: 'in_repair', vin: '10000000034567876', driver: 'Gary Robinson', mileage: 166388, make: 'Freightliner', model: 'Cascadia', year: 2022, created: '2024-02-01' },
  { id: '29', unit_number: 'T-129', status: 'active', vin: '10000000035802444', driver: 'Nicholas Walker', mileage: 168759, make: 'Peterbilt', model: '389', year: 2023, created: '2024-03-02' },
  { id: '30', unit_number: 'T-130', status: 'inactive', vin: '10000000037037010', driver: 'Eric Young', mileage: 171130, make: 'Kenworth', model: 'T680', year: 2019, created: '2024-04-03' },
  { id: '31', unit_number: 'T-131', status: 'active', vin: '10000000038271576', driver: 'Jonathan Allen', mileage: 173501, make: 'Volvo', model: 'VNR 640', year: 2020, created: '2024-05-04' },
  { id: '32', unit_number: 'T-132', status: 'active', vin: '10000000039506144', driver: 'Larry King', mileage: 175872, make: 'International', model: 'LT', year: 2021, created: '2024-06-05' },
  { id: '33', unit_number: 'T-133', status: 'active', vin: '10000000040740712', driver: 'Justin Wright', mileage: 178243, make: 'Mack', model: 'Pinnacle', year: 2022, created: '2024-07-06' },
  { id: '34', unit_number: 'T-134', status: 'active', vin: '10000000041975278', driver: 'Scott Scott', mileage: 180614, make: 'Western Star', model: '5700XE', year: 2023, created: '2024-08-07' },
  { id: '35', unit_number: 'T-135', status: 'active', vin: '10000000043209844', driver: 'Brandon Torres', mileage: 182985, make: 'Freightliner', model: 'Columbia', year: 2019, created: '2024-09-08' },
  { id: '36', unit_number: 'T-136', status: 'active', vin: '10000000044444412', driver: 'Benjamin Hill', mileage: 185356, make: 'Peterbilt', model: '579', year: 2020, created: '2024-01-09' },
  { id: '37', unit_number: 'T-137', status: 'active', vin: '10000000045678980', driver: 'Samuel Green', mileage: 187727, make: 'Kenworth', model: 'W990', year: 2021, created: '2024-02-10' },
  { id: '38', unit_number: 'T-138', status: 'in_repair', vin: '10000000046913546', driver: 'Gregory Adams', mileage: 190098, make: 'Volvo', model: 'VNL 860', year: 2022, created: '2024-03-11' },
  { id: '39', unit_number: 'T-139', status: 'active', vin: '10000000048148112', driver: 'Frank Baker', mileage: 192469, make: 'International', model: 'LoneStar', year: 2023, created: '2024-04-12' },
  { id: '40', unit_number: 'T-140', status: 'active', vin: '10000000049382680', driver: 'Raymond Nelson', mileage: 194840, make: 'Mack', model: 'Anthem', year: 2019, created: '2024-05-13' },
  { id: '41', unit_number: 'T-141', status: 'active', vin: '10000000050617248', driver: 'Patrick Carter', mileage: 197211, make: 'Western Star', model: '5700XE', year: 2020, created: '2024-06-14' },
  { id: '42', unit_number: 'T-142', status: 'active', vin: '10000000051851814', driver: 'Jack Mitchell', mileage: 199582, make: 'Freightliner', model: 'Cascadia', year: 2021, created: '2024-07-15' },
  { id: '43', unit_number: 'T-143', status: 'active', vin: '10000000053086380', driver: 'Dennis Roberts', mileage: 201953, make: 'Peterbilt', model: '389', year: 2022, created: '2024-08-16' },
  { id: '44', unit_number: 'T-144', status: 'active', vin: '10000000054320948', driver: 'Jerry Turner', mileage: 204324, make: 'Kenworth', model: 'T680', year: 2023, created: '2024-09-17' },
  { id: '45', unit_number: 'T-145', status: 'inactive', vin: '10000000055555516', driver: 'Alexander Phillips', mileage: 206695, make: 'Volvo', model: 'VNR 640', year: 2019, created: '2024-01-18' },
  { id: '46', unit_number: 'T-146', status: 'active', vin: '10000000056790082', driver: 'Tyler Campbell', mileage: 209066, make: 'International', model: 'LT', year: 2020, created: '2024-02-19' },
  { id: '47', unit_number: 'T-147', status: 'active', vin: '10000000058024648', driver: 'Henry Parker', mileage: 211437, make: 'Mack', model: 'Pinnacle', year: 2021, created: '2024-03-20' },
  { id: '48', unit_number: 'T-148', status: 'in_repair', vin: '10000000059259216', driver: 'Douglas Evans', mileage: 213808, make: 'Western Star', model: '5700XE', year: 2022, created: '2024-04-21' },
  { id: '49', unit_number: 'T-149', status: 'active', vin: '10000000060493784', driver: 'Aaron Edwards', mileage: 216179, make: 'Freightliner', model: 'Columbia', year: 2023, created: '2024-05-22' },
  { id: '50', unit_number: 'T-150', status: 'active', vin: '10000000061728350', driver: 'Peter Collins', mileage: 218550, make: 'Peterbilt', model: '579', year: 2019, created: '2024-06-23' },
  { id: '51', unit_number: 'T-151', status: 'active', vin: '10000000062962916', driver: 'Nathan Stewart', mileage: 220921, make: 'Kenworth', model: 'W990', year: 2020, created: '2024-07-24' },
  { id: '52', unit_number: 'T-152', status: 'active', vin: '10000000064197484', driver: 'Zachary Murphy', mileage: 223292, make: 'Volvo', model: 'VNL 860', year: 2021, created: '2024-08-25' },
  { id: '53', unit_number: 'T-153', status: 'active', vin: '10000000065432052', driver: 'Dylan Rivera', mileage: 225663, make: 'International', model: 'LoneStar', year: 2022, created: '2024-09-26' },
  { id: '54', unit_number: 'T-154', status: 'active', vin: '10000000066666618', driver: 'Ethan Cook', mileage: 228034, make: 'Mack', model: 'Anthem', year: 2023, created: '2024-01-27' },
  { id: '55', unit_number: 'T-155', status: 'active', vin: '10000000067901184', driver: 'Logan Rogers', mileage: 230405, make: 'Western Star', model: '5700XE', year: 2019, created: '2024-02-28' },
  { id: '56', unit_number: 'T-156', status: 'active', vin: '10000000069135752', driver: 'Owen Morgan', mileage: 232776, make: 'Freightliner', model: 'Cascadia', year: 2020, created: '2024-03-01' },
  { id: '57', unit_number: 'T-157', status: 'active', vin: '10000000070370320', driver: 'Caleb Peterson', mileage: 235147, make: 'Peterbilt', model: '389', year: 2021, created: '2024-04-02' },
  { id: '58', unit_number: 'T-158', status: 'in_repair', vin: '10000000071604886', driver: 'Christian Cooper', mileage: 237518, make: 'Kenworth', model: 'T680', year: 2022, created: '2024-05-03' },
  { id: '59', unit_number: 'T-159', status: 'active', vin: '10000000072839452', driver: 'Hunter Reed', mileage: 239889, make: 'Volvo', model: 'VNR 640', year: 2023, created: '2024-06-04' },
  { id: '60', unit_number: 'T-160', status: 'inactive', vin: '10000000074074020', driver: 'Elijah Bailey', mileage: 242260, make: 'International', model: 'LT', year: 2019, created: '2024-07-05' },
  { id: '61', unit_number: 'T-161', status: 'active', vin: '10000000075308588', driver: 'Connor Bell', mileage: 244631, make: 'Mack', model: 'Pinnacle', year: 2020, created: '2024-08-06' },
  { id: '62', unit_number: 'T-162', status: 'active', vin: '10000000076543154', driver: 'Cameron Gomez', mileage: 247002, make: 'Western Star', model: '5700XE', year: 2021, created: '2024-09-07' },
  { id: '63', unit_number: 'T-163', status: 'active', vin: '10000000077777720', driver: 'Aiden Kelly', mileage: 249373, make: 'Freightliner', model: 'Columbia', year: 2022, created: '2024-01-08' },
  { id: '64', unit_number: 'T-164', status: 'active', vin: '10000000079012288', driver: 'Luke Howard', mileage: 251744, make: 'Peterbilt', model: '579', year: 2023, created: '2024-02-09' },
  { id: '65', unit_number: 'T-165', status: 'active', vin: '10000000080246856', driver: 'Sean Ward', mileage: 254115, make: 'Kenworth', model: 'W990', year: 2019, created: '2024-03-10' },
  { id: '66', unit_number: 'T-166', status: 'active', vin: '10000000081481422', driver: 'Cole Cox', mileage: 256486, make: 'Volvo', model: 'VNL 860', year: 2020, created: '2024-04-11' },
  { id: '67', unit_number: 'T-167', status: 'active', vin: '10000000082715988', driver: 'Carlos Diaz', mileage: 258857, make: 'International', model: 'LoneStar', year: 2021, created: '2024-05-12' },
  { id: '68', unit_number: 'T-168', status: 'in_repair', vin: '10000000083950556', driver: 'Dominic Richardson', mileage: 261228, make: 'Mack', model: 'Anthem', year: 2022, created: '2024-06-13' },
  { id: '69', unit_number: 'T-169', status: 'active', vin: '10000000085185124', driver: 'Ian Wood', mileage: 263599, make: 'Western Star', model: '5700XE', year: 2023, created: '2024-07-14' },
  { id: '70', unit_number: 'T-170', status: 'active', vin: '10000000086419690', driver: 'Gabriel Watson', mileage: 265970, make: 'Freightliner', model: 'Cascadia', year: 2019, created: '2024-08-15' },
  { id: '71', unit_number: 'T-171', status: 'active', vin: '10000000087654256', driver: 'Julian Brooks', mileage: 268341, make: 'Peterbilt', model: '389', year: 2020, created: '2024-09-16' },
  { id: '72', unit_number: 'T-172', status: 'active', vin: '10000000088888824', driver: 'Miguel Bennett', mileage: 270712, make: 'Kenworth', model: 'T680', year: 2021, created: '2024-01-17' },
  { id: '73', unit_number: 'T-173', status: 'active', vin: '10000000090123392', driver: 'Luis Gray', mileage: 273083, make: 'Volvo', model: 'VNR 640', year: 2022, created: '2024-02-18' },
  { id: '74', unit_number: 'T-174', status: 'active', vin: '10000000091357958', driver: 'Diego Reyes', mileage: 275454, make: 'International', model: 'LT', year: 2023, created: '2024-03-19' },
  { id: '75', unit_number: 'T-175', status: 'inactive', vin: '10000000092592524', driver: 'Oscar Cruz', mileage: 277825, make: 'Mack', model: 'Pinnacle', year: 2019, created: '2024-04-20' },
  { id: '76', unit_number: 'T-176', status: 'active', vin: '10000000093827092', driver: 'Travis Hughes', mileage: 280196, make: 'Western Star', model: '5700XE', year: 2020, created: '2024-05-21' },
  { id: '77', unit_number: 'T-177', status: 'active', vin: '10000000095061660', driver: 'Brett Price', mileage: 282567, make: 'Freightliner', model: 'Columbia', year: 2021, created: '2024-06-22' },
  { id: '78', unit_number: 'T-178', status: 'in_repair', vin: '10000000096296226', driver: 'Marcus Myers', mileage: 284938, make: 'Peterbilt', model: '579', year: 2022, created: '2024-07-23' },
  { id: '79', unit_number: 'T-179', status: 'active', vin: '10000000097530792', driver: 'Corey Long', mileage: 287309, make: 'Kenworth', model: 'W990', year: 2023, created: '2024-08-24' },
  { id: '80', unit_number: 'T-180', status: 'active', vin: '10000000098765360', driver: 'Lance Foster', mileage: 289680, make: 'Volvo', model: 'VNL 860', year: 2019, created: '2024-09-25' },
  { id: '81', unit_number: 'T-181', status: 'active', vin: '10000000099999928', driver: 'Victor Sanders', mileage: 292051, make: 'International', model: 'LoneStar', year: 2020, created: '2024-01-26' },
  { id: '82', unit_number: 'T-182', status: 'active', vin: '10000000101234494', driver: 'Wesley Ross', mileage: 294422, make: 'Mack', model: 'Anthem', year: 2021, created: '2024-02-27' },
  { id: '83', unit_number: 'T-183', status: 'active', vin: '10000000102469060', driver: 'Danny Morales', mileage: 296793, make: 'Western Star', model: '5700XE', year: 2022, created: '2024-03-28' },
  { id: '84', unit_number: 'T-184', status: 'active', vin: '10000000103703628', driver: 'Jesse Powell', mileage: 299164, make: 'Freightliner', model: 'Cascadia', year: 2023, created: '2024-04-01' },
  { id: '85', unit_number: 'T-185', status: 'active', vin: '10000000104938196', driver: 'Troy Sullivan', mileage: 301535, make: 'Peterbilt', model: '389', year: 2019, created: '2024-05-02' },
  { id: '86', unit_number: 'T-186', status: 'active', vin: '10000000106172762', driver: 'Derek Russell', mileage: 303906, make: 'Kenworth', model: 'T680', year: 2020, created: '2024-06-03' },
  { id: '87', unit_number: 'T-187', status: 'active', vin: '10000000107407328', driver: 'Omar Ortiz', mileage: 306277, make: 'Volvo', model: 'VNR 640', year: 2021, created: '2024-07-04' },
  { id: '88', unit_number: 'T-188', status: 'in_repair', vin: '10000000108641896', driver: 'Sergio Jenkins', mileage: 308648, make: 'International', model: 'LT', year: 2022, created: '2024-08-05' },
  { id: '89', unit_number: 'T-189', status: 'active', vin: '10000000109876464', driver: 'Ivan Gutierrez', mileage: 311019, make: 'Mack', model: 'Pinnacle', year: 2023, created: '2024-09-06' },
  { id: '90', unit_number: 'T-190', status: 'inactive', vin: '10000000111111030', driver: 'Felix Perry', mileage: 313390, make: 'Western Star', model: '5700XE', year: 2019, created: '2024-01-07' },
  { id: '91', unit_number: 'T-191', status: 'active', vin: '10000000112345596', driver: 'Hector Butler', mileage: 315761, make: 'Freightliner', model: 'Columbia', year: 2020, created: '2024-02-08' },
  { id: '92', unit_number: 'T-192', status: 'active', vin: '10000000113580164', driver: 'Angel Barnes', mileage: 318132, make: 'Peterbilt', model: '579', year: 2021, created: '2024-03-09' },
  { id: '93', unit_number: 'T-193', status: 'active', vin: '10000000114814732', driver: 'Adrian Fisher', mileage: 320503, make: 'Kenworth', model: 'W990', year: 2022, created: '2024-04-10' },
  { id: '94', unit_number: 'T-194', status: 'active', vin: '10000000116049298', driver: 'Edgar Henderson', mileage: 322874, make: 'Volvo', model: 'VNL 860', year: 2023, created: '2024-05-11' },
  { id: '95', unit_number: 'T-195', status: 'active', vin: '10000000117283864', driver: 'Ruben Coleman', mileage: 325245, make: 'International', model: 'LoneStar', year: 2019, created: '2024-06-12' },
  { id: '96', unit_number: 'T-196', status: 'active', vin: '10000000118518432', driver: 'Jorge Simmons', mileage: 327616, make: 'Mack', model: 'Anthem', year: 2020, created: '2024-07-13' },
  { id: '97', unit_number: 'T-197', status: 'active', vin: '10000000119753000', driver: 'Ricardo Patterson', mileage: 329987, make: 'Western Star', model: '5700XE', year: 2021, created: '2024-08-14' },
  { id: '98', unit_number: 'T-198', status: 'in_repair', vin: '10000000120987566', driver: 'Cesar Jordan', mileage: 332358, make: 'Freightliner', model: 'Cascadia', year: 2022, created: '2024-09-15' },
  { id: '99', unit_number: 'T-199', status: 'active', vin: '10000000122222132', driver: 'Mario Reynolds', mileage: 334729, make: 'Peterbilt', model: '389', year: 2023, created: '2024-01-16' },
  { id: '100', unit_number: 'T-200', status: 'active', vin: '10000000123456700', driver: 'Fernando Hamilton', mileage: 337100, make: 'Kenworth', model: 'T680', year: 2019, created: '2024-02-17' },
  { id: '101', unit_number: 'T-201', status: 'active', vin: '10000000124691268', driver: 'Manuel Graham', mileage: 339471, make: 'Volvo', model: 'VNR 640', year: 2020, created: '2024-03-18' },
  { id: '102', unit_number: 'T-202', status: 'active', vin: '10000000125925834', driver: 'Eduardo Kim', mileage: 341842, make: 'International', model: 'LT', year: 2021, created: '2024-04-19' },
  { id: '103', unit_number: 'T-203', status: 'active', vin: '10000000127160400', driver: 'Arturo Gonzales', mileage: 344213, make: 'Mack', model: 'Pinnacle', year: 2022, created: '2024-05-20' },
  { id: '104', unit_number: 'T-204', status: 'active', vin: '10000000128394968', driver: 'Alfredo Williams', mileage: 346584, make: 'Western Star', model: '5700XE', year: 2023, created: '2024-06-21' },
  { id: '105', unit_number: 'T-205', status: 'inactive', vin: '10000000129629536', driver: 'Guillermo Johnson', mileage: 348955, make: 'Freightliner', model: 'Columbia', year: 2019, created: '2024-07-22' },
  { id: '106', unit_number: 'T-206', status: 'active', vin: '10000000130864102', driver: 'Enrique Brown', mileage: 101326, make: 'Peterbilt', model: '579', year: 2020, created: '2024-08-23' },
  { id: '107', unit_number: 'T-207', status: 'active', vin: '10000000132098668', driver: 'Roberto Jones', mileage: 103697, make: 'Kenworth', model: 'W990', year: 2021, created: '2024-09-24' },
  { id: '108', unit_number: 'T-208', status: 'in_repair', vin: '10000000133333236', driver: 'Francisco Garcia', mileage: 106068, make: 'Volvo', model: 'VNL 860', year: 2022, created: '2024-01-25' },
  { id: '109', unit_number: 'T-209', status: 'active', vin: '10000000134567804', driver: 'Alberto Miller', mileage: 108439, make: 'International', model: 'LoneStar', year: 2023, created: '2024-02-26' },
  { id: '110', unit_number: 'T-210', status: 'active', vin: '10000000135802370', driver: 'Javier Davis', mileage: 110810, make: 'Mack', model: 'Anthem', year: 2019, created: '2024-03-27' },
  { id: '111', unit_number: 'T-211', status: 'active', vin: '10000000137036936', driver: 'James Rodriguez', mileage: 113181, make: 'Western Star', model: '5700XE', year: 2020, created: '2024-04-28' },
  { id: '112', unit_number: 'T-212', status: 'active', vin: '10000000138271504', driver: 'Robert Martinez', mileage: 115552, make: 'Freightliner', model: 'Cascadia', year: 2021, created: '2024-05-01' },
  { id: '113', unit_number: 'T-213', status: 'active', vin: '10000000139506072', driver: 'Michael Hernandez', mileage: 117923, make: 'Peterbilt', model: '389', year: 2022, created: '2024-06-02' },
  { id: '114', unit_number: 'T-214', status: 'active', vin: '10000000140740638', driver: 'William Lopez', mileage: 120294, make: 'Kenworth', model: 'T680', year: 2023, created: '2024-07-03' },
  { id: '115', unit_number: 'T-215', status: 'active', vin: '10000000141975204', driver: 'Richard Gonzalez', mileage: 122665, make: 'Volvo', model: 'VNR 640', year: 2019, created: '2024-08-04' },
  { id: '116', unit_number: 'T-216', status: 'active', vin: '10000000143209772', driver: 'Joseph Wilson', mileage: 125036, make: 'International', model: 'LT', year: 2020, created: '2024-09-05' },
  { id: '117', unit_number: 'T-217', status: 'active', vin: '10000000144444340', driver: 'Thomas Anderson', mileage: 127407, make: 'Mack', model: 'Pinnacle', year: 2021, created: '2024-01-06' },
  { id: '118', unit_number: 'T-218', status: 'in_repair', vin: '10000000145678906', driver: 'Charles Thomas', mileage: 129778, make: 'Western Star', model: '5700XE', year: 2022, created: '2024-02-07' },
  { id: '119', unit_number: 'T-219', status: 'active', vin: '10000000146913472', driver: 'Daniel Taylor', mileage: 132149, make: 'Freightliner', model: 'Columbia', year: 2023, created: '2024-03-08' },
  { id: '120', unit_number: 'T-220', status: 'inactive', vin: '10000000148148040', driver: 'Matthew Moore', mileage: 134520, make: 'Peterbilt', model: '579', year: 2019, created: '2024-04-09' },
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
  { id: '24', unit_id: '11', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 116644, next_change: 131644, remaining: 5563, sent_for_change: false },
  { id: '25', unit_id: '12', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 120748, next_change: 135748, remaining: 7296, sent_for_change: false },
  { id: '26', unit_id: '13', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 124852, next_change: 139852, remaining: 9029, sent_for_change: false },
  { id: '27', unit_id: '14', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 128956, next_change: 143956, remaining: 10762, sent_for_change: false },
  { id: '28', unit_id: '15', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 133060, next_change: 148060, remaining: 12495, sent_for_change: false },
  { id: '29', unit_id: '16', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 137164, next_change: 152164, remaining: 14228, sent_for_change: false },
  { id: '30', unit_id: '17', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 127268, next_change: 142268, remaining: 1961, sent_for_change: false },
  { id: '31', unit_id: '18', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 131372, next_change: 146372, remaining: 3694, sent_for_change: false },
  { id: '32', unit_id: '19', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 135476, next_change: 150476, remaining: 5427, sent_for_change: false },
  { id: '33', unit_id: '20', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 139580, next_change: 154580, remaining: 7160, sent_for_change: false },
  { id: '34', unit_id: '21', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 143684, next_change: 158684, remaining: 8893, sent_for_change: false },
  { id: '35', unit_id: '22', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 147788, next_change: 162788, remaining: 10626, sent_for_change: false },
  { id: '36', unit_id: '23', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 151892, next_change: 166892, remaining: 12359, sent_for_change: false },
  { id: '37', unit_id: '24', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 155996, next_change: 170996, remaining: 14092, sent_for_change: false },
  { id: '38', unit_id: '25', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 146100, next_change: 161100, remaining: 1825, sent_for_change: false },
  { id: '39', unit_id: '26', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 150204, next_change: 165204, remaining: 3558, sent_for_change: false },
  { id: '40', unit_id: '27', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 154308, next_change: 169308, remaining: 5291, sent_for_change: false },
  { id: '41', unit_id: '28', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 158412, next_change: 173412, remaining: 7024, sent_for_change: false },
  { id: '42', unit_id: '29', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 162516, next_change: 177516, remaining: 8757, sent_for_change: false },
  { id: '43', unit_id: '30', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 166620, next_change: 181620, remaining: 10490, sent_for_change: false },
  { id: '44', unit_id: '31', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 170724, next_change: 185724, remaining: 12223, sent_for_change: false },
  { id: '45', unit_id: '32', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 174828, next_change: 189828, remaining: 13956, sent_for_change: false },
  { id: '46', unit_id: '33', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 164932, next_change: 179932, remaining: 1689, sent_for_change: true },
  { id: '47', unit_id: '34', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 169036, next_change: 184036, remaining: 3422, sent_for_change: false },
  { id: '48', unit_id: '35', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 173140, next_change: 188140, remaining: 5155, sent_for_change: false },
  { id: '49', unit_id: '36', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 177244, next_change: 192244, remaining: 6888, sent_for_change: false },
  { id: '50', unit_id: '37', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 181348, next_change: 196348, remaining: 8621, sent_for_change: false },
  { id: '51', unit_id: '38', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 185452, next_change: 200452, remaining: 10354, sent_for_change: false },
  { id: '52', unit_id: '39', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 189556, next_change: 204556, remaining: 12087, sent_for_change: false },
  { id: '53', unit_id: '40', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 193660, next_change: 208660, remaining: 13820, sent_for_change: false },
  { id: '54', unit_id: '41', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 183764, next_change: 198764, remaining: 1553, sent_for_change: false },
  { id: '55', unit_id: '42', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 187868, next_change: 202868, remaining: 3286, sent_for_change: false },
  { id: '56', unit_id: '43', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 191972, next_change: 206972, remaining: 5019, sent_for_change: false },
  { id: '57', unit_id: '44', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 196076, next_change: 211076, remaining: 6752, sent_for_change: false },
  { id: '58', unit_id: '45', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 200180, next_change: 215180, remaining: 8485, sent_for_change: false },
  { id: '59', unit_id: '46', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 204284, next_change: 219284, remaining: 10218, sent_for_change: false },
  { id: '60', unit_id: '47', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 208388, next_change: 223388, remaining: 11951, sent_for_change: false },
  { id: '61', unit_id: '48', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 212492, next_change: 227492, remaining: 13684, sent_for_change: false },
  { id: '62', unit_id: '49', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 202596, next_change: 217596, remaining: 1417, sent_for_change: false },
  { id: '63', unit_id: '50', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 206700, next_change: 221700, remaining: 3150, sent_for_change: false },
  { id: '64', unit_id: '51', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 210804, next_change: 225804, remaining: 4883, sent_for_change: false },
  { id: '65', unit_id: '52', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 214908, next_change: 229908, remaining: 6616, sent_for_change: false },
  { id: '66', unit_id: '53', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 219012, next_change: 234012, remaining: 8349, sent_for_change: false },
  { id: '67', unit_id: '54', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 223116, next_change: 238116, remaining: 10082, sent_for_change: false },
  { id: '68', unit_id: '55', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 227220, next_change: 242220, remaining: 11815, sent_for_change: false },
  { id: '69', unit_id: '56', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 231324, next_change: 246324, remaining: 13548, sent_for_change: false },
  { id: '70', unit_id: '57', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 221428, next_change: 236428, remaining: 1281, sent_for_change: true },
  { id: '71', unit_id: '58', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 225532, next_change: 240532, remaining: 3014, sent_for_change: false },
  { id: '72', unit_id: '59', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 229636, next_change: 244636, remaining: 4747, sent_for_change: false },
  { id: '73', unit_id: '60', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 233740, next_change: 248740, remaining: 6480, sent_for_change: false },
  { id: '74', unit_id: '61', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 237844, next_change: 252844, remaining: 8213, sent_for_change: false },
  { id: '75', unit_id: '62', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 241948, next_change: 256948, remaining: 9946, sent_for_change: false },
  { id: '76', unit_id: '63', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 246052, next_change: 261052, remaining: 11679, sent_for_change: false },
  { id: '77', unit_id: '64', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 250156, next_change: 265156, remaining: 13412, sent_for_change: false },
  { id: '78', unit_id: '65', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 240260, next_change: 255260, remaining: 1145, sent_for_change: false },
  { id: '79', unit_id: '66', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 244364, next_change: 259364, remaining: 2878, sent_for_change: false },
  { id: '80', unit_id: '67', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 248468, next_change: 263468, remaining: 4611, sent_for_change: false },
  { id: '81', unit_id: '68', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 252572, next_change: 267572, remaining: 6344, sent_for_change: false },
  { id: '82', unit_id: '69', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 256676, next_change: 271676, remaining: 8077, sent_for_change: false },
  { id: '83', unit_id: '70', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 260780, next_change: 275780, remaining: 9810, sent_for_change: false },
  { id: '84', unit_id: '71', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 264884, next_change: 279884, remaining: 11543, sent_for_change: false },
  { id: '85', unit_id: '72', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 268988, next_change: 283988, remaining: 13276, sent_for_change: false },
  { id: '86', unit_id: '73', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 259092, next_change: 274092, remaining: 1009, sent_for_change: false },
  { id: '87', unit_id: '74', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 263196, next_change: 278196, remaining: 2742, sent_for_change: false },
  { id: '88', unit_id: '75', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 267300, next_change: 282300, remaining: 4475, sent_for_change: false },
  { id: '89', unit_id: '76', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 271404, next_change: 286404, remaining: 6208, sent_for_change: false },
  { id: '90', unit_id: '77', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 275508, next_change: 290508, remaining: 7941, sent_for_change: false },
  { id: '91', unit_id: '78', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 279612, next_change: 294612, remaining: 9674, sent_for_change: false },
  { id: '92', unit_id: '79', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 283716, next_change: 298716, remaining: 11407, sent_for_change: false },
  { id: '93', unit_id: '80', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 287820, next_change: 302820, remaining: 13140, sent_for_change: false },
  { id: '94', unit_id: '81', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 277924, next_change: 292924, remaining: 873, sent_for_change: true },
  { id: '95', unit_id: '82', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 282028, next_change: 297028, remaining: 2606, sent_for_change: false },
  { id: '96', unit_id: '83', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 286132, next_change: 301132, remaining: 4339, sent_for_change: false },
  { id: '97', unit_id: '84', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 290236, next_change: 305236, remaining: 6072, sent_for_change: false },
  { id: '98', unit_id: '85', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 294340, next_change: 309340, remaining: 7805, sent_for_change: false },
  { id: '99', unit_id: '86', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 298444, next_change: 313444, remaining: 9538, sent_for_change: false },
  { id: '100', unit_id: '87', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 302548, next_change: 317548, remaining: 11271, sent_for_change: false },
  { id: '101', unit_id: '88', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 306652, next_change: 321652, remaining: 13004, sent_for_change: false },
  { id: '102', unit_id: '89', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 296756, next_change: 311756, remaining: 737, sent_for_change: false },
  { id: '103', unit_id: '90', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 300860, next_change: 315860, remaining: 2470, sent_for_change: false },
  { id: '104', unit_id: '91', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 304964, next_change: 319964, remaining: 4203, sent_for_change: false },
  { id: '105', unit_id: '92', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 309068, next_change: 324068, remaining: 5936, sent_for_change: false },
  { id: '106', unit_id: '93', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 313172, next_change: 328172, remaining: 7669, sent_for_change: false },
  { id: '107', unit_id: '94', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 317276, next_change: 332276, remaining: 9402, sent_for_change: false },
  { id: '108', unit_id: '95', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 321380, next_change: 336380, remaining: 11135, sent_for_change: false },
  { id: '109', unit_id: '96', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 325484, next_change: 340484, remaining: 12868, sent_for_change: false },
  { id: '110', unit_id: '97', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 315588, next_change: 330588, remaining: 601, sent_for_change: false },
  { id: '111', unit_id: '98', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 319692, next_change: 334692, remaining: 2334, sent_for_change: false },
  { id: '112', unit_id: '99', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 323796, next_change: 338796, remaining: 4067, sent_for_change: false },
  { id: '113', unit_id: '100', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 327900, next_change: 342900, remaining: 5800, sent_for_change: false },
  { id: '114', unit_id: '101', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 332004, next_change: 347004, remaining: 7533, sent_for_change: false },
  { id: '115', unit_id: '102', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 336108, next_change: 351108, remaining: 9266, sent_for_change: false },
  { id: '116', unit_id: '103', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 340212, next_change: 355212, remaining: 10999, sent_for_change: false },
  { id: '117', unit_id: '104', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 344316, next_change: 359316, remaining: 12732, sent_for_change: false },
  { id: '118', unit_id: '105', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 348420, next_change: 363420, remaining: 14465, sent_for_change: false },
  { id: '119', unit_id: '106', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 88524, next_change: 103524, remaining: 2198, sent_for_change: false },
  { id: '120', unit_id: '107', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 92628, next_change: 107628, remaining: 3931, sent_for_change: false },
  { id: '121', unit_id: '108', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 96732, next_change: 111732, remaining: 5664, sent_for_change: false },
  { id: '122', unit_id: '109', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 100836, next_change: 115836, remaining: 7397, sent_for_change: false },
  { id: '123', unit_id: '110', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 104940, next_change: 119940, remaining: 9130, sent_for_change: false },
  { id: '124', unit_id: '111', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 109044, next_change: 124044, remaining: 10863, sent_for_change: false },
  { id: '125', unit_id: '112', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 113148, next_change: 128148, remaining: 12596, sent_for_change: false },
  { id: '126', unit_id: '113', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 117252, next_change: 132252, remaining: 14329, sent_for_change: false },
  { id: '127', unit_id: '114', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 107356, next_change: 122356, remaining: 2062, sent_for_change: false },
  { id: '128', unit_id: '115', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 111460, next_change: 126460, remaining: 3795, sent_for_change: false },
  { id: '129', unit_id: '116', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 115564, next_change: 130564, remaining: 5528, sent_for_change: false },
  { id: '130', unit_id: '117', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 119668, next_change: 134668, remaining: 7261, sent_for_change: false },
  { id: '131', unit_id: '118', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 123772, next_change: 138772, remaining: 8994, sent_for_change: false },
  { id: '132', unit_id: '119', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 127876, next_change: 142876, remaining: 10727, sent_for_change: false },
  { id: '133', unit_id: '120', oil_type: 'Engine Oil 15W-40', change_interval: 15000, last_changed: 131980, next_change: 146980, remaining: 12460, sent_for_change: false },
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
  { id: '21', unit_id: '11', doc_number: 'DOT-2024-1111', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 157 },
  { id: '22', unit_id: '12', doc_number: 'DOT-2024-1112', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 294 },
  { id: '23', unit_id: '13', doc_number: 'DOT-2024-1113', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 101 },
  { id: '24', unit_id: '14', doc_number: 'DOT-2024-1114', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 238 },
  { id: '25', unit_id: '15', doc_number: 'DOT-2024-1115', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 45 },
  { id: '26', unit_id: '16', doc_number: 'DOT-2024-1116', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 182 },
  { id: '27', unit_id: '17', doc_number: 'DOT-2024-1117', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: -11 },
  { id: '28', unit_id: '18', doc_number: 'DOT-2024-1118', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 126 },
  { id: '29', unit_id: '19', doc_number: 'DOT-2024-1119', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 263 },
  { id: '30', unit_id: '20', doc_number: 'DOT-2024-1120', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 70 },
  { id: '31', unit_id: '21', doc_number: 'DOT-2024-1121', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 207 },
  { id: '32', unit_id: '22', doc_number: 'DOT-2024-1122', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 14 },
  { id: '33', unit_id: '23', doc_number: 'DOT-2024-1123', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 151 },
  { id: '34', unit_id: '24', doc_number: 'DOT-2024-1124', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 288 },
  { id: '35', unit_id: '25', doc_number: 'DOT-2024-1125', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 95 },
  { id: '36', unit_id: '26', doc_number: 'DOT-2024-1126', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 232 },
  { id: '37', unit_id: '27', doc_number: 'DOT-2024-1127', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 39 },
  { id: '38', unit_id: '28', doc_number: 'DOT-2024-1128', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 176 },
  { id: '39', unit_id: '29', doc_number: 'DOT-2024-1129', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: -17 },
  { id: '40', unit_id: '30', doc_number: 'DOT-2024-1130', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 120 },
  { id: '41', unit_id: '31', doc_number: 'DOT-2024-1131', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 257 },
  { id: '42', unit_id: '32', doc_number: 'DOT-2024-1132', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 64 },
  { id: '43', unit_id: '33', doc_number: 'DOT-2024-1133', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 201 },
  { id: '44', unit_id: '34', doc_number: 'DOT-2024-1134', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 8 },
  { id: '45', unit_id: '35', doc_number: 'DOT-2024-1135', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 145 },
  { id: '46', unit_id: '36', doc_number: 'DOT-2024-1136', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 282 },
  { id: '47', unit_id: '37', doc_number: 'DOT-2024-1137', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 89 },
  { id: '48', unit_id: '38', doc_number: 'DOT-2024-1138', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 226 },
  { id: '49', unit_id: '39', doc_number: 'DOT-2024-1139', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 33 },
  { id: '50', unit_id: '40', doc_number: 'DOT-2024-1140', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 170 },
  { id: '51', unit_id: '41', doc_number: 'DOT-2024-1141', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: -23 },
  { id: '52', unit_id: '42', doc_number: 'DOT-2024-1142', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 114 },
  { id: '53', unit_id: '43', doc_number: 'DOT-2024-1143', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 251 },
  { id: '54', unit_id: '44', doc_number: 'DOT-2024-1144', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 58 },
  { id: '55', unit_id: '45', doc_number: 'DOT-2024-1145', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 195 },
  { id: '56', unit_id: '46', doc_number: 'DOT-2024-1146', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 2 },
  { id: '57', unit_id: '47', doc_number: 'DOT-2024-1147', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 139 },
  { id: '58', unit_id: '48', doc_number: 'DOT-2024-1148', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 276 },
  { id: '59', unit_id: '49', doc_number: 'DOT-2024-1149', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 83 },
  { id: '60', unit_id: '50', doc_number: 'DOT-2024-1150', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 220 },
  { id: '61', unit_id: '51', doc_number: 'DOT-2024-1151', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 27 },
  { id: '62', unit_id: '52', doc_number: 'DOT-2024-1152', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 164 },
  { id: '63', unit_id: '53', doc_number: 'DOT-2024-1153', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: -29 },
  { id: '64', unit_id: '54', doc_number: 'DOT-2024-1154', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 108 },
  { id: '65', unit_id: '55', doc_number: 'DOT-2024-1155', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 245 },
  { id: '66', unit_id: '56', doc_number: 'DOT-2024-1156', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 52 },
  { id: '67', unit_id: '57', doc_number: 'DOT-2024-1157', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 189 },
  { id: '68', unit_id: '58', doc_number: 'DOT-2024-1158', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: -4 },
  { id: '69', unit_id: '59', doc_number: 'DOT-2024-1159', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 133 },
  { id: '70', unit_id: '60', doc_number: 'DOT-2024-1160', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 270 },
  { id: '71', unit_id: '61', doc_number: 'DOT-2024-1161', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 77 },
  { id: '72', unit_id: '62', doc_number: 'DOT-2024-1162', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 214 },
  { id: '73', unit_id: '63', doc_number: 'DOT-2024-1163', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 21 },
  { id: '74', unit_id: '64', doc_number: 'DOT-2024-1164', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 158 },
  { id: '75', unit_id: '65', doc_number: 'DOT-2024-1165', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 295 },
  { id: '76', unit_id: '66', doc_number: 'DOT-2024-1166', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 102 },
  { id: '77', unit_id: '67', doc_number: 'DOT-2024-1167', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 239 },
  { id: '78', unit_id: '68', doc_number: 'DOT-2024-1168', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 46 },
  { id: '79', unit_id: '69', doc_number: 'DOT-2024-1169', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 183 },
  { id: '80', unit_id: '70', doc_number: 'DOT-2024-1170', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: -10 },
  { id: '81', unit_id: '71', doc_number: 'DOT-2024-1171', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 127 },
  { id: '82', unit_id: '72', doc_number: 'DOT-2024-1172', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 264 },
  { id: '83', unit_id: '73', doc_number: 'DOT-2024-1173', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 71 },
  { id: '84', unit_id: '74', doc_number: 'DOT-2024-1174', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 208 },
  { id: '85', unit_id: '75', doc_number: 'DOT-2024-1175', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 15 },
  { id: '86', unit_id: '76', doc_number: 'DOT-2024-1176', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 152 },
  { id: '87', unit_id: '77', doc_number: 'DOT-2024-1177', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 289 },
  { id: '88', unit_id: '78', doc_number: 'DOT-2024-1178', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 96 },
  { id: '89', unit_id: '79', doc_number: 'DOT-2024-1179', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 233 },
  { id: '90', unit_id: '80', doc_number: 'DOT-2024-1180', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 40 },
  { id: '91', unit_id: '81', doc_number: 'DOT-2024-1181', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 177 },
  { id: '92', unit_id: '82', doc_number: 'DOT-2024-1182', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: -16 },
  { id: '93', unit_id: '83', doc_number: 'DOT-2024-1183', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 121 },
  { id: '94', unit_id: '84', doc_number: 'DOT-2024-1184', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 258 },
  { id: '95', unit_id: '85', doc_number: 'DOT-2024-1185', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 65 },
  { id: '96', unit_id: '86', doc_number: 'DOT-2024-1186', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 202 },
  { id: '97', unit_id: '87', doc_number: 'DOT-2024-1187', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 9 },
  { id: '98', unit_id: '88', doc_number: 'DOT-2024-1188', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 146 },
  { id: '99', unit_id: '89', doc_number: 'DOT-2024-1189', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 283 },
  { id: '100', unit_id: '90', doc_number: 'DOT-2024-1190', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 90 },
  { id: '101', unit_id: '91', doc_number: 'DOT-2024-1191', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 227 },
  { id: '102', unit_id: '92', doc_number: 'DOT-2024-1192', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 34 },
  { id: '103', unit_id: '93', doc_number: 'DOT-2024-1193', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 171 },
  { id: '104', unit_id: '94', doc_number: 'DOT-2024-1194', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: -22 },
  { id: '105', unit_id: '95', doc_number: 'DOT-2024-1195', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 115 },
  { id: '106', unit_id: '96', doc_number: 'DOT-2024-1196', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 252 },
  { id: '107', unit_id: '97', doc_number: 'DOT-2024-1197', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 59 },
  { id: '108', unit_id: '98', doc_number: 'DOT-2024-1198', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 196 },
  { id: '109', unit_id: '99', doc_number: 'DOT-2024-1199', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 3 },
  { id: '110', unit_id: '100', doc_number: 'DOT-2024-1200', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 140 },
  { id: '111', unit_id: '101', doc_number: 'DOT-2024-1201', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 277 },
  { id: '112', unit_id: '102', doc_number: 'DOT-2024-1202', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 84 },
  { id: '113', unit_id: '103', doc_number: 'DOT-2024-1203', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 221 },
  { id: '114', unit_id: '104', doc_number: 'DOT-2024-1204', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 28 },
  { id: '115', unit_id: '105', doc_number: 'DOT-2024-1205', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 165 },
  { id: '116', unit_id: '106', doc_number: 'DOT-2024-1206', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: -28 },
  { id: '117', unit_id: '107', doc_number: 'DOT-2024-1207', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 109 },
  { id: '118', unit_id: '108', doc_number: 'DOT-2024-1208', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 246 },
  { id: '119', unit_id: '109', doc_number: 'DOT-2024-1209', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 53 },
  { id: '120', unit_id: '110', doc_number: 'DOT-2024-1210', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 190 },
  { id: '121', unit_id: '111', doc_number: 'DOT-2024-1211', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: -3 },
  { id: '122', unit_id: '112', doc_number: 'DOT-2024-1212', inspection_date: '2025-05-15', expiry_date: '2026-05-15', days_remaining: 134 },
  { id: '123', unit_id: '113', doc_number: 'DOT-2024-1213', inspection_date: '2025-06-15', expiry_date: '2026-06-15', days_remaining: 271 },
  { id: '124', unit_id: '114', doc_number: 'DOT-2024-1214', inspection_date: '2025-07-15', expiry_date: '2026-07-15', days_remaining: 78 },
  { id: '125', unit_id: '115', doc_number: 'DOT-2024-1215', inspection_date: '2025-08-15', expiry_date: '2026-08-15', days_remaining: 215 },
  { id: '126', unit_id: '116', doc_number: 'DOT-2024-1216', inspection_date: '2025-09-15', expiry_date: '2026-09-15', days_remaining: 22 },
  { id: '127', unit_id: '117', doc_number: 'DOT-2024-1217', inspection_date: '2025-01-15', expiry_date: '2026-01-15', days_remaining: 159 },
  { id: '128', unit_id: '118', doc_number: 'DOT-2024-1218', inspection_date: '2025-02-15', expiry_date: '2026-02-15', days_remaining: 296 },
  { id: '129', unit_id: '119', doc_number: 'DOT-2024-1219', inspection_date: '2025-03-15', expiry_date: '2026-03-15', days_remaining: 103 },
  { id: '130', unit_id: '120', doc_number: 'DOT-2024-1220', inspection_date: '2025-04-15', expiry_date: '2026-04-15', days_remaining: 240 },
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
  { id: '21', unit_id: '11', state: 'CO', plate_number: 'TRK-4011', doc_number: 'REG-CO-111', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 209 },
  { id: '22', unit_id: '12', state: 'WA', plate_number: 'TRK-4012', doc_number: 'REG-WA-112', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 288 },
  { id: '23', unit_id: '13', state: 'OR', plate_number: 'TRK-4013', doc_number: 'REG-OR-113', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 47 },
  { id: '24', unit_id: '14', state: 'TN', plate_number: 'TRK-4014', doc_number: 'REG-TN-114', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 126 },
  { id: '25', unit_id: '15', state: 'TX', plate_number: 'TRK-4015', doc_number: 'REG-TX-115', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 205 },
  { id: '26', unit_id: '16', state: 'CA', plate_number: 'TRK-4016', doc_number: 'REG-CA-116', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 284 },
  { id: '27', unit_id: '17', state: 'IL', plate_number: 'TRK-4017', doc_number: 'REG-IL-117', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 43 },
  { id: '28', unit_id: '18', state: 'GA', plate_number: 'TRK-4018', doc_number: 'REG-GA-118', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 122 },
  { id: '29', unit_id: '19', state: 'FL', plate_number: 'TRK-4019', doc_number: 'REG-FL-119', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 201 },
  { id: '30', unit_id: '20', state: 'OH', plate_number: 'TRK-4020', doc_number: 'REG-OH-120', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 280 },
  { id: '31', unit_id: '21', state: 'PA', plate_number: 'TRK-4021', doc_number: 'REG-PA-121', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 39 },
  { id: '32', unit_id: '22', state: 'NJ', plate_number: 'TRK-4022', doc_number: 'REG-NJ-122', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 118 },
  { id: '33', unit_id: '23', state: 'NY', plate_number: 'TRK-4023', doc_number: 'REG-NY-123', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 197 },
  { id: '34', unit_id: '24', state: 'MI', plate_number: 'TRK-4024', doc_number: 'REG-MI-124', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 276 },
  { id: '35', unit_id: '25', state: 'AZ', plate_number: 'TRK-4025', doc_number: 'REG-AZ-125', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 35 },
  { id: '36', unit_id: '26', state: 'CO', plate_number: 'TRK-4026', doc_number: 'REG-CO-126', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 114 },
  { id: '37', unit_id: '27', state: 'WA', plate_number: 'TRK-4027', doc_number: 'REG-WA-127', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 193 },
  { id: '38', unit_id: '28', state: 'OR', plate_number: 'TRK-4028', doc_number: 'REG-OR-128', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 272 },
  { id: '39', unit_id: '29', state: 'TN', plate_number: 'TRK-4029', doc_number: 'REG-TN-129', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 31 },
  { id: '40', unit_id: '30', state: 'TX', plate_number: 'TRK-4030', doc_number: 'REG-TX-130', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 110 },
  { id: '41', unit_id: '31', state: 'CA', plate_number: 'TRK-4031', doc_number: 'REG-CA-131', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 189 },
  { id: '42', unit_id: '32', state: 'IL', plate_number: 'TRK-4032', doc_number: 'REG-IL-132', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 268 },
  { id: '43', unit_id: '33', state: 'GA', plate_number: 'TRK-4033', doc_number: 'REG-GA-133', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 27 },
  { id: '44', unit_id: '34', state: 'FL', plate_number: 'TRK-4034', doc_number: 'REG-FL-134', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 106 },
  { id: '45', unit_id: '35', state: 'OH', plate_number: 'TRK-4035', doc_number: 'REG-OH-135', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 185 },
  { id: '46', unit_id: '36', state: 'PA', plate_number: 'TRK-4036', doc_number: 'REG-PA-136', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 264 },
  { id: '47', unit_id: '37', state: 'NJ', plate_number: 'TRK-4037', doc_number: 'REG-NJ-137', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 23 },
  { id: '48', unit_id: '38', state: 'NY', plate_number: 'TRK-4038', doc_number: 'REG-NY-138', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 102 },
  { id: '49', unit_id: '39', state: 'MI', plate_number: 'TRK-4039', doc_number: 'REG-MI-139', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 181 },
  { id: '50', unit_id: '40', state: 'AZ', plate_number: 'TRK-4040', doc_number: 'REG-AZ-140', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 260 },
  { id: '51', unit_id: '41', state: 'CO', plate_number: 'TRK-4041', doc_number: 'REG-CO-141', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 19 },
  { id: '52', unit_id: '42', state: 'WA', plate_number: 'TRK-4042', doc_number: 'REG-WA-142', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 98 },
  { id: '53', unit_id: '43', state: 'OR', plate_number: 'TRK-4043', doc_number: 'REG-OR-143', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 177 },
  { id: '54', unit_id: '44', state: 'TN', plate_number: 'TRK-4044', doc_number: 'REG-TN-144', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 256 },
  { id: '55', unit_id: '45', state: 'TX', plate_number: 'TRK-4045', doc_number: 'REG-TX-145', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 15 },
  { id: '56', unit_id: '46', state: 'CA', plate_number: 'TRK-4046', doc_number: 'REG-CA-146', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 94 },
  { id: '57', unit_id: '47', state: 'IL', plate_number: 'TRK-4047', doc_number: 'REG-IL-147', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 173 },
  { id: '58', unit_id: '48', state: 'GA', plate_number: 'TRK-4048', doc_number: 'REG-GA-148', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 252 },
  { id: '59', unit_id: '49', state: 'FL', plate_number: 'TRK-4049', doc_number: 'REG-FL-149', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 11 },
  { id: '60', unit_id: '50', state: 'OH', plate_number: 'TRK-4050', doc_number: 'REG-OH-150', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 90 },
  { id: '61', unit_id: '51', state: 'PA', plate_number: 'TRK-4051', doc_number: 'REG-PA-151', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 169 },
  { id: '62', unit_id: '52', state: 'NJ', plate_number: 'TRK-4052', doc_number: 'REG-NJ-152', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 248 },
  { id: '63', unit_id: '53', state: 'NY', plate_number: 'TRK-4053', doc_number: 'REG-NY-153', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 7 },
  { id: '64', unit_id: '54', state: 'MI', plate_number: 'TRK-4054', doc_number: 'REG-MI-154', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 86 },
  { id: '65', unit_id: '55', state: 'AZ', plate_number: 'TRK-4055', doc_number: 'REG-AZ-155', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 165 },
  { id: '66', unit_id: '56', state: 'CO', plate_number: 'TRK-4056', doc_number: 'REG-CO-156', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 244 },
  { id: '67', unit_id: '57', state: 'WA', plate_number: 'TRK-4057', doc_number: 'REG-WA-157', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 3 },
  { id: '68', unit_id: '58', state: 'OR', plate_number: 'TRK-4058', doc_number: 'REG-OR-158', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 82 },
  { id: '69', unit_id: '59', state: 'TN', plate_number: 'TRK-4059', doc_number: 'REG-TN-159', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 161 },
  { id: '70', unit_id: '60', state: 'TX', plate_number: 'TRK-4060', doc_number: 'REG-TX-160', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 240 },
  { id: '71', unit_id: '61', state: 'CA', plate_number: 'TRK-4061', doc_number: 'REG-CA-161', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: -1 },
  { id: '72', unit_id: '62', state: 'IL', plate_number: 'TRK-4062', doc_number: 'REG-IL-162', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 78 },
  { id: '73', unit_id: '63', state: 'GA', plate_number: 'TRK-4063', doc_number: 'REG-GA-163', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 157 },
  { id: '74', unit_id: '64', state: 'FL', plate_number: 'TRK-4064', doc_number: 'REG-FL-164', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 236 },
  { id: '75', unit_id: '65', state: 'OH', plate_number: 'TRK-4065', doc_number: 'REG-OH-165', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: -5 },
  { id: '76', unit_id: '66', state: 'PA', plate_number: 'TRK-4066', doc_number: 'REG-PA-166', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 74 },
  { id: '77', unit_id: '67', state: 'NJ', plate_number: 'TRK-4067', doc_number: 'REG-NJ-167', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 153 },
  { id: '78', unit_id: '68', state: 'NY', plate_number: 'TRK-4068', doc_number: 'REG-NY-168', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 232 },
  { id: '79', unit_id: '69', state: 'MI', plate_number: 'TRK-4069', doc_number: 'REG-MI-169', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: -9 },
  { id: '80', unit_id: '70', state: 'AZ', plate_number: 'TRK-4070', doc_number: 'REG-AZ-170', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 70 },
  { id: '81', unit_id: '71', state: 'CO', plate_number: 'TRK-4071', doc_number: 'REG-CO-171', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 149 },
  { id: '82', unit_id: '72', state: 'WA', plate_number: 'TRK-4072', doc_number: 'REG-WA-172', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 228 },
  { id: '83', unit_id: '73', state: 'OR', plate_number: 'TRK-4073', doc_number: 'REG-OR-173', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: -13 },
  { id: '84', unit_id: '74', state: 'TN', plate_number: 'TRK-4074', doc_number: 'REG-TN-174', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 66 },
  { id: '85', unit_id: '75', state: 'TX', plate_number: 'TRK-4075', doc_number: 'REG-TX-175', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 145 },
  { id: '86', unit_id: '76', state: 'CA', plate_number: 'TRK-4076', doc_number: 'REG-CA-176', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 224 },
  { id: '87', unit_id: '77', state: 'IL', plate_number: 'TRK-4077', doc_number: 'REG-IL-177', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: -17 },
  { id: '88', unit_id: '78', state: 'GA', plate_number: 'TRK-4078', doc_number: 'REG-GA-178', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 62 },
  { id: '89', unit_id: '79', state: 'FL', plate_number: 'TRK-4079', doc_number: 'REG-FL-179', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 141 },
  { id: '90', unit_id: '80', state: 'OH', plate_number: 'TRK-4080', doc_number: 'REG-OH-180', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 220 },
  { id: '91', unit_id: '81', state: 'PA', plate_number: 'TRK-4081', doc_number: 'REG-PA-181', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 299 },
  { id: '92', unit_id: '82', state: 'NJ', plate_number: 'TRK-4082', doc_number: 'REG-NJ-182', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 58 },
  { id: '93', unit_id: '83', state: 'NY', plate_number: 'TRK-4083', doc_number: 'REG-NY-183', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 137 },
  { id: '94', unit_id: '84', state: 'MI', plate_number: 'TRK-4084', doc_number: 'REG-MI-184', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 216 },
  { id: '95', unit_id: '85', state: 'AZ', plate_number: 'TRK-4085', doc_number: 'REG-AZ-185', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 295 },
  { id: '96', unit_id: '86', state: 'CO', plate_number: 'TRK-4086', doc_number: 'REG-CO-186', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 54 },
  { id: '97', unit_id: '87', state: 'WA', plate_number: 'TRK-4087', doc_number: 'REG-WA-187', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 133 },
  { id: '98', unit_id: '88', state: 'OR', plate_number: 'TRK-4088', doc_number: 'REG-OR-188', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 212 },
  { id: '99', unit_id: '89', state: 'TN', plate_number: 'TRK-4089', doc_number: 'REG-TN-189', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 291 },
  { id: '100', unit_id: '90', state: 'TX', plate_number: 'TRK-4090', doc_number: 'REG-TX-190', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 50 },
  { id: '101', unit_id: '91', state: 'CA', plate_number: 'TRK-4091', doc_number: 'REG-CA-191', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 129 },
  { id: '102', unit_id: '92', state: 'IL', plate_number: 'TRK-4092', doc_number: 'REG-IL-192', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 208 },
  { id: '103', unit_id: '93', state: 'GA', plate_number: 'TRK-4093', doc_number: 'REG-GA-193', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 287 },
  { id: '104', unit_id: '94', state: 'FL', plate_number: 'TRK-4094', doc_number: 'REG-FL-194', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 46 },
  { id: '105', unit_id: '95', state: 'OH', plate_number: 'TRK-4095', doc_number: 'REG-OH-195', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 125 },
  { id: '106', unit_id: '96', state: 'PA', plate_number: 'TRK-4096', doc_number: 'REG-PA-196', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 204 },
  { id: '107', unit_id: '97', state: 'NJ', plate_number: 'TRK-4097', doc_number: 'REG-NJ-197', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 283 },
  { id: '108', unit_id: '98', state: 'NY', plate_number: 'TRK-4098', doc_number: 'REG-NY-198', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 42 },
  { id: '109', unit_id: '99', state: 'MI', plate_number: 'TRK-4099', doc_number: 'REG-MI-199', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 121 },
  { id: '110', unit_id: '100', state: 'AZ', plate_number: 'TRK-4100', doc_number: 'REG-AZ-200', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 200 },
  { id: '111', unit_id: '101', state: 'CO', plate_number: 'TRK-4101', doc_number: 'REG-CO-201', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 279 },
  { id: '112', unit_id: '102', state: 'WA', plate_number: 'TRK-4102', doc_number: 'REG-WA-202', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 38 },
  { id: '113', unit_id: '103', state: 'OR', plate_number: 'TRK-4103', doc_number: 'REG-OR-203', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 117 },
  { id: '114', unit_id: '104', state: 'TN', plate_number: 'TRK-4104', doc_number: 'REG-TN-204', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 196 },
  { id: '115', unit_id: '105', state: 'TX', plate_number: 'TRK-4105', doc_number: 'REG-TX-205', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 275 },
  { id: '116', unit_id: '106', state: 'CA', plate_number: 'TRK-4106', doc_number: 'REG-CA-206', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 34 },
  { id: '117', unit_id: '107', state: 'IL', plate_number: 'TRK-4107', doc_number: 'REG-IL-207', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 113 },
  { id: '118', unit_id: '108', state: 'GA', plate_number: 'TRK-4108', doc_number: 'REG-GA-208', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 192 },
  { id: '119', unit_id: '109', state: 'FL', plate_number: 'TRK-4109', doc_number: 'REG-FL-209', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 271 },
  { id: '120', unit_id: '110', state: 'OH', plate_number: 'TRK-4110', doc_number: 'REG-OH-210', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 30 },
  { id: '121', unit_id: '111', state: 'PA', plate_number: 'TRK-4111', doc_number: 'REG-PA-211', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 109 },
  { id: '122', unit_id: '112', state: 'NJ', plate_number: 'TRK-4112', doc_number: 'REG-NJ-212', reg_date: '2025-05-10', expiry_date: '2026-05-10', days_remaining: 188 },
  { id: '123', unit_id: '113', state: 'NY', plate_number: 'TRK-4113', doc_number: 'REG-NY-213', reg_date: '2025-06-10', expiry_date: '2026-06-10', days_remaining: 267 },
  { id: '124', unit_id: '114', state: 'MI', plate_number: 'TRK-4114', doc_number: 'REG-MI-214', reg_date: '2025-07-10', expiry_date: '2026-07-10', days_remaining: 26 },
  { id: '125', unit_id: '115', state: 'AZ', plate_number: 'TRK-4115', doc_number: 'REG-AZ-215', reg_date: '2025-08-10', expiry_date: '2026-08-10', days_remaining: 105 },
  { id: '126', unit_id: '116', state: 'CO', plate_number: 'TRK-4116', doc_number: 'REG-CO-216', reg_date: '2025-09-10', expiry_date: '2026-09-10', days_remaining: 184 },
  { id: '127', unit_id: '117', state: 'WA', plate_number: 'TRK-4117', doc_number: 'REG-WA-217', reg_date: '2025-01-10', expiry_date: '2026-01-10', days_remaining: 263 },
  { id: '128', unit_id: '118', state: 'OR', plate_number: 'TRK-4118', doc_number: 'REG-OR-218', reg_date: '2025-02-10', expiry_date: '2026-02-10', days_remaining: 22 },
  { id: '129', unit_id: '119', state: 'TN', plate_number: 'TRK-4119', doc_number: 'REG-TN-219', reg_date: '2025-03-10', expiry_date: '2026-03-10', days_remaining: 101 },
  { id: '130', unit_id: '120', state: 'TX', plate_number: 'TRK-4120', doc_number: 'REG-TX-220', reg_date: '2025-04-10', expiry_date: '2026-04-10', days_remaining: 180 },
];

export const repairs: Repair[] = [
  { id: '1', unit_id: '1', date: '2026-03-15', invoice: 'INV-2401', service: 'Brake Pad Replacement', category: 'Brakes', shop: 'FleetPro Service', cost: 1850, status: 'working' },
  { id: '2', unit_id: '1', date: '2026-02-20', invoice: 'INV-2398', service: 'Oil Leak Repair', category: 'Engine', shop: 'TruckCare Center', cost: 2400, status: 'working' },
  { id: '3', unit_id: '2', date: '2026-03-10', invoice: 'INV-2399', service: 'Tire Rotation & Balance', category: 'Tires', shop: 'TireMax', cost: 680, status: 'in_repair' },
  { id: '4', unit_id: '3', date: '2026-03-22', invoice: 'INV-2402', service: 'Suspension Overhaul', category: 'Suspension', shop: 'Heavy Duty Repair', cost: 4500, status: 'in_repair' },
  { id: '5', unit_id: '3', date: '2026-01-15', invoice: 'INV-2390', service: 'Electrical Wiring Repair', category: 'Electrical', shop: 'AutoElectric Pro', cost: 1200, status: 'working' },
  { id: '6', unit_id: '4', date: '2026-03-05', invoice: 'INV-2397', service: 'AC Compressor Replace', category: 'HVAC', shop: 'CoolAir Trucks', cost: 3200, status: 'sent' },
  { id: '7', unit_id: '5', date: '2026-02-28', invoice: 'INV-2396', service: 'Transmission Service', category: 'Transmission', shop: 'GearBox Specialists', cost: 5600, status: 'needs_repair' },
  { id: '8', unit_id: '6', date: '2026-03-18', invoice: 'INV-2400', service: 'Front Brake Drums', category: 'Brakes', shop: 'FleetPro Service', cost: 2100, status: 'sent' },
  { id: '9', unit_id: '8', date: '2026-03-01', invoice: 'INV-2395', service: 'DPF Cleaning', category: 'Engine', shop: 'TruckCare Center', cost: 900, status: 'working' },
  { id: '10', unit_id: '9', date: '2026-02-10', invoice: 'INV-2393', service: 'Leaf Spring Replace', category: 'Suspension', shop: 'Heavy Duty Repair', cost: 3800, status: 'needs_repair' },
  { id: '11', unit_id: '10', date: '2026-03-25', invoice: 'INV-2403', service: 'Alternator Replacement', category: 'Electrical', shop: 'AutoElectric Pro', cost: 1450, status: 'in_repair' },
  { id: '12', unit_id: '2', date: '2026-01-20', invoice: 'INV-2391', service: 'Coolant Flush', category: 'Engine', shop: 'TruckCare Center', cost: 350, status: 'working' },
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
  { id: '22', name: 'Mark Gonzalez', phone: '+1 (555) 211-1011', status: 'working', unit_id: '11', cdl_number: 'CDL-CO-100011', cdl_expiry: '2027-03-01', medical_expiry: '2026-12-15', hire_date: '2024-03-01' },
  { id: '23', name: 'Donald Wilson', phone: '+1 (555) 212-1012', status: 'working', unit_id: '12', cdl_number: 'CDL-WA-100012', cdl_expiry: '2027-04-01', medical_expiry: '2026-01-15', hire_date: '2024-04-01' },
  { id: '24', name: 'Steven Anderson', phone: '+1 (555) 213-1013', status: 'working', unit_id: '13', cdl_number: 'CDL-OR-100013', cdl_expiry: '2027-05-01', medical_expiry: '2026-02-15', hire_date: '2024-05-01' },
  { id: '25', name: 'Paul Thomas', phone: '+1 (555) 214-1014', status: 'working', unit_id: '14', cdl_number: 'CDL-TN-100014', cdl_expiry: '2027-06-01', medical_expiry: '2026-03-15', hire_date: '2024-06-01' },
  { id: '26', name: 'Andrew Taylor', phone: '+1 (555) 215-1015', status: 'working', unit_id: '15', cdl_number: 'CDL-TX-100015', cdl_expiry: '2027-07-01', medical_expiry: '2026-04-15', hire_date: '2024-07-01' },
  { id: '27', name: 'Joshua Moore', phone: '+1 (555) 216-1016', status: 'working', unit_id: '16', cdl_number: 'CDL-CA-100016', cdl_expiry: '2027-08-01', medical_expiry: '2026-05-15', hire_date: '2024-08-01' },
  { id: '28', name: 'Kenneth Jackson', phone: '+1 (555) 217-1017', status: 'working', unit_id: '17', cdl_number: 'CDL-IL-100017', cdl_expiry: '2027-09-01', medical_expiry: '2026-06-15', hire_date: '2024-09-01' },
  { id: '29', name: 'Kevin Martin', phone: '+1 (555) 218-1018', status: 'working', unit_id: '18', cdl_number: 'CDL-GA-100018', cdl_expiry: '2027-01-01', medical_expiry: '2026-07-15', hire_date: '2024-01-01' },
  { id: '30', name: 'Brian Lee', phone: '+1 (555) 219-1019', status: 'working', unit_id: '19', cdl_number: 'CDL-FL-100019', cdl_expiry: '2027-02-01', medical_expiry: '2026-08-15', hire_date: '2024-02-01' },
  { id: '31', name: 'George Perez', phone: '+1 (555) 220-1020', status: 'working', unit_id: '20', cdl_number: 'CDL-OH-100020', cdl_expiry: '2027-03-01', medical_expiry: '2026-09-15', hire_date: '2024-03-01' },
  { id: '32', name: 'Timothy Thompson', phone: '+1 (555) 221-1021', status: 'working', unit_id: '21', cdl_number: 'CDL-PA-100021', cdl_expiry: '2027-04-01', medical_expiry: '2026-10-15', hire_date: '2024-04-01' },
  { id: '33', name: 'Ronald White', phone: '+1 (555) 222-1022', status: 'working', unit_id: '22', cdl_number: 'CDL-NJ-100022', cdl_expiry: '2027-05-01', medical_expiry: '2026-11-15', hire_date: '2024-05-01' },
  { id: '34', name: 'Edward Harris', phone: '+1 (555) 223-1023', status: 'working', unit_id: '23', cdl_number: 'CDL-NY-100023', cdl_expiry: '2027-06-01', medical_expiry: '2026-12-15', hire_date: '2024-06-01' },
  { id: '35', name: 'Jason Sanchez', phone: '+1 (555) 224-1024', status: 'working', unit_id: '24', cdl_number: 'CDL-MI-100024', cdl_expiry: '2027-07-01', medical_expiry: '2026-01-15', hire_date: '2024-07-01' },
  { id: '36', name: 'Jeffrey Clark', phone: '+1 (555) 225-1025', status: 'working', unit_id: '25', cdl_number: 'CDL-AZ-100025', cdl_expiry: '2027-08-01', medical_expiry: '2026-02-15', hire_date: '2024-08-01' },
  { id: '37', name: 'Ryan Ramirez', phone: '+1 (555) 226-1026', status: 'working', unit_id: '26', cdl_number: 'CDL-CO-100026', cdl_expiry: '2027-09-01', medical_expiry: '2026-03-15', hire_date: '2024-09-01' },
  { id: '38', name: 'Jacob Lewis', phone: '+1 (555) 227-1027', status: 'working', unit_id: '27', cdl_number: 'CDL-WA-100027', cdl_expiry: '2027-01-01', medical_expiry: '2026-04-15', hire_date: '2024-01-01' },
  { id: '39', name: 'Gary Robinson', phone: '+1 (555) 228-1028', status: 'working', unit_id: '28', cdl_number: 'CDL-OR-100028', cdl_expiry: '2027-02-01', medical_expiry: '2026-05-15', hire_date: '2024-02-01' },
  { id: '40', name: 'Nicholas Walker', phone: '+1 (555) 229-1029', status: 'working', unit_id: '29', cdl_number: 'CDL-TN-100029', cdl_expiry: '2027-03-01', medical_expiry: '2026-06-15', hire_date: '2024-03-01' },
  { id: '41', name: 'Eric Young', phone: '+1 (555) 230-1030', status: 'working', unit_id: '30', cdl_number: 'CDL-TX-100030', cdl_expiry: '2027-04-01', medical_expiry: '2026-07-15', hire_date: '2024-04-01' },
  { id: '42', name: 'Jonathan Allen', phone: '+1 (555) 231-1031', status: 'working', unit_id: '31', cdl_number: 'CDL-CA-100031', cdl_expiry: '2027-05-01', medical_expiry: '2026-08-15', hire_date: '2024-05-01' },
  { id: '43', name: 'Larry King', phone: '+1 (555) 232-1032', status: 'working', unit_id: '32', cdl_number: 'CDL-IL-100032', cdl_expiry: '2027-06-01', medical_expiry: '2026-09-15', hire_date: '2024-06-01' },
  { id: '44', name: 'Justin Wright', phone: '+1 (555) 233-1033', status: 'working', unit_id: '33', cdl_number: 'CDL-GA-100033', cdl_expiry: '2027-07-01', medical_expiry: '2026-10-15', hire_date: '2024-07-01' },
  { id: '45', name: 'Scott Scott', phone: '+1 (555) 234-1034', status: 'working', unit_id: '34', cdl_number: 'CDL-FL-100034', cdl_expiry: '2027-08-01', medical_expiry: '2026-11-15', hire_date: '2024-08-01' },
  { id: '46', name: 'Brandon Torres', phone: '+1 (555) 235-1035', status: 'working', unit_id: '35', cdl_number: 'CDL-OH-100035', cdl_expiry: '2027-09-01', medical_expiry: '2026-12-15', hire_date: '2024-09-01' },
  { id: '47', name: 'Benjamin Hill', phone: '+1 (555) 236-1036', status: 'working', unit_id: '36', cdl_number: 'CDL-PA-100036', cdl_expiry: '2027-01-01', medical_expiry: '2026-01-15', hire_date: '2024-01-01' },
  { id: '48', name: 'Samuel Green', phone: '+1 (555) 237-1037', status: 'working', unit_id: '37', cdl_number: 'CDL-NJ-100037', cdl_expiry: '2027-02-01', medical_expiry: '2026-02-15', hire_date: '2024-02-01' },
  { id: '49', name: 'Gregory Adams', phone: '+1 (555) 238-1038', status: 'working', unit_id: '38', cdl_number: 'CDL-NY-100038', cdl_expiry: '2027-03-01', medical_expiry: '2026-03-15', hire_date: '2024-03-01' },
  { id: '50', name: 'Frank Baker', phone: '+1 (555) 239-1039', status: 'working', unit_id: '39', cdl_number: 'CDL-MI-100039', cdl_expiry: '2027-04-01', medical_expiry: '2026-04-15', hire_date: '2024-04-01' },
  { id: '51', name: 'Raymond Nelson', phone: '+1 (555) 240-1040', status: 'working', unit_id: '40', cdl_number: 'CDL-AZ-100040', cdl_expiry: '2027-05-01', medical_expiry: '2026-05-15', hire_date: '2024-05-01' },
  { id: '52', name: 'Patrick Carter', phone: '+1 (555) 241-1041', status: 'working', unit_id: '41', cdl_number: 'CDL-CO-100041', cdl_expiry: '2027-06-01', medical_expiry: '2026-06-15', hire_date: '2024-06-01' },
  { id: '53', name: 'Jack Mitchell', phone: '+1 (555) 242-1042', status: 'working', unit_id: '42', cdl_number: 'CDL-WA-100042', cdl_expiry: '2027-07-01', medical_expiry: '2026-07-15', hire_date: '2024-07-01' },
  { id: '54', name: 'Dennis Roberts', phone: '+1 (555) 243-1043', status: 'working', unit_id: '43', cdl_number: 'CDL-OR-100043', cdl_expiry: '2027-08-01', medical_expiry: '2026-08-15', hire_date: '2024-08-01' },
  { id: '55', name: 'Jerry Turner', phone: '+1 (555) 244-1044', status: 'working', unit_id: '44', cdl_number: 'CDL-TN-100044', cdl_expiry: '2027-09-01', medical_expiry: '2026-09-15', hire_date: '2024-09-01' },
  { id: '56', name: 'Alexander Phillips', phone: '+1 (555) 245-1045', status: 'working', unit_id: '45', cdl_number: 'CDL-TX-100045', cdl_expiry: '2027-01-01', medical_expiry: '2026-10-15', hire_date: '2024-01-01' },
  { id: '57', name: 'Tyler Campbell', phone: '+1 (555) 246-1046', status: 'working', unit_id: '46', cdl_number: 'CDL-CA-100046', cdl_expiry: '2027-02-01', medical_expiry: '2026-11-15', hire_date: '2024-02-01' },
  { id: '58', name: 'Henry Parker', phone: '+1 (555) 247-1047', status: 'working', unit_id: '47', cdl_number: 'CDL-IL-100047', cdl_expiry: '2027-03-01', medical_expiry: '2026-12-15', hire_date: '2024-03-01' },
  { id: '59', name: 'Douglas Evans', phone: '+1 (555) 248-1048', status: 'working', unit_id: '48', cdl_number: 'CDL-GA-100048', cdl_expiry: '2027-04-01', medical_expiry: '2026-01-15', hire_date: '2024-04-01' },
  { id: '60', name: 'Aaron Edwards', phone: '+1 (555) 249-1049', status: 'working', unit_id: '49', cdl_number: 'CDL-FL-100049', cdl_expiry: '2027-05-01', medical_expiry: '2026-02-15', hire_date: '2024-05-01' },
  { id: '61', name: 'Peter Collins', phone: '+1 (555) 250-1050', status: 'working', unit_id: '50', cdl_number: 'CDL-OH-100050', cdl_expiry: '2027-06-01', medical_expiry: '2026-03-15', hire_date: '2024-06-01' },
  { id: '62', name: 'Nathan Stewart', phone: '+1 (555) 251-1051', status: 'working', unit_id: '51', cdl_number: 'CDL-PA-100051', cdl_expiry: '2027-07-01', medical_expiry: '2026-04-15', hire_date: '2024-07-01' },
  { id: '63', name: 'Zachary Murphy', phone: '+1 (555) 252-1052', status: 'working', unit_id: '52', cdl_number: 'CDL-NJ-100052', cdl_expiry: '2027-08-01', medical_expiry: '2026-05-15', hire_date: '2024-08-01' },
  { id: '64', name: 'Dylan Rivera', phone: '+1 (555) 253-1053', status: 'working', unit_id: '53', cdl_number: 'CDL-NY-100053', cdl_expiry: '2027-09-01', medical_expiry: '2026-06-15', hire_date: '2024-09-01' },
  { id: '65', name: 'Ethan Cook', phone: '+1 (555) 254-1054', status: 'working', unit_id: '54', cdl_number: 'CDL-MI-100054', cdl_expiry: '2027-01-01', medical_expiry: '2026-07-15', hire_date: '2024-01-01' },
  { id: '66', name: 'Logan Rogers', phone: '+1 (555) 255-1055', status: 'working', unit_id: '55', cdl_number: 'CDL-AZ-100055', cdl_expiry: '2027-02-01', medical_expiry: '2026-08-15', hire_date: '2024-02-01' },
  { id: '67', name: 'Owen Morgan', phone: '+1 (555) 256-1056', status: 'working', unit_id: '56', cdl_number: 'CDL-CO-100056', cdl_expiry: '2027-03-01', medical_expiry: '2026-09-15', hire_date: '2024-03-01' },
  { id: '68', name: 'Caleb Peterson', phone: '+1 (555) 257-1057', status: 'working', unit_id: '57', cdl_number: 'CDL-WA-100057', cdl_expiry: '2027-04-01', medical_expiry: '2026-10-15', hire_date: '2024-04-01' },
  { id: '69', name: 'Christian Cooper', phone: '+1 (555) 258-1058', status: 'working', unit_id: '58', cdl_number: 'CDL-OR-100058', cdl_expiry: '2027-05-01', medical_expiry: '2026-11-15', hire_date: '2024-05-01' },
  { id: '70', name: 'Hunter Reed', phone: '+1 (555) 259-1059', status: 'working', unit_id: '59', cdl_number: 'CDL-TN-100059', cdl_expiry: '2027-06-01', medical_expiry: '2026-12-15', hire_date: '2024-06-01' },
  { id: '71', name: 'Elijah Bailey', phone: '+1 (555) 260-1060', status: 'working', unit_id: '60', cdl_number: 'CDL-TX-100060', cdl_expiry: '2027-07-01', medical_expiry: '2026-01-15', hire_date: '2024-07-01' },
  { id: '72', name: 'Connor Bell', phone: '+1 (555) 261-1061', status: 'working', unit_id: '61', cdl_number: 'CDL-CA-100061', cdl_expiry: '2027-08-01', medical_expiry: '2026-02-15', hire_date: '2024-08-01' },
  { id: '73', name: 'Cameron Gomez', phone: '+1 (555) 262-1062', status: 'working', unit_id: '62', cdl_number: 'CDL-IL-100062', cdl_expiry: '2027-09-01', medical_expiry: '2026-03-15', hire_date: '2024-09-01' },
  { id: '74', name: 'Aiden Kelly', phone: '+1 (555) 263-1063', status: 'working', unit_id: '63', cdl_number: 'CDL-GA-100063', cdl_expiry: '2027-01-01', medical_expiry: '2026-04-15', hire_date: '2024-01-01' },
  { id: '75', name: 'Luke Howard', phone: '+1 (555) 264-1064', status: 'working', unit_id: '64', cdl_number: 'CDL-FL-100064', cdl_expiry: '2027-02-01', medical_expiry: '2026-05-15', hire_date: '2024-02-01' },
  { id: '76', name: 'Sean Ward', phone: '+1 (555) 265-1065', status: 'working', unit_id: '65', cdl_number: 'CDL-OH-100065', cdl_expiry: '2027-03-01', medical_expiry: '2026-06-15', hire_date: '2024-03-01' },
  { id: '77', name: 'Cole Cox', phone: '+1 (555) 266-1066', status: 'working', unit_id: '66', cdl_number: 'CDL-PA-100066', cdl_expiry: '2027-04-01', medical_expiry: '2026-07-15', hire_date: '2024-04-01' },
  { id: '78', name: 'Carlos Diaz', phone: '+1 (555) 267-1067', status: 'working', unit_id: '67', cdl_number: 'CDL-NJ-100067', cdl_expiry: '2027-05-01', medical_expiry: '2026-08-15', hire_date: '2024-05-01' },
  { id: '79', name: 'Dominic Richardson', phone: '+1 (555) 268-1068', status: 'working', unit_id: '68', cdl_number: 'CDL-NY-100068', cdl_expiry: '2027-06-01', medical_expiry: '2026-09-15', hire_date: '2024-06-01' },
  { id: '80', name: 'Ian Wood', phone: '+1 (555) 269-1069', status: 'working', unit_id: '69', cdl_number: 'CDL-MI-100069', cdl_expiry: '2027-07-01', medical_expiry: '2026-10-15', hire_date: '2024-07-01' },
  { id: '81', name: 'Gabriel Watson', phone: '+1 (555) 270-1070', status: 'working', unit_id: '70', cdl_number: 'CDL-AZ-100070', cdl_expiry: '2027-08-01', medical_expiry: '2026-11-15', hire_date: '2024-08-01' },
  { id: '82', name: 'Julian Brooks', phone: '+1 (555) 271-1071', status: 'working', unit_id: '71', cdl_number: 'CDL-CO-100071', cdl_expiry: '2027-09-01', medical_expiry: '2026-12-15', hire_date: '2024-09-01' },
  { id: '83', name: 'Miguel Bennett', phone: '+1 (555) 272-1072', status: 'working', unit_id: '72', cdl_number: 'CDL-WA-100072', cdl_expiry: '2027-01-01', medical_expiry: '2026-01-15', hire_date: '2024-01-01' },
  { id: '84', name: 'Luis Gray', phone: '+1 (555) 273-1073', status: 'working', unit_id: '73', cdl_number: 'CDL-OR-100073', cdl_expiry: '2027-02-01', medical_expiry: '2026-02-15', hire_date: '2024-02-01' },
  { id: '85', name: 'Diego Reyes', phone: '+1 (555) 274-1074', status: 'working', unit_id: '74', cdl_number: 'CDL-TN-100074', cdl_expiry: '2027-03-01', medical_expiry: '2026-03-15', hire_date: '2024-03-01' },
  { id: '86', name: 'Oscar Cruz', phone: '+1 (555) 275-1075', status: 'working', unit_id: '75', cdl_number: 'CDL-TX-100075', cdl_expiry: '2027-04-01', medical_expiry: '2026-04-15', hire_date: '2024-04-01' },
  { id: '87', name: 'Travis Hughes', phone: '+1 (555) 276-1076', status: 'working', unit_id: '76', cdl_number: 'CDL-CA-100076', cdl_expiry: '2027-05-01', medical_expiry: '2026-05-15', hire_date: '2024-05-01' },
  { id: '88', name: 'Brett Price', phone: '+1 (555) 277-1077', status: 'working', unit_id: '77', cdl_number: 'CDL-IL-100077', cdl_expiry: '2027-06-01', medical_expiry: '2026-06-15', hire_date: '2024-06-01' },
  { id: '89', name: 'Marcus Myers', phone: '+1 (555) 278-1078', status: 'working', unit_id: '78', cdl_number: 'CDL-GA-100078', cdl_expiry: '2027-07-01', medical_expiry: '2026-07-15', hire_date: '2024-07-01' },
  { id: '90', name: 'Corey Long', phone: '+1 (555) 279-1079', status: 'working', unit_id: '79', cdl_number: 'CDL-FL-100079', cdl_expiry: '2027-08-01', medical_expiry: '2026-08-15', hire_date: '2024-08-01' },
  { id: '91', name: 'Lance Foster', phone: '+1 (555) 280-1080', status: 'working', unit_id: '80', cdl_number: 'CDL-OH-100080', cdl_expiry: '2027-09-01', medical_expiry: '2026-09-15', hire_date: '2024-09-01' },
  { id: '92', name: 'Victor Sanders', phone: '+1 (555) 281-1081', status: 'working', unit_id: '81', cdl_number: 'CDL-PA-100081', cdl_expiry: '2027-01-01', medical_expiry: '2026-10-15', hire_date: '2024-01-01' },
  { id: '93', name: 'Wesley Ross', phone: '+1 (555) 282-1082', status: 'working', unit_id: '82', cdl_number: 'CDL-NJ-100082', cdl_expiry: '2027-02-01', medical_expiry: '2026-11-15', hire_date: '2024-02-01' },
  { id: '94', name: 'Danny Morales', phone: '+1 (555) 283-1083', status: 'working', unit_id: '83', cdl_number: 'CDL-NY-100083', cdl_expiry: '2027-03-01', medical_expiry: '2026-12-15', hire_date: '2024-03-01' },
  { id: '95', name: 'Jesse Powell', phone: '+1 (555) 284-1084', status: 'working', unit_id: '84', cdl_number: 'CDL-MI-100084', cdl_expiry: '2027-04-01', medical_expiry: '2026-01-15', hire_date: '2024-04-01' },
  { id: '96', name: 'Troy Sullivan', phone: '+1 (555) 285-1085', status: 'working', unit_id: '85', cdl_number: 'CDL-AZ-100085', cdl_expiry: '2027-05-01', medical_expiry: '2026-02-15', hire_date: '2024-05-01' },
  { id: '97', name: 'Derek Russell', phone: '+1 (555) 286-1086', status: 'working', unit_id: '86', cdl_number: 'CDL-CO-100086', cdl_expiry: '2027-06-01', medical_expiry: '2026-03-15', hire_date: '2024-06-01' },
  { id: '98', name: 'Omar Ortiz', phone: '+1 (555) 287-1087', status: 'working', unit_id: '87', cdl_number: 'CDL-WA-100087', cdl_expiry: '2027-07-01', medical_expiry: '2026-04-15', hire_date: '2024-07-01' },
  { id: '99', name: 'Sergio Jenkins', phone: '+1 (555) 288-1088', status: 'working', unit_id: '88', cdl_number: 'CDL-OR-100088', cdl_expiry: '2027-08-01', medical_expiry: '2026-05-15', hire_date: '2024-08-01' },
  { id: '100', name: 'Ivan Gutierrez', phone: '+1 (555) 289-1089', status: 'working', unit_id: '89', cdl_number: 'CDL-TN-100089', cdl_expiry: '2027-09-01', medical_expiry: '2026-06-15', hire_date: '2024-09-01' },
  { id: '101', name: 'Felix Perry', phone: '+1 (555) 290-1090', status: 'working', unit_id: '90', cdl_number: 'CDL-TX-100090', cdl_expiry: '2027-01-01', medical_expiry: '2026-07-15', hire_date: '2024-01-01' },
  { id: '102', name: 'Hector Butler', phone: '+1 (555) 291-1091', status: 'working', unit_id: '91', cdl_number: 'CDL-CA-100091', cdl_expiry: '2027-02-01', medical_expiry: '2026-08-15', hire_date: '2024-02-01' },
  { id: '103', name: 'Angel Barnes', phone: '+1 (555) 292-1092', status: 'working', unit_id: '92', cdl_number: 'CDL-IL-100092', cdl_expiry: '2027-03-01', medical_expiry: '2026-09-15', hire_date: '2024-03-01' },
  { id: '104', name: 'Adrian Fisher', phone: '+1 (555) 293-1093', status: 'working', unit_id: '93', cdl_number: 'CDL-GA-100093', cdl_expiry: '2027-04-01', medical_expiry: '2026-10-15', hire_date: '2024-04-01' },
  { id: '105', name: 'Edgar Henderson', phone: '+1 (555) 294-1094', status: 'working', unit_id: '94', cdl_number: 'CDL-FL-100094', cdl_expiry: '2027-05-01', medical_expiry: '2026-11-15', hire_date: '2024-05-01' },
  { id: '106', name: 'Ruben Coleman', phone: '+1 (555) 295-1095', status: 'working', unit_id: '95', cdl_number: 'CDL-OH-100095', cdl_expiry: '2027-06-01', medical_expiry: '2026-12-15', hire_date: '2024-06-01' },
  { id: '107', name: 'Jorge Simmons', phone: '+1 (555) 296-1096', status: 'working', unit_id: '96', cdl_number: 'CDL-PA-100096', cdl_expiry: '2027-07-01', medical_expiry: '2026-01-15', hire_date: '2024-07-01' },
  { id: '108', name: 'Ricardo Patterson', phone: '+1 (555) 297-1097', status: 'working', unit_id: '97', cdl_number: 'CDL-NJ-100097', cdl_expiry: '2027-08-01', medical_expiry: '2026-02-15', hire_date: '2024-08-01' },
  { id: '109', name: 'Cesar Jordan', phone: '+1 (555) 298-1098', status: 'working', unit_id: '98', cdl_number: 'CDL-NY-100098', cdl_expiry: '2027-09-01', medical_expiry: '2026-03-15', hire_date: '2024-09-01' },
  { id: '110', name: 'Mario Reynolds', phone: '+1 (555) 299-1099', status: 'working', unit_id: '99', cdl_number: 'CDL-MI-100099', cdl_expiry: '2027-01-01', medical_expiry: '2026-04-15', hire_date: '2024-01-01' },
  { id: '111', name: 'Fernando Hamilton', phone: '+1 (555) 300-1100', status: 'working', unit_id: '100', cdl_number: 'CDL-AZ-100100', cdl_expiry: '2027-02-01', medical_expiry: '2026-05-15', hire_date: '2024-02-01' },
  { id: '112', name: 'Manuel Graham', phone: '+1 (555) 301-1101', status: 'working', unit_id: '101', cdl_number: 'CDL-CO-100101', cdl_expiry: '2027-03-01', medical_expiry: '2026-06-15', hire_date: '2024-03-01' },
  { id: '113', name: 'Eduardo Kim', phone: '+1 (555) 302-1102', status: 'working', unit_id: '102', cdl_number: 'CDL-WA-100102', cdl_expiry: '2027-04-01', medical_expiry: '2026-07-15', hire_date: '2024-04-01' },
  { id: '114', name: 'Arturo Gonzales', phone: '+1 (555) 303-1103', status: 'working', unit_id: '103', cdl_number: 'CDL-OR-100103', cdl_expiry: '2027-05-01', medical_expiry: '2026-08-15', hire_date: '2024-05-01' },
  { id: '115', name: 'Alfredo Williams', phone: '+1 (555) 304-1104', status: 'working', unit_id: '104', cdl_number: 'CDL-TN-100104', cdl_expiry: '2027-06-01', medical_expiry: '2026-09-15', hire_date: '2024-06-01' },
  { id: '116', name: 'Guillermo Johnson', phone: '+1 (555) 305-1105', status: 'working', unit_id: '105', cdl_number: 'CDL-TX-100105', cdl_expiry: '2027-07-01', medical_expiry: '2026-10-15', hire_date: '2024-07-01' },
  { id: '117', name: 'Enrique Brown', phone: '+1 (555) 306-1106', status: 'working', unit_id: '106', cdl_number: 'CDL-CA-100106', cdl_expiry: '2027-08-01', medical_expiry: '2026-11-15', hire_date: '2024-08-01' },
  { id: '118', name: 'Roberto Jones', phone: '+1 (555) 307-1107', status: 'working', unit_id: '107', cdl_number: 'CDL-IL-100107', cdl_expiry: '2027-09-01', medical_expiry: '2026-12-15', hire_date: '2024-09-01' },
  { id: '119', name: 'Francisco Garcia', phone: '+1 (555) 308-1108', status: 'working', unit_id: '108', cdl_number: 'CDL-GA-100108', cdl_expiry: '2027-01-01', medical_expiry: '2026-01-15', hire_date: '2024-01-01' },
  { id: '120', name: 'Alberto Miller', phone: '+1 (555) 309-1109', status: 'working', unit_id: '109', cdl_number: 'CDL-FL-100109', cdl_expiry: '2027-02-01', medical_expiry: '2026-02-15', hire_date: '2024-02-01' },
  { id: '121', name: 'Javier Davis', phone: '+1 (555) 310-1110', status: 'working', unit_id: '110', cdl_number: 'CDL-OH-100110', cdl_expiry: '2027-03-01', medical_expiry: '2026-03-15', hire_date: '2024-03-01' },
  { id: '122', name: 'James Rodriguez', phone: '+1 (555) 311-1111', status: 'working', unit_id: '111', cdl_number: 'CDL-PA-100111', cdl_expiry: '2027-04-01', medical_expiry: '2026-04-15', hire_date: '2024-04-01' },
  { id: '123', name: 'Robert Martinez', phone: '+1 (555) 312-1112', status: 'working', unit_id: '112', cdl_number: 'CDL-NJ-100112', cdl_expiry: '2027-05-01', medical_expiry: '2026-05-15', hire_date: '2024-05-01' },
  { id: '124', name: 'Michael Hernandez', phone: '+1 (555) 313-1113', status: 'working', unit_id: '113', cdl_number: 'CDL-NY-100113', cdl_expiry: '2027-06-01', medical_expiry: '2026-06-15', hire_date: '2024-06-01' },
  { id: '125', name: 'William Lopez', phone: '+1 (555) 314-1114', status: 'working', unit_id: '114', cdl_number: 'CDL-MI-100114', cdl_expiry: '2027-07-01', medical_expiry: '2026-07-15', hire_date: '2024-07-01' },
  { id: '126', name: 'Richard Gonzalez', phone: '+1 (555) 315-1115', status: 'working', unit_id: '115', cdl_number: 'CDL-AZ-100115', cdl_expiry: '2027-08-01', medical_expiry: '2026-08-15', hire_date: '2024-08-01' },
  { id: '127', name: 'Joseph Wilson', phone: '+1 (555) 316-1116', status: 'working', unit_id: '116', cdl_number: 'CDL-CO-100116', cdl_expiry: '2027-09-01', medical_expiry: '2026-09-15', hire_date: '2024-09-01' },
  { id: '128', name: 'Thomas Anderson', phone: '+1 (555) 317-1117', status: 'working', unit_id: '117', cdl_number: 'CDL-WA-100117', cdl_expiry: '2027-01-01', medical_expiry: '2026-10-15', hire_date: '2024-01-01' },
  { id: '129', name: 'Charles Thomas', phone: '+1 (555) 318-1118', status: 'working', unit_id: '118', cdl_number: 'CDL-OR-100118', cdl_expiry: '2027-02-01', medical_expiry: '2026-11-15', hire_date: '2024-02-01' },
  { id: '130', name: 'Daniel Taylor', phone: '+1 (555) 319-1119', status: 'working', unit_id: '119', cdl_number: 'CDL-TN-100119', cdl_expiry: '2027-03-01', medical_expiry: '2026-12-15', hire_date: '2024-03-01' },
  { id: '131', name: 'Matthew Moore', phone: '+1 (555) 320-1120', status: 'working', unit_id: '120', cdl_number: 'CDL-TX-100120', cdl_expiry: '2027-04-01', medical_expiry: '2026-01-15', hire_date: '2024-04-01' },
];

const allModules = ['Dashboard', 'Oil', 'Inspections', 'Registrations', 'Repairs', 'Defects', 'Units', 'Drivers', 'Audit']

export const dispatchers: Dispatcher[] = [
  { id: '1', name: 'Admin', email: 'admin@logistictab.io', phone: '+1 (555) 200-0001', role: 'admin', status: 'active', modules: allModules, created: '2024-01-01', last_login: '2026-03-29 08:30' },
  { id: '2', name: 'Mike Johnson', email: 'mike@logistictab.io', phone: '+1 (555) 200-0002', role: 'dispatcher', status: 'active', modules: ['Dashboard', 'Oil', 'Inspections', 'Repairs', 'Defects', 'Units'], created: '2024-02-15', last_login: '2026-03-28 17:45' },
  { id: '3', name: 'Alex Brown', email: 'alex@logistictab.io', phone: '+1 (555) 200-0003', role: 'dispatcher', status: 'active', modules: ['Dashboard', 'Oil', 'Inspections', 'Registrations', 'Repairs'], created: '2024-03-01', last_login: '2026-03-27 14:20' },
  { id: '4', name: 'Sarah Chen', email: 'sarah@logistictab.io', phone: '+1 (555) 200-0004', role: 'viewer', status: 'invited', modules: ['Dashboard', 'Repairs', 'Audit'], created: '2026-03-25' },
  { id: '5', name: 'James Miller', email: 'james@logistictab.io', phone: '+1 (555) 200-0005', role: 'dispatcher', status: 'disabled', modules: ['Dashboard', 'Oil', 'Units'], created: '2024-06-10', last_login: '2026-02-10 09:00' },
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

export const unitStatuses: UnitStatus[] = [
  { id: '1',  unit_id: '1',  status: 'rolling',      note: '',                                     load_number: 'LD-4521', origin: 'Dallas, TX',      destination: 'Atlanta, GA',     eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:30:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T08:30:00' },
  { id: '2',  unit_id: '2',  status: 'at_shipper',   note: 'Waiting for loading dock',             load_number: 'LD-4522', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ',     eta: '2026-04-06T18:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:15:00', updated_by: 'Alex Brown',   updated_at: '2026-04-06T07:15:00' },
  { id: '3',  unit_id: '3',  status: 'rolling',        note: 'Brake pressure warning light on',      load_number: 'LD-4510', origin: 'Houston, TX',     destination: 'Miami, FL',       eta: '',                    condition: 'issue', condition_note: 'Brake pressure warning light on', last_activity_at: '2026-04-06T06:45:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T06:45:00' },
  { id: '4',  unit_id: '4',  status: 'rolling',      note: '',                                     load_number: 'LD-4523', origin: 'Chicago, IL',     destination: 'Detroit, MI',     eta: '2026-04-06T16:30:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:00:00', updated_by: 'Alex Brown',   updated_at: '2026-04-06T09:00:00' },
  { id: '5',  unit_id: '5',  status: 'rolling',  note: 'Heavy traffic on I-75, 2h delay',     load_number: 'LD-4519', origin: 'Atlanta, GA',     destination: 'Nashville, TN',   eta: '2026-04-06T20:00:00', condition: 'getting_late', condition_note: 'Heavy traffic on I-75, 2h delay', last_activity_at: '2026-04-06T10:15:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T10:15:00' },
  { id: '6',  unit_id: '6',  status: 'sleeping',     note: 'HOS rest — 8h break',                  load_number: 'LD-4524', origin: 'Jacksonville, FL',destination: 'Charlotte, NC',   eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T02:00:00', updated_by: 'Alex Brown',   updated_at: '2026-04-06T02:00:00' },
  { id: '7',  unit_id: '7',  status: 'no_load',      note: '',                                     load_number: '',        origin: '',                destination: '',                eta: '',                    condition: null, condition_note: '', last_activity_at: '2026-04-05T14:00:00', updated_by: 'Mike Johnson', updated_at: '2026-04-05T14:00:00' },
  { id: '8',  unit_id: '8',  status: 'rolling',      note: '',                                     load_number: 'LD-4525', origin: 'Columbus, OH',    destination: 'Indianapolis, IN',eta: '2026-04-06T15:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:00:00', updated_by: 'Alex Brown',   updated_at: '2026-04-06T08:00:00' },
  { id: '9',  unit_id: '9',  status: 'at_receiver',  note: 'Unloading in progress',                load_number: 'LD-4518', origin: 'Newark, NJ',     destination: 'Philadelphia, PA',eta: '',                    condition: null, condition_note: '', last_activity_at: '2026-04-06T09:30:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:30:00' },
  { id: '10', unit_id: '10', status: 'rolling',  note: 'Delayed at weigh station',             load_number: 'LD-4526', origin: 'Pittsburgh, PA',  destination: 'Baltimore, MD',   eta: '2026-04-06T22:00:00', condition: 'getting_late', condition_note: 'Delayed at weigh station', last_activity_at: '2026-04-06T10:00:00', updated_by: 'Alex Brown',   updated_at: '2026-04-06T10:00:00' },
  { id: '21', unit_id: '11', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:11:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:11:00' },
  { id: '22', unit_id: '12', status: 'rolling', note: '', load_number: 'LD-5012', origin: 'Charlotte, NC', destination: 'Kansas City, MO', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:12:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:12:00' },
  { id: '23', unit_id: '13', status: 'rolling', note: '', load_number: 'LD-5013', origin: 'Jacksonville, FL', destination: 'Oklahoma City, OK', eta: '2026-04-07T07:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:13:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:13:00' },
  { id: '24', unit_id: '14', status: 'rolling', note: '', load_number: 'LD-5014', origin: 'Columbus, OH', destination: 'Las Vegas, NV', eta: '2026-04-07T08:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:14:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:14:00' },
  { id: '25', unit_id: '15', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5015', origin: 'Indianapolis, IN', destination: 'Salt Lake City, UT', eta: '2026-04-07T09:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:15:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:15:00' },
  { id: '26', unit_id: '16', status: 'rolling', note: '', load_number: 'LD-5016', origin: 'Detroit, MI', destination: 'San Antonio, TX', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:16:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:16:00' },
  { id: '27', unit_id: '17', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5017', origin: 'Minneapolis, MN', destination: 'El Paso, TX', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:17:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:17:00' },
  { id: '28', unit_id: '18', status: 'rolling', note: '', load_number: 'LD-5018', origin: 'St. Louis, MO', destination: 'Albuquerque, NM', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:18:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:18:00' },
  { id: '29', unit_id: '19', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:19:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:19:00' },
  { id: '30', unit_id: '20', status: 'rolling', note: '', load_number: 'LD-5020', origin: 'Oklahoma City, OK', destination: 'Fresno, CA', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:20:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:20:00' },
  { id: '31', unit_id: '21', status: 'rolling', note: '', load_number: 'LD-5021', origin: 'Las Vegas, NV', destination: 'Sacramento, CA', eta: '2026-04-07T15:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:21:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:21:00' },
  { id: '32', unit_id: '22', status: 'rolling', note: '', load_number: 'LD-5022', origin: 'Salt Lake City, UT', destination: 'Reno, NV', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:22:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:22:00' },
  { id: '33', unit_id: '23', status: 'rolling', note: '', load_number: 'LD-5023', origin: 'San Antonio, TX', destination: 'Boise, ID', eta: '2026-04-07T17:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T09:23:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:23:00' },
  { id: '34', unit_id: '24', status: 'rolling', note: '', load_number: 'LD-5024', origin: 'El Paso, TX', destination: 'Omaha, NE', eta: '2026-04-07T06:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T10:24:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:24:00' },
  { id: '35', unit_id: '25', status: 'rolling', note: '', load_number: 'LD-5025', origin: 'Albuquerque, NM', destination: 'Des Moines, IA', eta: '2026-04-07T07:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T11:25:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:25:00' },
  { id: '36', unit_id: '26', status: 'rolling', note: 'Traffic delay', load_number: 'LD-5026', origin: 'Tucson, AZ', destination: 'Little Rock, AR', eta: '2026-04-07T08:00:00', condition: 'getting_late', condition_note: 'Traffic delay', last_activity_at: '2026-04-06T12:26:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:26:00' },
  { id: '37', unit_id: '27', status: 'rolling', note: 'Mechanical issue reported', load_number: 'LD-5027', origin: 'Fresno, CA', destination: 'Birmingham, AL', eta: '2026-04-07T09:00:00', condition: 'issue', condition_note: 'Mechanical issue reported', last_activity_at: '2026-04-06T13:27:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:27:00' },
  { id: '38', unit_id: '28', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5028', origin: 'Sacramento, CA', destination: 'Raleigh, NC', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:28:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:28:00' },
  { id: '39', unit_id: '29', status: 'at_receiver', note: '', load_number: 'LD-5029', origin: 'Reno, NV', destination: 'Richmond, VA', eta: '2026-04-07T11:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:29:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:29:00' },
  { id: '40', unit_id: '30', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5030', origin: 'Boise, ID', destination: 'Pittsburgh, PA', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:30:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:30:00' },
  { id: '41', unit_id: '31', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:31:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:31:00' },
  { id: '42', unit_id: '32', status: 'rolling', note: '', load_number: 'LD-5032', origin: 'Des Moines, IA', destination: 'Philadelphia, PA', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:32:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:32:00' },
  { id: '43', unit_id: '33', status: 'rolling', note: '', load_number: 'LD-5033', origin: 'Little Rock, AR', destination: 'Newark, NJ', eta: '2026-04-07T15:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:33:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:33:00' },
  { id: '44', unit_id: '34', status: 'rolling', note: '', load_number: 'LD-5034', origin: 'Birmingham, AL', destination: 'Boston, MA', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:34:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:34:00' },
  { id: '45', unit_id: '35', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5035', origin: 'Raleigh, NC', destination: 'Buffalo, NY', eta: '2026-04-07T17:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:35:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:35:00' },
  { id: '46', unit_id: '36', status: 'rolling', note: '', load_number: 'LD-5036', origin: 'Richmond, VA', destination: 'Cleveland, OH', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:36:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:36:00' },
  { id: '47', unit_id: '37', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5037', origin: 'Pittsburgh, PA', destination: 'Cincinnati, OH', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:37:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:37:00' },
  { id: '48', unit_id: '38', status: 'rolling', note: '', load_number: 'LD-5038', origin: 'Baltimore, MD', destination: 'Louisville, KY', eta: '2026-04-07T08:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:38:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:38:00' },
  { id: '49', unit_id: '39', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:39:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:39:00' },
  { id: '50', unit_id: '40', status: 'rolling', note: '', load_number: 'LD-5040', origin: 'Newark, NJ', destination: 'Tampa, FL', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:40:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:40:00' },
  { id: '51', unit_id: '41', status: 'rolling', note: '', load_number: 'LD-5041', origin: 'Boston, MA', destination: 'Orlando, FL', eta: '2026-04-07T11:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:41:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:41:00' },
  { id: '52', unit_id: '42', status: 'rolling', note: '', load_number: 'LD-5042', origin: 'Buffalo, NY', destination: 'Savannah, GA', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:42:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:42:00' },
  { id: '53', unit_id: '43', status: 'rolling', note: '', load_number: 'LD-5043', origin: 'Cleveland, OH', destination: 'Dallas, TX', eta: '2026-04-07T13:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T09:43:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:43:00' },
  { id: '54', unit_id: '44', status: 'rolling', note: '', load_number: 'LD-5044', origin: 'Cincinnati, OH', destination: 'Houston, TX', eta: '2026-04-07T14:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T10:44:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:44:00' },
  { id: '55', unit_id: '45', status: 'rolling', note: '', load_number: 'LD-5045', origin: 'Louisville, KY', destination: 'Los Angeles, CA', eta: '2026-04-07T15:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T11:45:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:45:00' },
  { id: '56', unit_id: '46', status: 'rolling', note: 'Traffic delay', load_number: 'LD-5046', origin: 'Milwaukee, WI', destination: 'Chicago, IL', eta: '2026-04-07T16:00:00', condition: 'getting_late', condition_note: 'Traffic delay', last_activity_at: '2026-04-06T12:46:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:46:00' },
  { id: '57', unit_id: '47', status: 'rolling', note: 'Mechanical issue reported', load_number: 'LD-5047', origin: 'Tampa, FL', destination: 'Atlanta, GA', eta: '2026-04-07T17:00:00', condition: 'issue', condition_note: 'Mechanical issue reported', last_activity_at: '2026-04-06T13:47:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:47:00' },
  { id: '58', unit_id: '48', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5048', origin: 'Orlando, FL', destination: 'Miami, FL', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:48:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:48:00' },
  { id: '59', unit_id: '49', status: 'at_receiver', note: '', load_number: 'LD-5049', origin: 'Savannah, GA', destination: 'Phoenix, AZ', eta: '2026-04-07T07:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:49:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:49:00' },
  { id: '60', unit_id: '50', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5050', origin: 'Dallas, TX', destination: 'Denver, CO', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:50:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:50:00' },
  { id: '61', unit_id: '51', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:51:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:51:00' },
  { id: '62', unit_id: '52', status: 'rolling', note: '', load_number: 'LD-5052', origin: 'Los Angeles, CA', destination: 'Portland, OR', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:52:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:52:00' },
  { id: '63', unit_id: '53', status: 'rolling', note: '', load_number: 'LD-5053', origin: 'Chicago, IL', destination: 'Nashville, TN', eta: '2026-04-07T11:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:53:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:53:00' },
  { id: '64', unit_id: '54', status: 'rolling', note: '', load_number: 'LD-5054', origin: 'Atlanta, GA', destination: 'Memphis, TN', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:54:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:54:00' },
  { id: '65', unit_id: '55', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5055', origin: 'Miami, FL', destination: 'Charlotte, NC', eta: '2026-04-07T13:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:55:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:55:00' },
  { id: '66', unit_id: '56', status: 'rolling', note: '', load_number: 'LD-5056', origin: 'Phoenix, AZ', destination: 'Jacksonville, FL', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:56:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:56:00' },
  { id: '67', unit_id: '57', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5057', origin: 'Denver, CO', destination: 'Columbus, OH', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:57:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:57:00' },
  { id: '68', unit_id: '58', status: 'rolling', note: '', load_number: 'LD-5058', origin: 'Seattle, WA', destination: 'Indianapolis, IN', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:58:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:58:00' },
  { id: '69', unit_id: '59', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:59:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:59:00' },
  { id: '70', unit_id: '60', status: 'rolling', note: '', load_number: 'LD-5060', origin: 'Nashville, TN', destination: 'Minneapolis, MN', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:00:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:00:00' },
  { id: '71', unit_id: '61', status: 'rolling', note: '', load_number: 'LD-5061', origin: 'Memphis, TN', destination: 'St. Louis, MO', eta: '2026-04-07T07:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:01:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:01:00' },
  { id: '72', unit_id: '62', status: 'rolling', note: '', load_number: 'LD-5062', origin: 'Charlotte, NC', destination: 'Kansas City, MO', eta: '2026-04-07T08:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:02:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:02:00' },
  { id: '73', unit_id: '63', status: 'rolling', note: '', load_number: 'LD-5063', origin: 'Jacksonville, FL', destination: 'Oklahoma City, OK', eta: '2026-04-07T09:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T09:03:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:03:00' },
  { id: '74', unit_id: '64', status: 'rolling', note: '', load_number: 'LD-5064', origin: 'Columbus, OH', destination: 'Las Vegas, NV', eta: '2026-04-07T10:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T10:04:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:04:00' },
  { id: '75', unit_id: '65', status: 'rolling', note: '', load_number: 'LD-5065', origin: 'Indianapolis, IN', destination: 'Salt Lake City, UT', eta: '2026-04-07T11:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T11:05:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:05:00' },
  { id: '76', unit_id: '66', status: 'rolling', note: 'Traffic delay', load_number: 'LD-5066', origin: 'Detroit, MI', destination: 'San Antonio, TX', eta: '2026-04-07T12:00:00', condition: 'getting_late', condition_note: 'Traffic delay', last_activity_at: '2026-04-06T12:06:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:06:00' },
  { id: '77', unit_id: '67', status: 'rolling', note: 'Mechanical issue reported', load_number: 'LD-5067', origin: 'Minneapolis, MN', destination: 'El Paso, TX', eta: '2026-04-07T13:00:00', condition: 'issue', condition_note: 'Mechanical issue reported', last_activity_at: '2026-04-06T13:07:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:07:00' },
  { id: '78', unit_id: '68', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5068', origin: 'St. Louis, MO', destination: 'Albuquerque, NM', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:08:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:08:00' },
  { id: '79', unit_id: '69', status: 'at_receiver', note: '', load_number: 'LD-5069', origin: 'Kansas City, MO', destination: 'Tucson, AZ', eta: '2026-04-07T15:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:09:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:09:00' },
  { id: '80', unit_id: '70', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5070', origin: 'Oklahoma City, OK', destination: 'Fresno, CA', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:10:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:10:00' },
  { id: '81', unit_id: '71', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:11:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:11:00' },
  { id: '82', unit_id: '72', status: 'rolling', note: '', load_number: 'LD-5072', origin: 'Salt Lake City, UT', destination: 'Reno, NV', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:12:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:12:00' },
  { id: '83', unit_id: '73', status: 'rolling', note: '', load_number: 'LD-5073', origin: 'San Antonio, TX', destination: 'Boise, ID', eta: '2026-04-07T07:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:13:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:13:00' },
  { id: '84', unit_id: '74', status: 'rolling', note: '', load_number: 'LD-5074', origin: 'El Paso, TX', destination: 'Omaha, NE', eta: '2026-04-07T08:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:14:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:14:00' },
  { id: '85', unit_id: '75', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5075', origin: 'Albuquerque, NM', destination: 'Des Moines, IA', eta: '2026-04-07T09:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:15:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:15:00' },
  { id: '86', unit_id: '76', status: 'rolling', note: '', load_number: 'LD-5076', origin: 'Tucson, AZ', destination: 'Little Rock, AR', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:16:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:16:00' },
  { id: '87', unit_id: '77', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5077', origin: 'Fresno, CA', destination: 'Birmingham, AL', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:17:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:17:00' },
  { id: '88', unit_id: '78', status: 'rolling', note: '', load_number: 'LD-5078', origin: 'Sacramento, CA', destination: 'Raleigh, NC', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:18:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:18:00' },
  { id: '89', unit_id: '79', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:19:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:19:00' },
  { id: '90', unit_id: '80', status: 'rolling', note: '', load_number: 'LD-5080', origin: 'Boise, ID', destination: 'Pittsburgh, PA', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:20:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:20:00' },
  { id: '91', unit_id: '81', status: 'rolling', note: '', load_number: 'LD-5081', origin: 'Omaha, NE', destination: 'Baltimore, MD', eta: '2026-04-07T15:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:21:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:21:00' },
  { id: '92', unit_id: '82', status: 'rolling', note: '', load_number: 'LD-5082', origin: 'Des Moines, IA', destination: 'Philadelphia, PA', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:22:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:22:00' },
  { id: '93', unit_id: '83', status: 'rolling', note: '', load_number: 'LD-5083', origin: 'Little Rock, AR', destination: 'Newark, NJ', eta: '2026-04-07T17:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T09:23:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:23:00' },
  { id: '94', unit_id: '84', status: 'rolling', note: '', load_number: 'LD-5084', origin: 'Birmingham, AL', destination: 'Boston, MA', eta: '2026-04-07T06:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T10:24:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:24:00' },
  { id: '95', unit_id: '85', status: 'rolling', note: '', load_number: 'LD-5085', origin: 'Raleigh, NC', destination: 'Buffalo, NY', eta: '2026-04-07T07:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T11:25:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:25:00' },
  { id: '96', unit_id: '86', status: 'rolling', note: 'Traffic delay', load_number: 'LD-5086', origin: 'Richmond, VA', destination: 'Cleveland, OH', eta: '2026-04-07T08:00:00', condition: 'getting_late', condition_note: 'Traffic delay', last_activity_at: '2026-04-06T12:26:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:26:00' },
  { id: '97', unit_id: '87', status: 'rolling', note: 'Mechanical issue reported', load_number: 'LD-5087', origin: 'Pittsburgh, PA', destination: 'Cincinnati, OH', eta: '2026-04-07T09:00:00', condition: 'issue', condition_note: 'Mechanical issue reported', last_activity_at: '2026-04-06T13:27:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:27:00' },
  { id: '98', unit_id: '88', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5088', origin: 'Baltimore, MD', destination: 'Louisville, KY', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:28:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:28:00' },
  { id: '99', unit_id: '89', status: 'at_receiver', note: '', load_number: 'LD-5089', origin: 'Philadelphia, PA', destination: 'Milwaukee, WI', eta: '2026-04-07T11:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:29:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:29:00' },
  { id: '100', unit_id: '90', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5090', origin: 'Newark, NJ', destination: 'Tampa, FL', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:30:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:30:00' },
  { id: '101', unit_id: '91', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:31:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:31:00' },
  { id: '102', unit_id: '92', status: 'rolling', note: '', load_number: 'LD-5092', origin: 'Buffalo, NY', destination: 'Savannah, GA', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:32:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:32:00' },
  { id: '103', unit_id: '93', status: 'rolling', note: '', load_number: 'LD-5093', origin: 'Cleveland, OH', destination: 'Dallas, TX', eta: '2026-04-07T15:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:33:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:33:00' },
  { id: '104', unit_id: '94', status: 'rolling', note: '', load_number: 'LD-5094', origin: 'Cincinnati, OH', destination: 'Houston, TX', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:34:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:34:00' },
  { id: '105', unit_id: '95', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5095', origin: 'Louisville, KY', destination: 'Los Angeles, CA', eta: '2026-04-07T17:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:35:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:35:00' },
  { id: '106', unit_id: '96', status: 'rolling', note: '', load_number: 'LD-5096', origin: 'Milwaukee, WI', destination: 'Chicago, IL', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:36:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:36:00' },
  { id: '107', unit_id: '97', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5097', origin: 'Tampa, FL', destination: 'Atlanta, GA', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:37:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:37:00' },
  { id: '108', unit_id: '98', status: 'rolling', note: '', load_number: 'LD-5098', origin: 'Orlando, FL', destination: 'Miami, FL', eta: '2026-04-07T08:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:38:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:38:00' },
  { id: '109', unit_id: '99', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:39:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:39:00' },
  { id: '110', unit_id: '100', status: 'rolling', note: '', load_number: 'LD-5100', origin: 'Dallas, TX', destination: 'Denver, CO', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:40:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:40:00' },
  { id: '111', unit_id: '101', status: 'rolling', note: '', load_number: 'LD-5101', origin: 'Houston, TX', destination: 'Seattle, WA', eta: '2026-04-07T11:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:41:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:41:00' },
  { id: '112', unit_id: '102', status: 'rolling', note: '', load_number: 'LD-5102', origin: 'Los Angeles, CA', destination: 'Portland, OR', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:42:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:42:00' },
  { id: '113', unit_id: '103', status: 'rolling', note: '', load_number: 'LD-5103', origin: 'Chicago, IL', destination: 'Nashville, TN', eta: '2026-04-07T13:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T09:43:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:43:00' },
  { id: '114', unit_id: '104', status: 'rolling', note: '', load_number: 'LD-5104', origin: 'Atlanta, GA', destination: 'Memphis, TN', eta: '2026-04-07T14:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T10:44:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:44:00' },
  { id: '115', unit_id: '105', status: 'rolling', note: '', load_number: 'LD-5105', origin: 'Miami, FL', destination: 'Charlotte, NC', eta: '2026-04-07T15:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T11:45:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:45:00' },
  { id: '116', unit_id: '106', status: 'rolling', note: 'Traffic delay', load_number: 'LD-5106', origin: 'Phoenix, AZ', destination: 'Jacksonville, FL', eta: '2026-04-07T16:00:00', condition: 'getting_late', condition_note: 'Traffic delay', last_activity_at: '2026-04-06T12:46:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:46:00' },
  { id: '117', unit_id: '107', status: 'rolling', note: 'Mechanical issue reported', load_number: 'LD-5107', origin: 'Denver, CO', destination: 'Columbus, OH', eta: '2026-04-07T17:00:00', condition: 'issue', condition_note: 'Mechanical issue reported', last_activity_at: '2026-04-06T13:47:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:47:00' },
  { id: '118', unit_id: '108', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5108', origin: 'Seattle, WA', destination: 'Indianapolis, IN', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:48:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:48:00' },
  { id: '119', unit_id: '109', status: 'at_receiver', note: '', load_number: 'LD-5109', origin: 'Portland, OR', destination: 'Detroit, MI', eta: '2026-04-07T07:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:49:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:49:00' },
  { id: '120', unit_id: '110', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5110', origin: 'Nashville, TN', destination: 'Minneapolis, MN', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:50:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:50:00' },
  { id: '121', unit_id: '111', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T07:51:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T07:51:00' },
  { id: '122', unit_id: '112', status: 'rolling', note: '', load_number: 'LD-5112', origin: 'Charlotte, NC', destination: 'Kansas City, MO', eta: '2026-04-07T10:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T08:52:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T08:52:00' },
  { id: '123', unit_id: '113', status: 'rolling', note: '', load_number: 'LD-5113', origin: 'Jacksonville, FL', destination: 'Oklahoma City, OK', eta: '2026-04-07T11:00:00', condition: 'on_time', condition_note: '', last_activity_at: '2026-04-06T09:53:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T09:53:00' },
  { id: '124', unit_id: '114', status: 'rolling', note: '', load_number: 'LD-5114', origin: 'Columbus, OH', destination: 'Las Vegas, NV', eta: '2026-04-07T12:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T10:54:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T10:54:00' },
  { id: '125', unit_id: '115', status: 'at_shipper', note: 'Waiting at dock', load_number: 'LD-5115', origin: 'Indianapolis, IN', destination: 'Salt Lake City, UT', eta: '2026-04-07T13:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T11:55:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T11:55:00' },
  { id: '126', unit_id: '116', status: 'rolling', note: '', load_number: 'LD-5116', origin: 'Detroit, MI', destination: 'San Antonio, TX', eta: '2026-04-07T14:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T12:56:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T12:56:00' },
  { id: '127', unit_id: '117', status: 'sleeping', note: 'HOS rest', load_number: 'LD-5117', origin: 'Minneapolis, MN', destination: 'El Paso, TX', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T13:57:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T13:57:00' },
  { id: '128', unit_id: '118', status: 'rolling', note: '', load_number: 'LD-5118', origin: 'St. Louis, MO', destination: 'Albuquerque, NM', eta: '2026-04-07T16:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T14:58:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T14:58:00' },
  { id: '129', unit_id: '119', status: 'no_load', note: '', load_number: '', origin: '', destination: '', eta: '', condition: null, condition_note: '', last_activity_at: '2026-04-06T15:59:00', updated_by: 'Mike Johnson', updated_at: '2026-04-06T15:59:00' },
  { id: '130', unit_id: '120', status: 'rolling', note: '', load_number: 'LD-5120', origin: 'Oklahoma City, OK', destination: 'Fresno, CA', eta: '2026-04-07T06:00:00', condition: null, condition_note: '', last_activity_at: '2026-04-06T06:00:00', updated_by: 'Alex Brown', updated_at: '2026-04-06T06:00:00' },
];

export const unitStatusLog: UnitStatusLogEntry[] = [
  { id: '1',  unit_id: '5',  previous_status: 'rolling',      new_status: 'rolling', note: 'Heavy traffic on I-75, 2h delay',  load_number: 'LD-4519', changed_by: 'Mike Johnson', changed_at: '2026-04-06T10:15:00' },
  { id: '2',  unit_id: '10', previous_status: 'rolling',      new_status: 'rolling', note: 'Delayed at weigh station',         load_number: 'LD-4526', changed_by: 'Alex Brown',   changed_at: '2026-04-06T10:00:00' },
  { id: '3',  unit_id: '9',  previous_status: 'rolling',      new_status: 'at_receiver',  note: 'Unloading in progress',            load_number: 'LD-4518', changed_by: 'Mike Johnson', changed_at: '2026-04-06T09:30:00' },
  { id: '4',  unit_id: '4',  previous_status: 'sleeping',     new_status: 'rolling',      note: '',                                 load_number: 'LD-4523', changed_by: 'Alex Brown',   changed_at: '2026-04-06T09:00:00' },
  { id: '5',  unit_id: '1',  previous_status: 'sleeping',     new_status: 'rolling',      note: '',                                 load_number: 'LD-4521', changed_by: 'Mike Johnson', changed_at: '2026-04-06T08:30:00' },
  { id: '6',  unit_id: '8',  previous_status: 'at_shipper',   new_status: 'rolling',      note: '',                                 load_number: 'LD-4525', changed_by: 'Alex Brown',   changed_at: '2026-04-06T08:00:00' },
  { id: '7',  unit_id: '2',  previous_status: 'rolling',      new_status: 'at_shipper',   note: 'Waiting for loading dock',         load_number: 'LD-4522', changed_by: 'Alex Brown',   changed_at: '2026-04-06T07:15:00' },
  { id: '8',  unit_id: '3',  previous_status: 'rolling',      new_status: 'rolling',        note: 'Brake pressure warning light on',  load_number: 'LD-4510', changed_by: 'Mike Johnson', changed_at: '2026-04-06T06:45:00' },
  { id: '9',  unit_id: '6',  previous_status: 'rolling',      new_status: 'sleeping',     note: 'HOS rest — 8h break',              load_number: 'LD-4524', changed_by: 'Alex Brown',   changed_at: '2026-04-06T02:00:00' },
  { id: '10', unit_id: '7',  previous_status: 'at_receiver',  new_status: 'no_load',      note: '',                                 load_number: '',        changed_by: 'Mike Johnson', changed_at: '2026-04-05T14:00:00' },
  { id: '11', unit_id: '1',  previous_status: 'rolling',      new_status: 'sleeping',     note: 'HOS rest',                         load_number: 'LD-4521', changed_by: 'Mike Johnson', changed_at: '2026-04-05T22:00:00' },
  { id: '12', unit_id: '4',  previous_status: 'rolling',      new_status: 'sleeping',     note: 'HOS rest — 10h break',             load_number: 'LD-4523', changed_by: 'Alex Brown',   changed_at: '2026-04-05T23:30:00' },
  { id: '13', unit_id: '5',  previous_status: 'at_shipper',   new_status: 'rolling',      note: 'Loaded and departing',             load_number: 'LD-4519', changed_by: 'Mike Johnson', changed_at: '2026-04-05T16:00:00' },
  { id: '14', unit_id: '9',  previous_status: 'at_shipper',   new_status: 'rolling',      note: '',                                 load_number: 'LD-4518', changed_by: 'Mike Johnson', changed_at: '2026-04-05T10:00:00' },
  { id: '15', unit_id: '3',  previous_status: 'at_shipper',   new_status: 'rolling',      note: '',                                 load_number: 'LD-4510', changed_by: 'Alex Brown',   changed_at: '2026-04-05T08:00:00' },
];

export function getUnit(id: string) { return units.find(u => u.id === id); }
export function getUnitByNumber(num: string) { return units.find(u => u.unit_number === num); }

export const defaultOilThresholds = { critical: 2000, warning: 5000, soon: 10000 }

export function oilStatus(remaining: number, _interval: number, thresholds = defaultOilThresholds): 'critical' | 'warning' | 'ok' | 'good' {
  if (remaining <= thresholds.critical) return 'critical';
  if (remaining <= thresholds.warning) return 'warning';
  if (remaining <= thresholds.soon) return 'ok';
  return 'good';
}

export function daysStatus(days: number): 'expired' | 'critical' | 'warning' | 'soon' | 'valid' {
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  if (days <= 90) return 'soon';
  return 'valid';
}
