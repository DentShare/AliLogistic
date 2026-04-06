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

---

