## МОДУЛЬ 9: DVIR (Driver Vehicle Inspection Reports)

### Описание
Электронные pre-trip / post-trip inspections по требованиям FMCSA 49 CFR §396.11. Вдохновлено Samsara DVIR module который автоматически создаёт work orders из defects.

### Таблицы
```sql
CREATE TYPE dvir_type AS ENUM ('pre_trip', 'post_trip');
CREATE TYPE dvir_status AS ENUM ('clean', 'defects_noted', 'out_of_service');

CREATE TABLE dvir_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  report_type dvir_type NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- FMCSA standard checklist items (JSONB)
  items_checked JSONB NOT NULL DEFAULT '[]',
  -- Example: [{"item":"brakes","status":"pass"},{"item":"tires","status":"fail","note":"Left rear low"}]
  defects_found BOOLEAN DEFAULT false,
  overall_notes TEXT,
  odometer_reading INTEGER,
  signature_url TEXT,
  status dvir_status NOT NULL DEFAULT 'clean',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Стандартный чеклист FMCSA
```typescript
const DVIR_CHECKLIST = [
  'brakes', 'tires', 'lights_signals', 'mirrors', 'steering',
  'coupling_devices', 'exhaust_system', 'emergency_equipment',
  'windshield_wipers', 'horn', 'seat_belts', 'fluid_levels',
  'suspension', 'frame', 'wheels_rims', 'air_lines',
  'reflectors', 'battery', 'defroster_heater'
];
```

### UI
- **Form**: чеклист с pass/fail toggle per item, text field for notes per failed item, overall notes, odometer, signature pad (canvas)
- **Archive**: table с filters (unit, driver, date, status), search
- **Report Card**: date, unit, driver, status badge, checklist summary (X pass / Y fail), expand to see details

### Логика (автоматическое создание Defect)
```
IF defects_found = true THEN
  FOR EACH item IN items_checked WHERE status = 'fail'
    INSERT INTO defects (unit_id, dvir_report_id, defect_description, severity, reported_by, reported_date)
    VALUES (report.unit_id, report.id, item.item + ': ' + item.note, 'moderate', report.created_by, report.report_date)
  END FOR
END IF
```

---

## МОДУЛЬ 10: DISPATCHING (Новый — вдохновлён QuickManage)

### Описание
Базовый dispatching для управления грузами (loads). QuickManage строит весь продукт вокруг dispatching. Мы добавляем упрощённую версию, интегрированную с нашим fleet management.

### Таблицы
```sql
CREATE TYPE load_status AS ENUM (
  'pending', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled'
);

CREATE TABLE loads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_number VARCHAR(20) UNIQUE NOT NULL, -- auto-generated: LD-0001
  unit_id UUID REFERENCES units(id),
  driver_id UUID REFERENCES drivers(id),
  trailer_id UUID REFERENCES trailers(id),
  -- Shipper
  shipper_name VARCHAR(200),
  pickup_address TEXT,
  pickup_city VARCHAR(100),
  pickup_state VARCHAR(2),
  pickup_zip VARCHAR(10),
  pickup_date DATE,
  pickup_time TIME,
  -- Consignee
  consignee_name VARCHAR(200),
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(2),
  delivery_zip VARCHAR(10),
  delivery_date DATE,
  delivery_time TIME,
  -- Financial
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  rate_type VARCHAR(20) DEFAULT 'flat', -- flat, per_mile
  total_miles INTEGER,
  -- Status
  status load_status DEFAULT 'pending',
  -- Documents
  bol_number VARCHAR(50), -- Bill of Lading
  bol_document_url TEXT,
  pod_document_url TEXT, -- Proof of Delivery
  -- Metadata
  commodity VARCHAR(200),
  weight DECIMAL(10,2),
  special_instructions TEXT,
  dispatched_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE load_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID REFERENCES loads(id) ON DELETE CASCADE,
  old_status load_status,
  new_status load_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **Load Board**: Kanban-style columns по статусам (Pending → Dispatched → In Transit → Delivered → Invoiced → Paid)
- **Load Card**: load#, unit, driver, pickup→delivery cities, rate, status badge
- **Create Load Modal**: shipper info, consignee info, assign unit+driver+trailer, rate, dates
- **Load Detail Page**: header с маршрутом, timeline статусов, documents (BOL, POD), financials
- **Table view**: с sorting, filtering, total revenue

### Логика
- При создании load с assigned unit → unit status не меняется (unit может иметь несколько loads)
- Status change → записывается в load_status_history
- При статусе 'delivered' → auto-prompt для upload POD
- При статусе 'invoiced' → генерация invoice (см. Accounting)

---

## МОДУЛЬ 11: ACCOUNTING (Базовый — вдохновлён QuickManage)

### Описание
Базовый accounting для track расходов и доходов. QuickManage предлагает полный accounting с invoicing, P&L, settlements. Мы реализуем упрощённую версию.

### Таблицы
```sql
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE expense_category AS ENUM (
  'fuel', 'repair', 'insurance', 'toll', 'permits', 'tires',
  'salary', 'lease', 'office', 'other'
);

CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date DATE NOT NULL,
  type transaction_type NOT NULL,
  category expense_category,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  unit_id UUID REFERENCES units(id), -- nullable
  driver_id UUID REFERENCES drivers(id), -- nullable
  load_id UUID REFERENCES loads(id), -- nullable, link to load for income
  vendor_id UUID REFERENCES vendors(id), -- nullable
  document_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL, -- auto: INV-0001
  load_id UUID REFERENCES loads(id),
  customer_name VARCHAR(200),
  customer_email VARCHAR(255),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue
  paid_date DATE,
  document_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE driver_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_pay DECIMAL(12,2) NOT NULL,
  deductions JSONB DEFAULT '[]', -- [{description, amount}]
  net_pay DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, approved, paid
  approved_by UUID REFERENCES profiles(id),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **Dashboard KPIs**: Revenue (month), Expenses (month), Net Profit, Outstanding Invoices, Overdue Invoices
- **Transactions Page**: table с income (green) / expense (red) highlighting, filters by category/unit/date
- **Invoices Page**: table, Create Invoice from Load, status badges (draft=gray, sent=blue, paid=green, overdue=red)
- **P&L Report**: monthly revenue vs expenses chart (Recharts), category breakdown
- **Driver Settlements**: per-driver pay calculation

### Логика
- Load delivered + invoiced → auto-create transaction (income)
- Fuel entry → auto-create transaction (expense, category=fuel)
- Repair created → auto-create transaction (expense, category=repair)
- Invoice overdue = due_date < today AND status != 'paid'

---

