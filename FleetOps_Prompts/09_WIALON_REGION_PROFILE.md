## МОДУЛЬ 23: WIALON (IMG) INTEGRATION (для рынка СНГ)

### Описание
Wialon — платформа №1 для GPS мониторинга в СНГ, разработана компанией Gurtam (Беларусь). IMG (International Monitoring Group) — крупнейший дилер Wialon в Узбекистане (530+ компаний). Оборудование: трекеры Teltonika + датчики топлива Escort/Omnicomm. Wialon имеет полноценный Remote API + JS SDK + Python SDK.

### Архитектура
```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│ Teltonika Tracker│────▶│  Wialon Local Server  │────▶│  FleetOps       │
│ (на грузовике)   │     │  (wialon.uz / hosted) │     │  (Supabase)     │
│                  │     │                       │     │                 │
│ - GPS/ГЛОНАСС    │     │  Remote API           │     │  Edge Functions │
│ - Одометр        │     │  Token Auth           │     │  → PostgreSQL   │
│ - Датчик топлива │     │  HTTP requests        │     │  → Realtime UI  │
│ - Скорость       │     │                       │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

### Wialon Remote API — ключевые запросы

```
BASE_URL = https://hst-api.wialon.com (Wialon Hosting)
      ИЛИ http://wialon.uz:PORT (Wialon Local от IMG)
AUTH = Token-based, получается через token/login

ВАЖНО: Wialon API использует формат:
  POST /wialon/ajax.html?svc=SERVICE_NAME
  Body: params=JSON&sid=SESSION_ID
```

#### 1. Авторизация
```
POST /wialon/ajax.html?svc=token/login
params={"token":"YOUR_WIALON_TOKEN"}

Ответ: { "eid": "SESSION_ID", "user": {...}, ... }
→ sid (Session ID) используется во всех последующих запросах
```

#### 2. Получение списка юнитов с позициями
```
POST /wialon/ajax.html?svc=core/search_items&sid=SESSION_ID
params={
  "spec": {
    "itemsType": "avl_unit",
    "propName": "sys_name",
    "propValueMask": "*",
    "sortType": "sys_name"
  },
  "force": 1,
  "flags": 1025,  // 1 (базовые) + 1024 (последняя позиция)
  "from": 0,
  "to": 0
}

Ответ содержит для каждого юнита:
- nm: имя юнита
- id: ID юнита
- pos: { x: longitude, y: latitude, s: speed_kmh, c: course, sc: satellites }
- lmsg: { t: timestamp_unix, pos: {...} }
- cnm: mileage_counter_km
```

#### 3. Получение пробега (mileage counter)
```
Из ответа search_items с flags включающим counters (0x1000):
- cnm: пробег в километрах (GPS или одометр, в зависимости от настроек)
- cneh: моточасы

Конвертация для FleetOps СНГ: оставляем в КМ
Конвертация если нужно в мили: miles = km / 1.60934
```

#### 4. Данные о топливе (через сенсоры)
```
POST /wialon/ajax.html?svc=messages/load_interval&sid=SESSION_ID
params={
  "itemId": UNIT_ID,
  "timeFrom": UNIX_TIMESTAMP,
  "timeTo": UNIX_TIMESTAMP,
  "flags": 0,
  "flagsMask": 0,
  "loadCount": 1000
}

→ Возвращает массив сообщений с параметрами сенсоров
→ Параметр fuel_level (если настроен датчик Escort/Omnicomm)
→ Расход топлива через отчёт events/load с selector type "fuel"
```

#### 5. Service Intervals (ТО)
```
Wialon имеет ВСТРОЕННУЮ систему service intervals:
- im: интервал по пробегу (km)
- it: интервал по дням
- ie: интервал по моточасам
- pm: пробег при последнем ТО
- pt: дата последнего ТО
- pe: моточасы при последнем ТО

