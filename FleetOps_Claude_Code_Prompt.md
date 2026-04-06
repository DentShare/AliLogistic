# ПРОМТ ДЛЯ CLAUDE CODE: Полная реализация FleetOps Platform

## Контекст проекта

Ты реализуешь FleetOps — web-based fleet management platform для логистической компании, управляющей автопарком грузовиков в США из Узбекистана. Платформа объединяет функциональность двух лидеров рынка:

1. **Samsara** — телематика, preventive maintenance, DVIR, compliance, AI-диагностика, work orders
2. **QuickManage TMS** — dispatching, accounting, fleet management, safety & HR, AI-ассистент

FleetOps берёт лучшее из обоих, но фокусируется на **technical fleet management + dispatching + accounting** в одной платформе, без необходимости покупать дорогое IoT-оборудование.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + TypeScript, Tailwind CSS, Recharts, Lucide React icons |
| Backend | Supabase (PostgreSQL 15+, Auth, Edge Functions, Realtime, Storage) |
| Auth | Supabase Auth с Row Level Security (RLS) per role |
| Hosting | Vercel (frontend), Supabase Cloud (backend) |
| File Storage | Supabase Storage (documents, invoices, receipts, certificates) |
| State Management | Zustand или React Context + useReducer |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack Table v8 |
| Date handling | date-fns с timezone support (date-fns-tz) |
| PDF export | @react-pdf/renderer |
| Excel export | SheetJS (xlsx) |

---

## Роли пользователей (4 роли)

| Роль | Описание |
|------|----------|
| **Admin** | Полный доступ ко всему. Управление пользователями, удаление записей |
| **Director** | Просмотр всего, создание/редактирование, экспорт, audit log. Без удаления и управления users |
| **Dispatcher** | Ежедневная работа: ввод пробега, создание записей, defects, loads. Редактирование своих записей |
| **Viewer** | Только просмотр dashboard и всех модулей. Без какого-либо ввода данных |

---

## МОДУЛЬ 1: AUTHENTICATION & USER MANAGEMENT

### Описание
Система аутентификации на Supabase Auth с email/password. Профили пользователей хранятся в таблице `profiles`.

### Таблица: profiles
```sql
CREATE TYPE user_role AS ENUM ('admin', 'director', 'dispatcher', 'viewer');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  avatar_url TEXT,
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  language VARCHAR(5) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policy Pattern
```sql
-- Все авторизованные пользователи могут читать
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
-- Только admin может изменять
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### UI
- Login page: email + password, логотип FleetOps, тёмная тема
- После логина — redirect на Dashboard
- Header: аватар пользователя, имя, роль badge, dropdown (Profile, Settings, Logout)
- Admin → страница Users Management: таблица пользователей, создание/деактивация

### Логика
- При регистрации (только admin создаёт) → insert в auth.users + profiles
- JWT token содержит user_id → все RLS policies проверяют через auth.uid()
- Session expiry: 24 часа, refresh token: 7 дней
- Trigger: при логине обновлять last_login в profiles

---

## МОДУЛЬ 2: UNITS (TRUCKS) MANAGEMENT

### Описание
Центральная сущность — Unit (грузовик). Идентифицируется **unit_number** (T-101, T-102...) — это якорь, который никогда не меняется. VIN и водитель могут меняться. Вдохновлено концепцией Samsara Vehicle Management + QuickManage Fleet Module.

### Таблицы
```sql
CREATE TYPE unit_status AS ENUM ('active', 'inactive', 'in_repair');

CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number VARCHAR(20) UNIQUE NOT NULL,
  current_vin VARCHAR(17),
  current_driver_id UUID REFERENCES drivers(id),
  status unit_status NOT NULL DEFAULT 'active',
  current_mileage INTEGER NOT NULL DEFAULT 0,
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  license_plate VARCHAR(20),
  plate_state VARCHAR(2),
  color VARCHAR(30),
  fuel_type VARCHAR(20) DEFAULT 'diesel',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vehicle_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  assigned_date DATE NOT NULL,
  removed_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE driver_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  driver_name VARCHAR(100) NOT NULL,
  assigned_date DATE NOT NULL,
  removed_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **Units List Page**: KPI cards (Total Fleet, Active, In Repair, Inactive) + Cards/Table toggle
- **Unit Card**: unit_number большим шрифтом, status badge (цветной), VIN, driver, mileage, mini-badges (Oil status, DOT status, Defects count)
- **Create Truck Modal**: two-column layout — Unit Number + VIN, Driver, Make + Model + Year
- **Unit Profile Page**: Header с unit_number, status, driver, VIN, mileage + Tabs:
  - Overview: KPI (Mileage, Repair Costs, Active Defects, Swaps), Status cards (Oil, DOT, Reg), Activity Timeline
  - Vehicles: VIN history с CURRENT/PREVIOUS badges
  - Drivers: driver history с date ranges
  - Oil: карточки по типу масла с progress bar
  - Repairs: таблица ремонтов с category badges
  - Defects: карточки дефектов с severity
  - Documents: все документы unit
  - Change Log: audit trail (Admin/Director)

### Логика
- При смене VIN → текущий VIN записывается в vehicle_history с removed_date = today, новый VIN → новая запись с assigned_date = today
- При смене водителя → аналогично через driver_history
- current_mileage обновляется через mileage_logs (валидация: новый >= старый)

---

## МОДУЛЬ 3: DRIVERS HR (Расширенный)

### Описание
Полное управление водителями с отслеживанием CDL, Medical Card, DQ Files. Вдохновлено Samsara Driver Management + QuickManage Safety & HR.

### Таблицы
```sql
CREATE TYPE driver_status AS ENUM ('working', 'reviewing', 'terminated');
CREATE TYPE cdl_class AS ENUM ('A', 'B', 'C');

CREATE TABLE drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  cdl_number VARCHAR(30),
  cdl_state VARCHAR(2),
  cdl_class cdl_class DEFAULT 'A',
  cdl_expiry_date DATE,
  medical_card_number VARCHAR(30),
  medical_card_expiry_date DATE,
  hire_date DATE,
  termination_date DATE,
  status driver_status NOT NULL DEFAULT 'working',
  current_unit_id UUID REFERENCES units(id),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  license_document_url TEXT,
  medical_document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- **KPI Cards**: Working (зелёный), Reviewing (жёлтый), Terminated (красный), Expiring Docs (<90д, оранжевый), Avg Tenure
