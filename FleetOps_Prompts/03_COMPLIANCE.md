## МОДУЛЬ 5: DOT INSPECTION

### Описание
Трекинг ежегодных DOT (Department of Transportation) технических инспекций. Каждый truck должен пройти annual inspection. Вдохновлено Samsara Compliance module.

### Таблицы
```sql
CREATE TABLE inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  trailer_id UUID REFERENCES trailers(id), -- nullable, для трейлеров
  document_id VARCHAR(50),
  document_url TEXT,
  inspection_date DATE NOT NULL,
  expiry_date DATE NOT NULL, -- inspection_date + 1 year
  inspector_name VARCHAR(100),
  inspection_location VARCHAR(200),
  result VARCHAR(20) DEFAULT 'passed', -- passed/failed/conditional
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Цветовая логика (дни до истечения)
| Цвет | Дней | Значение |
|------|------|----------|
| 🟢 Green | > 90 | Действителен |
| 🟡 Yellow | 30–90 | Планировать обновление |
| 🟠 Orange | 7–30 | Срочно |
| 🔴 Red | < 7 или истёк | Truck не может работать |

### UI
- **Table view**: Unit, Driver, VIN, Document#, Inspection Date, Expiry Date, Days Remaining, Cycle (progress bar), Status
- **Cards view**: SVG countdown ring (days remaining), certificate number, dates, progress bar
- **KPI Cards**: Expired/<7d (red), Urgent 7-30d (orange), Soon 30-90d (yellow), Valid >90d (green)

---

## МОДУЛЬ 6: REGISTRATION

### Описание
Трекинг регистрации грузовиков. Та же day-based color logic что и DOT Inspection.

### Таблицы
```sql
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  trailer_id UUID REFERENCES trailers(id), -- nullable
  vin VARCHAR(17),
  state VARCHAR(2),
  plate_number VARCHAR(20),
  document_id VARCHAR(50),
  document_url TEXT,
  registration_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- Table + Cards view (SVG countdown ring, plate/state, document link, progress bar, Renew button)
- Та же цветовая логика что и Inspections

---

## МОДУЛЬ 7: REPAIRS

### Описание
Полная история ремонтов с категориями, стоимостью и привязкой к поставщикам. Вдохновлено Samsara Maintenance Cost Reporting + QuickManage Fleet module.

### Таблицы
```sql
CREATE TYPE repair_category AS ENUM (
  'brakes', 'engine', 'tires', 'suspension', 'electrical',
  'hvac', 'transmission', 'exhaust', 'body', 'other'
);

CREATE TABLE repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  repair_date DATE NOT NULL,
  document_id VARCHAR(50),
  document_url TEXT,
  service_name VARCHAR(200) NOT NULL,
  category repair_category DEFAULT 'other',
  vendor_id UUID REFERENCES vendors(id),
  shop_name VARCHAR(200),
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  parts_cost DECIMAL(10,2) DEFAULT 0,
  mileage_at_repair INTEGER,
  warranty_claim BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **Table**: Unit, Driver, Date, Invoice#, Service Name, Category badge (цветной per category), Shop, Cost
- **KPI**: Total Repair Cost, Average per Unit, Most Expensive Unit, Category Breakdown
- **Category color badges**: Brakes=red, Engine=orange, Tires=blue, Suspension=purple, Electrical=yellow, HVAC=cyan, Transmission=pink
- **Features**: Filter by category/unit/date range, Group by Unit toggle, Total cost summary, Export CSV/Excel
- **Repair Cost Analytics chart** (Recharts): bar chart по месяцам, pie chart по категориям

---

## МОДУЛЬ 8: DEFECTS

### Описание
Defect tracking с workflow active→resolved, severity levels, pulsing indicators. Вдохновлено Samsara DVIR defect auto-creation + QuickManage Safety module.

### Таблицы
```sql
CREATE TYPE defect_severity AS ENUM ('critical', 'moderate', 'low');

CREATE TABLE defects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  dvir_report_id UUID REFERENCES dvir_reports(id), -- nullable, auto-link from DVIR
  defect_description TEXT NOT NULL,
  severity defect_severity DEFAULT 'moderate',
  reported_by UUID REFERENCES profiles(id),
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved BOOLEAN DEFAULT false,
  resolved_date DATE,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  linked_repair_id UUID REFERENCES repairs(id), -- optional link to repair
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **Cards**: left-border color by severity (critical=red, moderate=orange, low=yellow), defect description, reported by, date, severity badge, active/resolved badge
- **Active defects**: pulsing red indicator on Dashboard
- **Resolve button**: opens modal → optional resolution notes + optional link to repair record → sets resolved=true, resolved_date=today, resolved_by=current_user

### Workflow
1. Driver reports issue to dispatcher (phone/radio)
2. Dispatcher creates defect in system (description + severity)
3. Defect appears on Dashboard "Active Defects" column with pulsing indicator
4. When repaired → authorized user clicks Resolve → optionally links repair record
5. Defect → Resolved (green)

---

