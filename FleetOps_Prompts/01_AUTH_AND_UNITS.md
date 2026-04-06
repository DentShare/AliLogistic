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