- **Cards view**: Аватар с инициалами (цвет по статусу: working=green, reviewing=yellow, terminated=red), ФИО, phone, hire date, tenure, assigned unit, CDL badge + expiry, Medical badge + expiry
- **Table view**: Name, Status, Phone, Unit, CDL#, CDL Expiry, Medical Expiry, Tenure, Hired
- **Driver Profile Modal/Page**: все данные + загрузка документов

### Цветовая индикация сроков (CDL и Medical)
| Цвет | Дней до истечения | Значение |
|------|-------------------|----------|
| 🟢 Green | > 90 дней | Действителен |
| 🟡 Yellow | 30–90 дней | Планировать обновление |
| 🟠 Orange | 7–30 дней | Срочно обновить |
| 🔴 Red | < 7 дней или истёк | Водитель не может работать |

### Логика
- CDL/Medical expiry alert → появляется на Dashboard в колонке "CDL/Medical Expiring"
- При назначении водителя на unit → проверка: CDL и Medical не истекли
- Интеграция: units.current_driver_id FK → drivers.id

---

## МОДУЛЬ 4: OIL & FLUIDS (Основной модуль ТО)

### Описание
Ключевой модуль FleetOps. Трекинг замены масел и жидкостей с процентной цветовой индикацией + workflow Send→Done. Аналогов в Samsara и QuickManage нет — это наше конкурентное преимущество. Samsara предлагает только базовый preventive maintenance по пробегу/времени.

### Таблицы
```sql
CREATE TYPE maintenance_trigger AS ENUM ('mileage', 'time', 'both');

CREATE TABLE oil_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  oil_type VARCHAR(100) NOT NULL,
  last_changed_mileage INTEGER NOT NULL,
  change_interval INTEGER NOT NULL,
  next_change_mileage INTEGER GENERATED ALWAYS AS (last_changed_mileage + change_interval) STORED,
  -- Time-based maintenance (inspired by Samsara dual triggers)
  trigger_type maintenance_trigger DEFAULT 'mileage',
  time_interval_days INTEGER,
  last_service_date DATE,
  next_service_date DATE, -- computed: last_service_date + time_interval_days
  -- Sent for change workflow
  sent_for_change BOOLEAN DEFAULT false,
  sent_date TIMESTAMPTZ,
  sent_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Вычисляемые поля (в коде, не в БД)
```typescript
// remaining_miles = next_change_mileage - unit.current_mileage
// remaining_percent = remaining_miles / change_interval * 100
// days_remaining = next_service_date - today (если trigger_type includes time)
// effective_status = worst of (mileage_status, time_status) если trigger_type = 'both'
```

### Цветовая логика (процент остатка)
| Цвет | Процент | Значение |
|------|---------|----------|
| 🟢 Green | > 50% | Здоров |
| 🟡 Yellow | 25–50% | Планировать замену |
| 🟠 Orange | 10–25% | Скоро нужна замена |
| 🔴 Red | < 10% | Критично / Просрочено |
| 🔵 Blue | Sent for change | Отправлен на замену |

### UI
- **Table**: Unit, VIN, Oil Type (editable inline), Current Mileage, Next Change At, Last Changed At, Change Interval (editable inline), Remaining Miles, Days to Service, Status badge
- **Sort**: по remaining miles (самые критичные сверху)
- **3 кнопки действий per record**:
  - 📊 **Mileage** — modal для ввода текущего одометра. Обновляет unit.current_mileage и пересчитывает remaining для ВСЕХ oil records этого unit
  - 🚛 **Send** — toggle sent_for_change = true. Статус → Blue. Truck перемещается в Dashboard колонку "Sent for Change"
  - ✅ **Done** — modal для записи завершённой замены. Вводит mileage at change → lastChanged = entered mileage, nextChange = mileage + interval, remaining resets, sent_for_change = false

### Oil Types (предустановленные + кастомные)
| Тип | Интервал пробега | Интервал дней |
|-----|------------------|---------------|
| Engine Oil 15W-40 | 15,000 mi | 180 дней |
| Transmission Fluid | 30,000 mi | 365 дней |
| Differential Oil | 50,000 mi | 730 дней |
| Coolant | 40,000 mi | 730 дней |
| Power Steering | 60,000 mi | 730 дней |

### Логика Send→Done
1. Диспетчер ежедневно вводит Mileage → remaining уменьшается
2. Когда remaining ≤ 25% → truck появляется в Dashboard "Oil Change Needed"
3. Director/Dispatcher нажимает Send → статус Blue → перемещается в "Sent for Change"
4. После физической замены → Dispatcher нажимает Done → вводит mileage → remaining resets → статус Green

---

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

## МОДУЛЬ 12: FUEL MANAGEMENT

### Описание
Учёт топлива с MPG аналитикой. Samsara предлагает fuel usage reports с idle time tracking. QuickManage интегрируется с fuel cards. Мы делаем manual entry + analytics.

### Таблицы
```sql
CREATE TABLE fuel_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  fuel_date DATE NOT NULL,
  gallons DECIMAL(8,2) NOT NULL,
  price_per_gallon DECIMAL(6,3) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (gallons * price_per_gallon) STORED,
  fuel_type VARCHAR(20) DEFAULT 'diesel', -- diesel, DEF, gasoline
  odometer_at_fill INTEGER NOT NULL,
  location_state VARCHAR(2),
  location_city VARCHAR(100),
  station_name VARCHAR(200),
  receipt_url TEXT,
  entered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Вычисляемые метрики (в коде)
```typescript
// MPG per unit = miles between fills / gallons
// Средний MPG по флоту
// Стоимость за милю = total_cost / miles
// Аномалия = MPG < 80% от average MPG этого unit
```

### UI
- **Table**: Unit, Driver, Date, Gallons, Price/Gal, Total Cost, Odometer, Location, MPG
- **KPI Cards**: Total Fuel Cost ($), Avg Fleet MPG, Anomalies count, Top 3 expensive units
- **Charts**: MPG trend per unit (line chart), Fuel cost per month (bar chart), Anomalies highlighted red
- **Add Entry Modal**: unit, driver, date, gallons, price, state, city, station, upload receipt

---

## МОДУЛЬ 13: IFTA REPORTING

### Описание
Квартальная IFTA отчётность — пробег по штатам и расход топлива. Samsara автоматизирует IFTA через GPS. Мы делаем manual entry с расчётом налога.

