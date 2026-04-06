## МОДУЛЬ 22: TT ELD INTEGRATION (для рынка США)

### Описание
TT ELD — популярный ELD-провайдер среди русскоязычных перевозчиков в США (52,000+ грузовиков). Имеет открытый REST API. Интеграция проще чем Samsara — меньше endpoints, но покрывает ключевые потребности: GPS трекинг, одометр, список водителей/грузовиков.

### TT ELD API Reference

```
BASE_URL = https://read.tteld.com
AUTH = два заголовка в каждом запросе:
  x-api-key: <ваш API ключ>
  provider-token: <токен провайдера>

Создание API ключа: TT ELD Dashboard → More → API Keys → Add Key → Generate

ВАЖНО: CORS не поддерживается — только серверные запросы (Edge Functions)
```

#### Endpoint 1: Список грузовиков (Trucks)
```
GET /api/externalservice/current-units/:usdot?page=1&perPage=50&is_active=true

Ответ:
{
  "data": [
    {
      "id": "uuid-string",
      "vin": "4V4NC9EG0FN911517",
      "truck_number": "T-101",
      "driver": { "id": "uuid", "first_name": "John", "second_name": "Smith" },
      "codriver": { "id": "uuid", "first_name": "...", "second_name": "..." }
    }
  ],
  "meta": { "page": 1, "perPage": 50, "total": 20, "totalPages": 1 }
}

→ Используем для: первичный маппинг TT ELD Vehicle → FleetOps Unit (по VIN или truck_number)
→ Получаем сразу driver assignment
```

#### Endpoint 2: Real-time трекинг всех грузовиков
```
GET /api/v2/units-by-usdot/:usdot

Ответ: массив с текущими координатами каждого грузовика
→ GPS координаты, truck_number, VIN, timestamp
→ Обновляем vehicle_locations в FleetOps
```

#### Endpoint 3: Трекинг по VIN (конкретный грузовик)
```
GET /api/v2/unit-by-vin/:usdot/:vin

Ответ:
{
  "unit": {
    "truck_number": "T-101",
    "vin": "4V4NC9EG0FN911517",
    "coordinates": { "lat": 32.7767, "lng": -96.7970 },
    "timestamp": "2026-01-10T08:32:11.000Z"
  }
}
```

#### Endpoint 4: Историческое отслеживание (до 72 часов)
```
GET /api/externalservice/trackings/:usdot/:vehicleId/?from=...&to=...

Ответ: массив точек в хронологическом порядке:
[
  {
    "address": "Dallas, TX",
    "coordinates": { "lat": 32.7767, "lng": -96.7970 },
    "rotation": 180,
    "speed": 65,
    "driverId": "uuid",
    "odometer": 245830,
    "date": "2026-01-10T08:32:11.000Z"
  }
]

ВАЖНО: odometer здесь — можно использовать для обновления пробега!
Максимум 72 часа за один запрос.
```

#### Endpoint 5: Список водителей
```
GET /api/externalservice/drivers-list/:usdot?page=1&perPage=50&is_active=true

Ответ:
{
  "data": [
    { "id": "uuid", "first_name": "John", "second_name": "Smith" }
  ],
  "meta": { "page": 1, "perPage": 50, "total": 15, "totalPages": 1 }
}
```

#### Endpoint 6: Активные юниты за период
```
GET /api/externalservice/active-units/:usdot/?from=...&to=...

Ответ:
[
  { "id": "uuid", "truck_number": "T-101", "vin": "4V4NC9EG0FN911517" }
]

→ Полезно для определения, какие грузовики работали за период
```

### Edge Function: sync-tteld-odometer
```typescript
// Получаем последний tracking для каждого грузовика
// и извлекаем odometer из данных
const now = new Date();
const from = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 часа назад
const to = now.toISOString();

// Для каждого замапленного грузовика:
for (const mapping of mappings) {
  const url = `https://read.tteld.com/api/externalservice/trackings/${usdot}/${mapping.tteld_vehicle_id}/?from=${from}&to=${to}`;
  const resp = await fetch(url, {
    headers: { "x-api-key": apiKey, "provider-token": providerToken }
  });
  const trackings = await resp.json();

  if (trackings.length > 0) {
    const latest = trackings[trackings.length - 1]; // последняя точка
    const miles = latest.odometer; // TT ELD отдаёт в милях

    // Обновляем пробег
    await supabase.from("units").update({ current_mileage: miles }).eq("id", mapping.unit_id);

    // GPS
    await supabase.from("vehicle_locations").upsert({
      unit_id: mapping.unit_id,
      latitude: latest.coordinates.lat,
      longitude: latest.coordinates.lng,
      speed_mph: latest.speed,
      heading: latest.rotation,
      address: latest.address,
      recorded_at: latest.date
    }, { onConflict: "unit_id" });
  }
}
```

### Таблица маппинга
```sql
CREATE TABLE tteld_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL, -- x-api-key
  provider_token TEXT NOT NULL, -- provider-token
  usdot VARCHAR(20) NOT NULL, -- USDOT номер компании
  is_active BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tteld_vehicle_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
  tteld_vehicle_id VARCHAR(50) NOT NULL UNIQUE,
  tteld_truck_number VARCHAR(20),
  tteld_vin VARCHAR(17),
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Ограничения TT ELD API (по сравнению с Samsara)
- Нет DVIR endpoint (только Samsara)
- Нет IFTA endpoint (только Samsara)
- Нет fault codes endpoint
- Нет webhooks — только polling
- Tracking history максимум 72 часа
- Нет fuel level данных
- НО: проще авторизация, проще структура данных, популярен среди узбекских перевозчиков

---