→ Можно синхронизировать с нашим Oil & Fluids модулем!
```

### Таблицы
```sql
CREATE TABLE wialon_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_url TEXT NOT NULL, -- https://hst-api.wialon.com или локальный
  api_token TEXT NOT NULL, -- Wialon API token
  session_id TEXT, -- текущий SID (обновляется при каждом login)
  is_active BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  sync_odometer BOOLEAN DEFAULT true,
  sync_gps BOOLEAN DEFAULT true,
  sync_fuel BOOLEAN DEFAULT true,
  sync_service_intervals BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE wialon_unit_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
  wialon_unit_id BIGINT NOT NULL UNIQUE, -- Wialon internal ID
  wialon_unit_name VARCHAR(200),
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Function: sync-wialon-data
```typescript
// 1. Login
const loginResp = await fetch(`${serverUrl}/wialon/ajax.html?svc=token/login`, {
  method: "POST",
  body: `params=${JSON.stringify({ token: wialonToken })}`
});
const session = await loginResp.json();
const sid = session.eid;

// 2. Получаем все юниты с позициями и counters
const searchResp = await fetch(`${serverUrl}/wialon/ajax.html?svc=core/search_items&sid=${sid}`, {
  method: "POST",
  body: `params=${JSON.stringify({
    spec: { itemsType: "avl_unit", propName: "sys_name", propValueMask: "*", sortType: "sys_name" },
    force: 1,
    flags: 4097, // 1 + 4096 (counters)
    from: 0, to: 0
  })}`
});
const units = await searchResp.json();

// 3. Для каждого юнита обновляем FleetOps
for (const item of units.items) {
  const { data: mapping } = await supabase
    .from("wialon_unit_mapping")
    .select("unit_id")
    .eq("wialon_unit_id", item.id)
    .single();

  if (!mapping) continue;

  // Пробег (km)
  const mileageKm = Math.round(item.cnm || 0);

  await supabase.from("units").update({ current_mileage: mileageKm }).eq("id", mapping.unit_id);

  // GPS
  if (item.pos) {
    await supabase.from("vehicle_locations").upsert({
      unit_id: mapping.unit_id,
      latitude: item.pos.y,
      longitude: item.pos.x,
      speed_mph: Math.round((item.pos.s || 0) * 0.621371), // km/h → mph (или оставить km/h для СНГ)
      heading: item.pos.c,
      recorded_at: new Date((item.lmsg?.t || 0) * 1000).toISOString()
    }, { onConflict: "unit_id" });
  }
}

// 4. Logout
await fetch(`${serverUrl}/wialon/ajax.html?svc=core/logout&sid=${sid}`, { method: "POST", body: "params={}" });
```

---

## МОДУЛЬ 24: REGION PROFILE (Профиль рынка)

### Описание
При создании организации в FleetOps выбирается профиль рынка, который определяет: видимые модули, единицы измерения, валюту, язык, доступные интеграции.

### Таблица
```sql
CREATE TYPE region_profile AS ENUM ('us', 'cis');

ALTER TABLE profiles ADD COLUMN region region_profile DEFAULT 'us';

-- ИЛИ отдельная таблица настроек организации:
CREATE TABLE organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  region region_profile NOT NULL DEFAULT 'us',
  -- Единицы измерения
  distance_unit VARCHAR(10) DEFAULT 'miles', -- miles / km
  volume_unit VARCHAR(10) DEFAULT 'gallons', -- gallons / liters
  currency VARCHAR(3) DEFAULT 'USD', -- USD / UZS / RUB / KZT
  currency_symbol VARCHAR(5) DEFAULT '$',
  temperature_unit VARCHAR(5) DEFAULT 'F', -- F / C
  -- Язык и формат
  language VARCHAR(5) DEFAULT 'en', -- en / ru / uz
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY', -- MM/DD/YYYY / DD.MM.YYYY
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  -- Модули (какие показывать)
  module_dot_inspection BOOLEAN DEFAULT true,
  module_dvir BOOLEAN DEFAULT true,
  module_ifta BOOLEAN DEFAULT true,
  module_hos BOOLEAN DEFAULT false, -- будущий модуль
  module_insurance BOOLEAN DEFAULT true,
  module_dispatching BOOLEAN DEFAULT true,
  -- Интеграции (какие доступны)
  integration_samsara BOOLEAN DEFAULT false,
  integration_tteld BOOLEAN DEFAULT false,
  integration_wialon BOOLEAN DEFAULT false,
  -- Compliance стандарт
  compliance_standard VARCHAR(20) DEFAULT 'fmcsa', -- fmcsa / local
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Пресеты по регионам

```typescript
const US_PRESET = {
  region: 'us',
  distance_unit: 'miles',
  volume_unit: 'gallons',
  currency: 'USD',
  currency_symbol: '$',
  temperature_unit: 'F',
  language: 'en',
  date_format: 'MM/DD/YYYY',
  timezone: 'America/Chicago',
  module_dot_inspection: true,
  module_dvir: true,
  module_ifta: true,
  module_insurance: true,
  module_dispatching: true,
  integration_samsara: true,
  integration_tteld: true,
  integration_wialon: false,
  compliance_standard: 'fmcsa'
};