### Таблицы
```sql
CREATE TABLE ifta_mileage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  state_code VARCHAR(2) NOT NULL,
  miles_driven INTEGER NOT NULL DEFAULT 0,
  fuel_gallons_purchased DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (unit_id, quarter, year, state_code)
);
```

### UI
- **Quarterly Report Table**: State, Miles Driven, Gallons Purchased, Gallons Consumed (computed), Tax Rate, Tax Due/Refund
- **Filter**: by quarter, year, unit
- **Export**: CSV/Excel for filing
- **Reminders**: alerts 14 days before deadlines (April 30, July 31, October 31, January 31)

---

## МОДУЛЬ 14: INSURANCE TRACKING

### Описание
Отслеживание страховых полисов. Провал в coverage = остановка бизнеса.

### Таблицы
```sql
CREATE TYPE insurance_type AS ENUM (
  'liability', 'cargo', 'physical_damage', 'workers_comp',
  'general', 'umbrella', 'bobtail'
);

CREATE TABLE insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_type insurance_type NOT NULL,
  provider_name VARCHAR(200) NOT NULL,
  policy_number VARCHAR(50),
  coverage_amount DECIMAL(14,2),
  premium_amount DECIMAL(12,2),
  deductible DECIMAL(10,2),
  effective_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  document_url TEXT,
  applies_to VARCHAR(20) DEFAULT 'fleet_wide', -- fleet_wide, specific
  unit_id UUID REFERENCES units(id), -- nullable, if specific
  agent_name VARCHAR(100),
  agent_phone VARCHAR(20),
  agent_email VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Цветовая логика — аналогична DOT Inspection (days remaining)

### UI
- **Cards**: policy type icon, provider, policy#, coverage amount, dates, countdown ring
- **KPI**: Active Policies, Expiring <30d, Total Coverage, Total Annual Premium
- **Dashboard alert** при приближении expiry

---

## МОДУЛЬ 15: TRAILER MANAGEMENT

### Описание
Отдельное управление трейлерами. Вдохновлено Samsara Trailer Tracking.

### Таблицы
```sql
CREATE TYPE trailer_type AS ENUM ('dry_van', 'reefer', 'flatbed', 'tanker', 'lowboy', 'step_deck');
CREATE TYPE trailer_status AS ENUM ('active', 'inactive', 'in_repair');

CREATE TABLE trailers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trailer_number VARCHAR(20) UNIQUE NOT NULL,
  vin VARCHAR(17),
  trailer_type trailer_type NOT NULL DEFAULT 'dry_van',
  status trailer_status DEFAULT 'active',
  current_unit_id UUID REFERENCES units(id), -- currently attached to
  registration_state VARCHAR(2),
  plate_number VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trailer_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trailer_id UUID REFERENCES trailers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  attached_date DATE NOT NULL,
  detached_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- Sidebar → "Trailers" tab
- Cards: trailer#, type badge, VIN, current tractor, status, inspection/registration badges
- Trailer Profile: Overview, Inspections, Registration, Repairs, Defects, Attachment History

---

## МОДУЛЬ 16: VENDORS

### Описание
Справочник поставщиков. Интеграция с repairs.

### Таблицы
```sql
CREATE TYPE vendor_type AS ENUM (
  'mechanic_shop', 'parts_supplier', 'tire_shop', 'dealer',
  'fuel_station', 'body_shop', 'towing', 'other'
);

CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  vendor_type vendor_type DEFAULT 'mechanic_shop',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(100),
  website VARCHAR(255),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- Cards: name, type badge, contact info, total spend amount, average repair cost
- Analytics: total spend per vendor chart, visit count

---

## МОДУЛЬ 17: MILEAGE LOGS

### Описание
Ежедневный ввод пробега диспетчерами. Основа для всех расчётов oil remaining, MPG и т.д.

### Таблицы
```sql
CREATE TABLE mileage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  entered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (unit_id, log_date)
);
```

### UI
- Bulk entry page: список всех active units → input field per unit → Save All
- Validation: new mileage >= previous mileage
- History: table per unit с daily entries

### Логика
- On save → UPDATE units SET current_mileage = new_value
- Trigger recalculation of ALL oil_changes remaining for that unit
- Dashboard updates via Supabase Realtime

---

## МОДУЛЬ 18: AUDIT LOG

### Описание
Полный audit trail всех изменений. Критично для DOT-аудита. Вдохновлено Samsara audit trail + QuickManage change tracking.

### Таблицы
```sql
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');

CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Автоматическое логирование через Supabase Trigger
```sql
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach to every table
CREATE TRIGGER audit_units AFTER INSERT OR UPDATE OR DELETE ON units
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
-- ... repeat for all tables
```

### UI (Admin + Director only)
- **KPI Cards**: Total Changes, Today, Most Modified Unit, Mini bar chart 14 days
- **Dispatcher Cards**: avatar, name, total changes, modules touched
- **Table**: Timestamp, User (avatar), Unit, Module badge, Description, Field, Old→New (old strikethrough red, new green)
- **Filters**: by user, unit, module, date range

---

## МОДУЛЬ 19: DASHBOARD (Главная страница)

### Описание
Центральный dashboard с KPI cards и problem columns. Вдохновлено Samsara Fleet Dashboard + QuickManage Operations Dashboard.

### KPI Summary Cards (top row)
1. **Fleet Size**: total active trucks (green number)
2. **Oil Urgent**: count trucks ≤25% remaining AND not sent (red/orange)
3. **Inspection Due**: trucks with inspection <30 days (orange)
4. **Registration Due**: trucks with registration <30 days (orange)
5. **Active Defects**: unresolved defects count (red)
6. **CDL/Medical Expiring**: drivers with docs <90d (orange)
7. **Insurance Expiring**: policies <30d (orange)
8. **Repair Costs**: total current month ($)
9. **Fuel Cost**: total current month ($)
10. **Pending Loads**: loads in pending/dispatched status

### Problem Columns (main area)
| Column | Condition | Color |
|--------|-----------|-------|
| Oil Change Needed | ≤25% remaining AND NOT sent | Red/Orange pulse |
| Sent for Change | sent_for_change = true | Blue |
| Inspection Due | DOT <30 days | Orange |
| Registration Due | Registration <30 days | Orange |
| Active Defects | resolved = false | Red pulse |
| CDL/Medical Expiring | <90 days | Yellow/Orange |
| Insurance Due | <30 days | Orange |
| In Repair | unit.status = 'in_repair' | Gray |
| All Clear | no issues | Green |

