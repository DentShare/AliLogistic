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

