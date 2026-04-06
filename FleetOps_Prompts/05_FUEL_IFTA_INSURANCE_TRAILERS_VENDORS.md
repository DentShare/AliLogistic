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