### Truck Card в column
- Unit number (large font, JetBrains Mono)
- Driver name
- VIN (truncated)
- Current mileage
- Problem-specific detail (e.g., "Engine Oil: 2,340 mi remaining")

### Логика
- Real-time updates via Supabase Realtime subscriptions
- Clicking card → navigates to relevant module filtered to that unit
- Auto-refresh every 30 seconds

---

## МОДУЛЬ 20: NOTIFICATIONS

### Описание
In-app и email нотификации. Вдохновлено Samsara Advanced Alerting (15+ categories).

### Таблицы
```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- oil_critical, inspection_expiring, defect_new, etc.
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
  unit_id UUID REFERENCES units(id),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  link_to VARCHAR(200), -- URL path to navigate
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) UNIQUE,
  email_oil_critical BOOLEAN DEFAULT true,
  email_inspection_expiring BOOLEAN DEFAULT true,
  email_defect_new BOOLEAN DEFAULT true,
  email_cdl_expiring BOOLEAN DEFAULT true,
  email_insurance_expiring BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI
- Bell icon в header с unread count badge
- Dropdown: list of notifications, mark as read, "View all"
- Notifications page: full list with filters
- Settings: toggle per notification type (in-app, email)

---

## SIDEBAR NAVIGATION

```
📊 Dashboard
🚛 Units
  └ All Units
  └ Create Truck
👤 Drivers
🛢 Oil & Fluids
📋 DVIR Reports
🔍 DOT Inspections
📄 Registrations
🔧 Repairs
⚠️ Defects [badge: active count]
📦 Dispatching
  └ Load Board
  └ All Loads
💰 Accounting
  └ Transactions
  └ Invoices
  └ P&L Report
  └ Settlements