const CIS_PRESET = {
  region: 'cis',
  distance_unit: 'km',
  volume_unit: 'liters',
  currency: 'UZS',
  currency_symbol: "so'm",
  temperature_unit: 'C',
  language: 'ru',
  date_format: 'DD.MM.YYYY',
  timezone: 'Asia/Tashkent',
  module_dot_inspection: false, // вместо этого — Техосмотр (другие правила)
  module_dvir: true, // полезно, хоть и не обязательно
  module_ifta: false, // нет аналога в СНГ
  module_insurance: true, // ОСАГО + КАСКО
  module_dispatching: true,
  integration_samsara: false,
  integration_tteld: false,
  integration_wialon: true, // IMG Wialon
  compliance_standard: 'local'
};
```

### UI: Onboarding Screen (при первом входе Admin)
```
┌─────────────────────────────────────────────┐
│                                             │
│     🚛 Welcome to FleetOps                  │
│                                             │
│     Where does your fleet operate?          │
│                                             │
│     ┌───────────────┐  ┌───────────────┐   │
│     │  🇺🇸 USA       │  │  🌍 СНГ       │   │
│     │               │  │               │   │
│     │  Miles, USD   │  │  КМ, UZS/RUB  │   │
│     │  DOT, FMCSA   │  │  Wialon/IMG   │   │
│     │  Samsara/ELD  │  │  Русский      │   │
│     │  English      │  │               │   │
│     └───────────────┘  └───────────────┘   │
│                                             │
│     Settings can be changed later           │
└─────────────────────────────────────────────┘
```

### Конвертация единиц (утилиты)
```typescript
// /src/lib/units.ts
export function convertDistance(value: number, from: 'miles' | 'km', to: 'miles' | 'km'): number {
  if (from === to) return value;
  return from === 'miles' ? value * 1.60934 : value / 1.60934;
}

export function convertVolume(value: number, from: 'gallons' | 'liters', to: 'gallons' | 'liters'): number {
  if (from === to) return value;
  return from === 'gallons' ? value * 3.78541 : value / 3.78541;
}

export function formatDistance(value: number, unit: 'miles' | 'km'): string {
  return `${value.toLocaleString()} ${unit === 'miles' ? 'mi' : 'км'}`;
}

export function formatCurrency(value: number, currency: string, symbol: string): string {
  return `${symbol}${value.toLocaleString()}`;
}

// Oil intervals тоже конвертируются:
// Engine Oil: 15,000 mi = 24,140 km
// Показываем в единицах текущего профиля
```

### Логика Sidebar (скрытие модулей)
```typescript
// Sidebar items фильтруются по organization_settings
const visibleModules = sidebarItems.filter(item => {
  if (item.id === 'dot_inspection' && !org.module_dot_inspection) return false;
  if (item.id === 'dvir' && !org.module_dvir) return false;
  if (item.id === 'ifta' && !org.module_ifta) return false;
  // ...
  return true;
});
```

### Integration Settings UI
```
Settings → Integrations:

🇺🇸 US Profile показывает:
  ☐ Samsara — GPS, Odometer, DVIR, IFTA, Fault Codes
  ☐ TT ELD — GPS, Odometer, Drivers
  ☐ Motive — (будущее)

🌍 CIS Profile показывает:
  ☐ Wialon (IMG) — GPS, Одометр, Топливо, Интервалы ТО
  ☐ ГЛОНАСС — (будущее)
```

### Фазы разработки (обновлённые)

#### Phase 5: Multi-Region & Integrations (4-5 недель)

Неделя 1: Region Profile + organization_settings + Onboarding + i18n (ru)
Неделя 2: Unit conversion utilities + адаптация всех модулей под km/liters
Неделя 3: TT ELD Integration (sync trucks, GPS, odometer)
Неделя 4: Wialon Integration (login, sync units, GPS, mileage, fuel)
Неделя 5: Integration Settings UI + Mapping UI + Sync Log (единый для всех провайдеров)
