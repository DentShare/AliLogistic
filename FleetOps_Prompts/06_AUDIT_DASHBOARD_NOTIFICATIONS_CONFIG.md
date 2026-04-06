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