⛽ Fuel
📊 IFTA
🛡 Insurance
🚍 Trailers
🏪 Vendors
📏 Mileage Entry
📝 Audit Log (Admin/Director)
👥 Users (Admin)
⚙️ Settings
```

---

## UI/UX СПЕЦИФИКАЦИИ

### Дизайн
- **Dark theme** (primary): deep navy backgrounds (#0b0e14, #12161f), cards (#1a1f2e)
- **Light theme** (toggle): white/slate backgrounds
- **Accent**: blue (#3b82f6)
- **Status colors**: green (#22c55e), yellow (#eab308), orange (#f97316), red (#ef4444), blue (#3b82f6)
- **Fonts**: DM Sans for UI, JetBrains Mono for data (VIN, mileage, costs, unit numbers)
- **Icons**: Lucide React
- **Cards**: rounded-xl, subtle border, hover:shadow-lg transition
- **Tables**: minimal, data-dense, hover row highlighting, sticky header

### Responsive
- Desktop-first (primary: dispatchers at workstations)
- Tablet support for directors
- Sidebar collapses to icons on md screens
- Tables scroll horizontally on small screens

### Компоненты (переиспользуемые)
- `<StatusBadge color status />` — цветной badge
- `<KPICard title value icon color trend />`
- `<CountdownRing days total />`— SVG circular progress
- `<DataTable columns data filters sort pagination />`
- `<Modal title isOpen onClose children />`
- `<ConfirmDialog />`
- `<FileUpload bucket path onUpload />`
- `<InlineEdit value onSave validation />`
- `<EmptyState icon title description action />`
- `<Sidebar items collapsed />`

---

## MOCK DATA (для демонстрации)

Создать realistic mock data:
- **20 trucks** (T-101 через T-120)
- **15 drivers** с реалистичными именами
- **5 oil types per truck** = 100 oil records (с различным remaining %)
- **20 inspections** (включая 3 expired, 5 expiring soon)
- **20 registrations** (включая 2 expired)
- **50 repairs** за последние 12 месяцев с различными categories
- **15 active defects**, 30 resolved
- **10 DVIR reports**
- **30 loads** в различных статусах
- **50 fuel entries**
- **5 insurance policies** (1 expiring soon)
- **5 trailers**
- **8 vendors**
- **80 audit log entries**

---

## ЧАСОВЫЕ ПОЯСА

- Все даты хранятся в UTC (TIMESTAMPTZ)
- UI отображает в timezone пользователя (из profiles.timezone)
- Mileage logs: log_date привязан к US timezone (America/Chicago по умолчанию)
- Диспетчеры в Узбекистане (UTC+5) видят даты в своём поясе

---

## PERMISSIONS MATRIX (Все модули)

| Module | Admin | Director | Dispatcher | Viewer |
|--------|-------|----------|------------|--------|
| Dashboard | View | View | View | View |
| Units | CRUD | CRU | R (view) | R |
| Create Truck | ✅ | ✅ | ❌ | ❌ |
| Drivers | CRUD | CRU | R | R |
| Oil & Fluids | CRUD | CRU | CRU (mileage, send, done) | R |
| DVIR | CRUD | CRU | CRU | R |
| Inspections | CRUD | CRU | CRU | R |
| Registrations | CRUD | CRU | CRU | R |
| Repairs | CRUD | CRU | CRU | R |
| Defects | CRUD | CRU + Resolve | CRU + Resolve | R |
| Dispatching | CRUD | CRU | CRU | R |
| Accounting | CRUD | CRU + Export | R (view only) | R |
| Fuel | CRUD | CRU | CRU | R |
| IFTA | CRUD | CRU + Export | CRU | R |
| Insurance | CRUD | CRU | R | R |
| Trailers | CRUD | CRU | R | R |
| Vendors | CRUD | CRU | R | R |
| Mileage Entry | CRUD | CRU | CRU | R |
| Audit Log | View | View | ❌ | ❌ |
| Users | CRUD | ❌ | ❌ | ❌ |
| Export CSV/Excel | ✅ | ✅ | ❌ | ❌ |

---

## ФАЗЫ РАЗРАБОТКИ

### Phase 1: Core MVP (5–6 недель)
1. Supabase project setup + database schema + RLS policies
2. Auth system (login, roles, profiles)
3. Units CRUD + Unit Profile
4. Oil & Fluids module (full workflow: mileage, send, done)
5. Daily Mileage Entry page
6. Dashboard с KPI + problem columns
7. Sidebar navigation + dark/light theme

### Phase 2: Compliance Modules (4–5 недель)
8. Drivers HR (full CRUD + CDL/Medical tracking)
9. DOT Inspections (table + cards + countdown rings)
10. Registrations (table + cards)
11. DVIR Reports (checklist + auto-defect creation)
12. Defects module (severity + resolve workflow)
13. Insurance Tracking

### Phase 3: Operations (3–4 недели)
14. Dispatching (load board + load management)
15. Accounting (transactions, invoices, P&L)
16. Fuel Management (entries + MPG analytics)
17. IFTA Reporting
18. Trailers + Vendors

### Phase 4: Polish & Advanced (2–3 недели)
19. Audit Log (full)
20. Notifications (in-app + email via Supabase Edge Functions)
21. Export CSV/Excel
22. Data analytics charts
23. Responsive optimization
24. Russian language support (i18n)
25. Fullscreen mode

---

## ИНСТРУКЦИИ ДЛЯ CLAUDE CODE

1. **Начни с Phase 1** — последовательно создавай каждый модуль
2. **Используй Supabase** — все таблицы через migrations, RLS policies для каждой таблицы
3. **TypeScript strict mode** — все типы, интерфейсы, enums
4. **Компонентная архитектура**: `/src/components/`, `/src/pages/`, `/src/hooks/`, `/src/lib/`, `/src/types/`
5. **Supabase client**: единый клиент в `/src/lib/supabase.ts`
6. **Custom hooks**: `useUnits()`, `useOilChanges()`, `useDefects()` и т.д.
7. **Mock data**: seed script для заполнения БД тестовыми данными
8. **Error handling**: toast notifications для всех операций
9. **Loading states**: skeleton loaders для таблиц и карточек
10. **Responsive**: mobile-friendly но desktop-first
11. **Тёмная тема по умолчанию** — все цвета через CSS variables или Tailwind dark: classes
12. **JetBrains Mono** для всех данных (mileage, VIN, costs, unit numbers)
13. **DM Sans** для UI текста
14. **Real-time**: Supabase Realtime subscriptions для Dashboard updates
15. **File uploads**: Supabase Storage с proper bucket organization

---

## МОДУЛЬ 21: SAMSARA INTEGRATION (Телематика)

### Описание
Интеграция с Samsara Connected Operations Platform через их REST API. Samsara устанавливает Vehicle Gateway (plug-and-play OBD устройство) на каждый грузовик. Устройство автоматически передаёт: GPS координаты, одометр, моточасы, уровень топлива, коды ошибок двигателя, DVIR осмотры. FleetOps подключается к Samsara API и автоматически импортирует эти данные, ПОЛНОСТЬЮ УСТРАНЯЯ ручной ввод пробега диспетчерами.

### Архитектура интеграции

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Samsara Gateway │────▶│   Samsara Cloud API   │────▶│  FleetOps       │
│  (на грузовике)  │     │  api.samsara.com      │     │  (Supabase)     │
│                  │     │                       │     │                 │
│  - GPS           │     │  REST API + Webhooks  │     │  Edge Functions │
│  - Одометр       │     │  Bearer Token Auth    │     │  → PostgreSQL   │
│  - Топливо       │     │  Rate: 150 req/sec    │     │  → Realtime UI  │
│  - Диагностика   │     │                       │     │                 │
│  - DVIR          │     │                       │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

### Таблицы

```sql
-- Настройки подключения к Samsara (одна запись на организацию)
CREATE TABLE samsara_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_token TEXT NOT NULL, -- Samsara API Bearer token (зашифрованный)
  organization_id VARCHAR(50), -- Samsara Org ID
  is_active BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15, -- как часто синхронизировать
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20) DEFAULT 'pending', -- success/error/pending
  last_sync_error TEXT,
  -- Какие данные синхронизировать
  sync_odometer BOOLEAN DEFAULT true,
  sync_gps BOOLEAN DEFAULT true,
  sync_fuel BOOLEAN DEFAULT true,
  sync_dvir BOOLEAN DEFAULT true,
  sync_fault_codes BOOLEAN DEFAULT true,
  sync_ifta BOOLEAN DEFAULT true,
  sync_drivers BOOLEAN DEFAULT true,
  -- Webhook
  webhook_secret TEXT, -- для верификации входящих webhooks
  webhook_url TEXT, -- URL нашего Edge Function endpoint
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Маппинг Samsara Vehicle ID ↔ FleetOps Unit ID
CREATE TABLE samsara_vehicle_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
  samsara_vehicle_id VARCHAR(50) NOT NULL UNIQUE, -- ID из Samsara
  samsara_vehicle_name VARCHAR(200),
  samsara_vin VARCHAR(17),
  samsara_gateway_serial VARCHAR(50), -- серийный номер устройства
  is_synced BOOLEAN DEFAULT true,
  last_odometer_sync TIMESTAMPTZ,
  last_gps_sync TIMESTAMPTZ,
  last_fuel_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Маппинг Samsara Driver ID ↔ FleetOps Driver ID
CREATE TABLE samsara_driver_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
  samsara_driver_id VARCHAR(50) NOT NULL UNIQUE,
  samsara_driver_name VARCHAR(200),
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Лог синхронизаций (для отладки и мониторинга)
CREATE TABLE samsara_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- odometer, gps, dvir, fuel, fault_codes, ifta, drivers, vehicles
  status VARCHAR(20) NOT NULL, -- success, error, partial
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- GPS-координаты грузовиков (последнее известное положение)
CREATE TABLE vehicle_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  speed_mph DECIMAL(5, 1), -- скорость в милях/час
  heading INTEGER, -- направление 0-360
  address TEXT, -- обратное геокодирование
  recorded_at TIMESTAMPTZ NOT NULL, -- когда Samsara записал
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Коды ошибок двигателя
CREATE TABLE engine_fault_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  fault_code VARCHAR(20) NOT NULL,
  description TEXT, -- человекочитаемое описание от Samsara
  source VARCHAR(50), -- J1939, OBD2
  severity VARCHAR(20), -- critical, warning, info
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  resolved_at TIMESTAMPTZ,
  samsara_fault_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Samsara API Endpoints — что используем

```
BASE_URL = https://api.samsara.com
AUTH = Bearer Token в заголовке Authorization

Все запросы серверные (CORS не поддерживается Samsara — запросы
только из backend/Edge Functions, НИКОГДА из браузера).
```

#### 1. Получение списка транспорта (первичная синхронизация)
```
GET /fleet/vehicles
→ Возвращает: id, name, vin, make, model, year, licensePlate, gateway.serial
→ Используем для: создание маппинга samsara_vehicle_mapping
→ Rate limit: 25 req/sec
```

**Edge Function: sync-samsara-vehicles**
```typescript
// Supabase Edge Function: supabase/functions/sync-samsara-vehicles/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Получаем Samsara API token из БД
  const { data: config } = await supabase
    .from("samsara_config")
    .select("api_token")
    .eq("is_active", true)
    .single();

  if (!config) return new Response("No active Samsara config", { status: 400 });

  // Запрашиваем все Vehicle из Samsara
  let allVehicles = [];
  let cursor = null;
  do {
    const url = `https://api.samsara.com/fleet/vehicles${cursor ? `?after=${cursor}` : ""}`;
    const resp = await fetch(url, {
      headers: { "Authorization": `Bearer ${config.api_token}` }
    });

    if (resp.status === 429) {
      const retryAfter = resp.headers.get("Retry-After") || "1";
      await new Promise(r => setTimeout(r, parseFloat(retryAfter) * 1000));
      continue;
    }

    const data = await resp.json();
    allVehicles = [...allVehicles, ...data.data];
    cursor = data.pagination?.hasNextPage ? data.pagination.endCursor : null;
  } while (cursor);

  // Для каждого Samsara Vehicle — ищем или создаём маппинг
  for (const vehicle of allVehicles) {
    const { data: existing } = await supabase
      .from("samsara_vehicle_mapping")
      .select("id")
      .eq("samsara_vehicle_id", vehicle.id)
      .single();

    if (!existing) {
      // Пытаемся найти Unit по VIN
      const { data: unit } = await supabase
        .from("units")
        .select("id")
        .eq("current_vin", vehicle.vin)
        .single();

      if (unit) {
        await supabase.from("samsara_vehicle_mapping").insert({
          unit_id: unit.id,
          samsara_vehicle_id: vehicle.id,
          samsara_vehicle_name: vehicle.name,
          samsara_vin: vehicle.vin,
          samsara_gateway_serial: vehicle.gateway?.serial
        });
      }
      // Если Unit не найден по VIN — запись попадает в "Unmatched" список в UI
    }
  }

  return new Response(JSON.stringify({ synced: allVehicles.length }));
});
```

#### 2. Автоматический пробег (убирает ручной ввод!)
```
GET /fleet/vehicles/stats?types=obdOdometerMeters
→ Возвращает: vehicle.id, obdOdometerMeters.value (в МЕТРАХ!)
→ Конвертация: miles = meters / 1609.34
→ Rate limit: 25 req/sec
```

**Edge Function: sync-samsara-odometer (запускается по cron каждые 15 минут)**
```typescript
// Ключевая логика:
const statsUrl = "https://api.samsara.com/fleet/vehicles/stats?types=obdOdometerMeters";
const resp = await fetch(statsUrl, {
  headers: { "Authorization": `Bearer ${token}` }
});
const stats = await resp.json();

for (const vehicle of stats.data) {
  const odometerMeters = vehicle.obdOdometerMeters?.[0]?.value;
  if (!odometerMeters) continue;

  const miles = Math.round(odometerMeters / 1609.34);

  // Находим маппинг
  const { data: mapping } = await supabase
    .from("samsara_vehicle_mapping")
    .select("unit_id")
    .eq("samsara_vehicle_id", vehicle.id)
    .single();

  if (!mapping) continue;

  // Получаем текущий пробег unit
  const { data: unit } = await supabase
    .from("units")
    .select("current_mileage")
    .eq("id", mapping.unit_id)
    .single();

  // Валидация: новый >= старый (одометр не крутится назад)
  if (miles >= unit.current_mileage) {
    // Обновляем пробег в units
    await supabase
      .from("units")
      .update({ current_mileage: miles })
      .eq("id", mapping.unit_id);

    // Создаём запись в mileage_logs (source: samsara)
    await supabase.from("mileage_logs").upsert({
      unit_id: mapping.unit_id,
      log_date: new Date().toISOString().split("T")[0],
      mileage: miles,
      source: "samsara", // отличаем от ручного ввода
      entered_by: null // автоматически
    }, { onConflict: "unit_id,log_date" });

    // Oil remaining пересчитывается автоматически через
    // PostgreSQL trigger или на фронтенде при чтении
  }
}
```

#### 3. GPS-координаты (живая карта)
```
GET /fleet/vehicles/locations
→ Возвращает: vehicle.id, location.latitude, location.longitude, location.speedMilesPerHour, location.heading, location.formattedAddress, location.time
→ Rate limit: 25 req/sec

ИЛИ Real-time feed:
GET /fleet/vehicles/stats/feed?types=gps
→ Инкрементальные обновления (polling каждые 5-30 сек)
```

**Edge Function: sync-samsara-gps (каждые 5 минут или по запросу)**
```typescript
const locUrl = "https://api.samsara.com/fleet/vehicles/locations";
const resp = await fetch(locUrl, {
  headers: { "Authorization": `Bearer ${token}` }
});
const locations = await resp.json();

for (const vehicle of locations.data) {
  const loc = vehicle.location;
  const { data: mapping } = await supabase
    .from("samsara_vehicle_mapping")
    .select("unit_id")
    .eq("samsara_vehicle_id", vehicle.id)
    .single();

  if (mapping) {
    await supabase.from("vehicle_locations").upsert({
      unit_id: mapping.unit_id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed_mph: loc.speedMilesPerHour,
      heading: loc.heading,
      address: loc.formattedAddress,
      recorded_at: loc.time
    }, { onConflict: "unit_id" });
  }
}
```

#### 4. DVIR (Предрейсовые осмотры → автосоздание дефектов)
```
GET /fleet/dvirs/history?startTime=...&endTime=...
→ Возвращает: id, vehicle.id, authorSignature.signatoryUser, safetyStatus,
   vehicleDefects[{defectType, isResolved, comment}], odometerMeters, type (preTrip/postTrip)
→ Rate limit: 25 req/sec

WEBHOOK (рекомендуется вместо polling):
Samsara Dashboard → Alerts → DVIR Submitted → Send Webhook → наш URL
→ Мгновенное получение при каждом новом DVIR
```

**Edge Function: webhook-samsara-dvir (webhook endpoint)**
```typescript
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

serve(async (req) => {
  // 1. Верифицируем webhook подпись
  const body = await req.text();
  const signature = req.headers.get("X-Samsara-Signature");
  const { data: config } = await supabase
    .from("samsara_config")
    .select("webhook_secret")
    .single();

  const expectedSig = createHmac("sha256", config.webhook_secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return new Response("Invalid signature", { status: 401 });
  }

  // 2. Парсим DVIR данные
  const event = JSON.parse(body);
  const dvir = event.data;

  // 3. Находим Unit по Samsara Vehicle ID
  const { data: mapping } = await supabase
    .from("samsara_vehicle_mapping")
    .select("unit_id")
    .eq("samsara_vehicle_id", dvir.vehicle.id)
    .single();

  if (!mapping) return new Response("Unknown vehicle", { status: 404 });

  // 4. Находим Driver по Samsara Driver ID
  const { data: driverMapping } = await supabase
    .from("samsara_driver_mapping")
    .select("driver_id")
    .eq("samsara_driver_id", dvir.authorSignature?.signatoryUser?.id)
    .single();

  // 5. Создаём DVIR Report в FleetOps
  const items = dvir.vehicleDefects?.map(d => ({
    item: d.defectType,
    status: d.isResolved ? "pass" : "fail",
    note: d.comment || ""
  })) || [];

  const hasDefects = items.some(i => i.status === "fail");

  const { data: dvirRecord } = await supabase
    .from("dvir_reports")
    .insert({
      unit_id: mapping.unit_id,
      driver_id: driverMapping?.driver_id,
      report_type: dvir.type === "preTrip" ? "pre_trip" : "post_trip",
      report_date: new Date(dvir.startTime).toISOString().split("T")[0],
      items_checked: JSON.stringify(items),
      defects_found: hasDefects,
      odometer_reading: dvir.odometerMeters
        ? Math.round(dvir.odometerMeters / 1609.34) : null,
      status: dvir.safetyStatus === "safe" ? "clean" : "defects_noted",
      source: "samsara"
    })
    .select("id")
    .single();

  // 6. Если есть дефекты — АВТОМАТИЧЕСКИ создаём в таблице defects
  if (hasDefects && dvirRecord) {
    const failedItems = items.filter(i => i.status === "fail");
    for (const item of failedItems) {
      await supabase.from("defects").insert({
        unit_id: mapping.unit_id,
        dvir_report_id: dvirRecord.id,
        defect_description: `${item.item}: ${item.note || "Failed inspection"}`,
        severity: "moderate",
        reported_by: null, // автоматически из Samsara
        reported_date: new Date().toISOString().split("T")[0],
        source: "samsara"
      });
    }
  }

  return new Response(JSON.stringify({ success: true }));
});
```

#### 5. IFTA — Автоматический пробег по штатам
```
GET /fleet/reports/ifta/jurisdiction?startTime=...&endTime=...
→ Возвращает: vehicle.id, jurisdictions[{jurisdiction: "CA", distanceMeters, fuelConsumedMl}]
→ Полностью заменяет ручной ввод в IFTA модуле!
```

**Edge Function: sync-samsara-ifta (запускается ежемесячно или по кнопке)**
```typescript
// Запрашиваем данные за текущий квартал
const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
const year = new Date().getFullYear();
const startTime = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01T00:00:00Z`;

const iftaUrl = `https://api.samsara.com/fleet/reports/ifta/jurisdiction?startTime=${startTime}&endTime=${new Date().toISOString()}`;
const resp = await fetch(iftaUrl, {
  headers: { "Authorization": `Bearer ${token}` }
});
const ifta = await resp.json();

for (const vehicle of ifta.data) {
  const { data: mapping } = await supabase
    .from("samsara_vehicle_mapping")
    .select("unit_id")
    .eq("samsara_vehicle_id", vehicle.vehicle.id)
    .single();

  if (!mapping) continue;

  for (const jurisdiction of vehicle.jurisdictions) {
    const miles = Math.round(jurisdiction.distanceMeters / 1609.34);
    const gallons = jurisdiction.fuelConsumedMl
      ? (jurisdiction.fuelConsumedMl / 3785.41).toFixed(2) : 0;

    await supabase.from("ifta_mileage").upsert({
      unit_id: mapping.unit_id,
      quarter,
      year,
      state_code: jurisdiction.jurisdiction, // "CA", "TX", etc.
      miles_driven: miles,
      fuel_gallons_purchased: gallons,
      source: "samsara"
    }, { onConflict: "unit_id,quarter,year,state_code" });
  }
}
```

#### 6. Коды ошибок двигателя (проактивное обслуживание)
```
GET /fleet/vehicles/stats/history?types=engineStates,faultCodes&startTime=...&endTime=...
→ Возвращает: vehicle.id, faultCodes[{code, description, source}]
→ Позволяет обнаруживать проблемы ДО поломки
```

#### 7. Водители (синхронизация)
```
GET /fleet/drivers
→ Возвращает: id, name, username, phone, licenseNumber, licenseState, eldSettings
→ Маппинг на таблицу drivers в FleetOps
```

#### 8. Уровень топлива и заправки
```
GET /fleet/vehicles/stats?types=fuelPercents
→ Текущий уровень топлива в процентах

Webhook: Fuel Level Alert
→ Резкое падение уровня (> 20% за < 5 мин) = возможное воровство
→ Уведомление в FleetOps Notifications
```

### Samsara API Auth & Rate Limits

```typescript
// Аутентификация — Bearer Token в каждом запросе
const headers = {
  "Authorization": `Bearer ${SAMSARA_API_TOKEN}`,
  "Content-Type": "application/json"
};

// ВАЖНО: CORS не поддерживается!
// Все запросы ТОЛЬКО из серверного кода (Edge Functions)
// НИКОГДА из браузера/фронтенда

// Rate limits:
// - Глобальный: 200 req/sec на организацию
// - Per token: 150 req/sec
// - Per endpoint: зависит (5-30 req/sec)
// - При 429 → читать Retry-After header → ждать → повторить

// Обработка rate limit:
async function samsaraFetch(url: string, token: string) {
  let attempts = 0;
  while (attempts < 3) {
    const resp = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (resp.status === 429) {
      const retryAfter = parseFloat(resp.headers.get("Retry-After") || "2");
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      attempts++;
      continue;
    }
    return resp;
  }
  throw new Error("Samsara API rate limit exceeded after 3 retries");
}
```

### Supabase Cron Jobs (pg_cron)

```sql
-- Запускать синхронизацию одометра каждые 15 минут
SELECT cron.schedule(
  'samsara-odometer-sync',
  '*/15 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-samsara-odometer',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);

-- GPS каждые 5 минут
SELECT cron.schedule(
  'samsara-gps-sync',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-samsara-gps',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);

-- IFTA ежедневно в 2:00 ночи
SELECT cron.schedule(
  'samsara-ifta-sync',
  '0 2 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-samsara-ifta',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);

-- Fault codes каждые 30 минут
SELECT cron.schedule(
  'samsara-faults-sync',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sync-samsara-faults',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  );$$
);
```

### UI: Страница настроек Samsara Integration (Settings → Integrations)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Samsara Integration                          [Connected ✅] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Token: ••••••••••••••••••••xK4f      [Test Connection]     │
│  Organization ID: org_abc123                                    │
│  Webhook URL: https://yourproject.supabase.co/functions/v1/...  │
│  Status: ✅ Active | Last sync: 2 minutes ago                   │
│                                                                 │
│  ── Sync Settings ──────────────────────────────────────────    │
│  ☑ Odometer (every 15 min) — заменяет ручной ввод пробега     │
│  ☑ GPS Location (every 5 min) — карта грузовиков               │
│  ☑ DVIR Reports (webhook) — автосоздание дефектов              │
│  ☑ IFTA Mileage (daily) — автозаполнение по штатам             │
│  ☑ Fault Codes (every 30 min) — ошибки двигателя               │
│  ☑ Fuel Level (webhook alerts) — уведомления об аномалиях      │
│  ☐ Driver sync — синхронизация водителей                        │
│                                                                 │
│  ── Vehicle Mapping ────────────────────────────────────────    │
│  FleetOps Unit  │ Samsara Vehicle │ VIN              │ Status  │
│  T-101          │ Truck 101       │ 1HGBH41JXMN1091 │ ✅      │
│  T-102          │ Truck 102       │ 2FTRX18L1XCA123  │ ✅      │
│  T-103          │ —               │ —                 │ ⚠️ Map  │
│  —              │ Truck 120       │ 5TBBT54198S123    │ ⚠️ New  │
│                                                                 │
│  [Sync Now] [View Sync Log] [Disconnect]                        │
└─────────────────────────────────────────────────────────────────┘
```

### UI: Vehicle Mapping Page

- Таблица с двумя колонками: FleetOps Units и Samsara Vehicles
- Автоматический маппинг по VIN (если VIN совпадает)
- Ручной маппинг через dropdown (для несовпадающих)
- Статусы: ✅ Mapped, ⚠️ Unmapped FleetOps Unit, ⚠️ New Samsara Vehicle
- Кнопка "Create Unit from Samsara" — создать Unit из данных Samsara

### UI: Live Fleet Map (опциональная страница)

- Карта (Leaflet.js или Mapbox) с маркерами всех грузовиков
- Маркер = unit_number, цвет по статусу (green=moving, yellow=idle, red=stopped, gray=no signal)
- Клик на маркер → popup с unit_number, driver, speed, address, last update time
- Sidebar с фильтрами (by status, by driver)
- Обновление каждые 30 секунд через vehicle_locations table + Supabase Realtime

### UI: Engine Fault Codes Dashboard

- Карточки грузовиков с активными кодами ошибок
- Severity badges (Critical = красный, Warning = оранжевый, Info = серый)
- Описание ошибки от Samsara (человекочитаемое)
- Кнопка "Create Defect" — создать дефект из fault code
- Кнопка "Dismiss" — отметить как просмотренный (не создавая дефект)

### Sync Log Page (Admin only)

- Таблица: Время, Тип синха, Статус, Записей синхронизировано, Ошибки, Длительность
- Фильтры по типу и статусу
- Автообновление
- Alert при ошибках синхронизации

### Логика: Hybrid Mode (Samsara + ручной ввод)

```
Если Samsara подключена:
  - Одометр обновляется АВТОМАТИЧЕСКИ каждые 15 мин
  - Диспетчер всё ещё МОЖЕТ ввести пробег вручную (например, если Samsara gateway offline)
  - При ручном вводе: если manual > samsara → принимаем manual, иначе → предупреждение
  - В mileage_logs добавлено поле source ENUM ('manual', 'samsara')

Если Samsara НЕ подключена:
  - Всё работает как раньше — ручной ввод диспетчерами
  - Никаких ограничений, система полностью автономна
```

### Изменения в существующих таблицах

```sql
-- Добавить source в mileage_logs
ALTER TABLE mileage_logs ADD COLUMN source VARCHAR(20) DEFAULT 'manual';
-- source: 'manual' (ввод диспетчером), 'samsara' (автоматически)

-- Добавить source в dvir_reports
ALTER TABLE dvir_reports ADD COLUMN source VARCHAR(20) DEFAULT 'manual';

-- Добавить source в defects
ALTER TABLE defects ADD COLUMN source VARCHAR(20) DEFAULT 'manual';

-- Добавить source в ifta_mileage
ALTER TABLE ifta_mileage ADD COLUMN source VARCHAR(20) DEFAULT 'manual';
```

### Необходимые API Token Scopes в Samsara

При создании токена в Samsara Dashboard → Settings → API Tokens:
```
READ scopes (минимум):
- Read Vehicles (одометр, GPS, статы)
- Read Vehicle Statistics (GPS, fuel, engine)
- Read Vehicle Locations (координаты)
- Read Drivers (список водителей)
- Read DVIRs (осмотры)
- Read Fuel & Energy (уровень топлива)
- Read Safety (fault codes)
- Read IFTA Reports (пробег по штатам)

WRITE scopes (опционально):
- Write DVIRs (закрытие DVIR из FleetOps)
```

### Фаза разработки

Samsara Integration входит в **Phase 4 (Polish & Advanced)** или может быть выделена в **Phase 5 (Integrations)**:

1. Неделя 1: Settings UI + samsara_config + API token validation + Test Connection
2. Неделя 2: Vehicle sync + mapping UI + odometer sync Edge Function
3. Неделя 3: GPS sync + Live Fleet Map + DVIR webhook + auto-defect creation
4. Неделя 4: IFTA sync + Fault codes + Fuel alerts + Sync Log
