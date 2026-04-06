# ПРОМТ: GPS Live Tracking MVP для FleetOps (Демо-версия)

## Контекст

Ты — senior full-stack разработчик, специализирующийся на React + Supabase + картографических интеграциях. У тебя есть существующая платформа FleetOps (React 18 + TypeScript, Tailwind CSS, Supabase, Vercel) — веб-дашборд для управления автопарком грузовиков логистической компании.

Нужно создать **MVP модуля GPS Live Tracking** для демонстрации покупателю. Модуль должен показывать местоположение всех грузовиков на карте в реальном времени, их статус и основные данные. MVP работает на **моковых данных с симуляцией движения**, но архитектурно готов к подключению реальных GPS-провайдеров (Samsara, Motive, Geotab).

## Цель MVP

Показать покупателю работающий прототип: интерактивная карта США с движущимися грузовиками, панель статусов, детали по клику, история маршрутов. Всё должно выглядеть как реальная система, работающая в реальном времени.

## Технический стек

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Карты**: Mapbox GL JS (бесплатный tier, 50k загрузок/мес) ИЛИ Leaflet + OpenStreetMap (полностью бесплатно)
- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)
- **Симуляция**: генератор моковых GPS-данных, имитирующий движение траков по реальным маршрутам в США
- **Хостинг**: Vercel

## Структура модуля

### 1. База данных

**Таблица: `vehicle_locations` (текущее местоположение)**
```sql
CREATE TABLE vehicle_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  heading DECIMAL(5, 2),              -- направление движения (0-360 градусов)
  speed_mph INTEGER DEFAULT 0,        -- скорость в милях/час
  engine_status VARCHAR(20) DEFAULT 'off', -- off / idle / driving
  odometer INTEGER,                    -- показание одометра (мили)
  fuel_level DECIMAL(5, 2),           -- уровень топлива (%)
  last_updated TIMESTAMPTZ DEFAULT now(),
  source VARCHAR(50) DEFAULT 'simulation', -- simulation / samsara / motive / geotab
  UNIQUE(unit_id)                      -- одна запись на юнит (последнее местоположение)
);
CREATE INDEX idx_vehicle_locations_unit ON vehicle_locations(unit_id);
CREATE INDEX idx_vehicle_locations_updated ON vehicle_locations(last_updated);
```

**Таблица: `location_history` (история перемещений)**
```sql
CREATE TABLE location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  heading DECIMAL(5, 2),
  speed_mph INTEGER DEFAULT 0,
  engine_status VARCHAR(20),
  odometer INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  source VARCHAR(50) DEFAULT 'simulation'
);
CREATE INDEX idx_location_history_unit_date ON location_history(unit_id, recorded_at DESC);
```

**Таблица: `geofences` (геозоны)**
```sql
CREATE TABLE geofences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  geofence_type VARCHAR(20) DEFAULT 'circle', -- circle / polygon
  center_lat DECIMAL(10, 7),
  center_lng DECIMAL(10, 7),
  radius_miles DECIMAL(8, 2),
  polygon_coords JSONB,               -- [{lat, lng}, ...]
  color VARCHAR(7) DEFAULT '#3B82F6',
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Таблица: `geofence_events` (входы/выходы из геозон)**
```sql
CREATE TABLE geofence_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  geofence_id UUID REFERENCES geofences(id),
  event_type VARCHAR(10) NOT NULL,     -- enter / exit
  event_time TIMESTAMPTZ DEFAULT now(),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7)
);
```

**Таблица: `provider_vehicle_mapping` (маппинг юнитов к внешним провайдерам)**
```sql
CREATE TABLE provider_vehicle_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  provider_name VARCHAR(50) NOT NULL,        -- samsara / motive / geotab
  external_vehicle_id VARCHAR(100) NOT NULL,
  external_vehicle_name VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_name, external_vehicle_id)
);
```

### 2. Симулятор GPS-данных (для MVP)

Создай Supabase Edge Function `simulate-gps` или клиентский генератор, который:

**Маршруты (предустановленные, реальные координаты интерстейтов):**
- I-10: Los Angeles - Phoenix - El Paso - San Antonio - Houston
- I-40: Albuquerque - Amarillo - Oklahoma City - Memphis - Nashville
- I-95: New York - Philadelphia - Baltimore - Richmond - Jacksonville
- I-80: San Francisco - Reno - Salt Lake City - Omaha - Chicago
- I-35: Dallas - Oklahoma City - Kansas City - Des Moines - Minneapolis
- I-75: Detroit - Cincinnati - Atlanta - Tampa
- I-90: Seattle - Spokane - Billings - Sioux Falls - Chicago

Каждый маршрут — массив координат (waypoints) по реальным точкам на дорогах.

**Логика симуляции:**
- Каждый юнит назначается на случайный маршрут, на случайную позицию на нём
- Движение: 55-65 mph по хайвею, остановки каждые 3-5 часов
- Статусы меняются реалистично:
  - `driving` (70% времени) — скорость 55-65 mph, координаты обновляются
  - `idle` (15% времени) — скорость 0, двигатель включён (стоянка, погрузка)
  - `off` (15% времени) — скорость 0, двигатель выключен (ночной отдых)
- Одометр увеличивается пропорционально расстоянию
- Уровень топлива уменьшается (~6 MPG), резко увеличивается при заправке
- Обновление: каждые 10 секунд новая точка

### 3. UI компоненты

#### 3.1 Основной экран — Live Map

**Layout**: полноэкранная карта с overlay-панелями.

**Карта:**
- Mapbox GL JS или Leaflet + OpenStreetMap
- Центр: территория США (lat: 39.8283, lng: -98.5795, zoom: 4)
- Тёмная тема карты (Mapbox Dark style / CartoDB DarkMatter)
- Smooth animations при обновлении позиций

**Маркеры грузовиков:**
- Кастомная SVG-иконка грузовика, повёрнутая по heading
- Цвет маркера по статусу двигателя:
  - Зелёный = driving (в движении)
  - Жёлтый = idle (холостой ход)
  - Красный = off (двигатель выключен)
  - Синий = in_repair (из таблицы units.status)
- Tooltip при наведении: unit_number, driver, speed, status
- Popup при клике: подробная информация

**Кластеризация:** при zoom < 6 маркеры группируются в кластеры с числом юнитов.

#### 3.2 Левая панель — Fleet List (300px, коллапсируемая)

- **Поиск**: по unit_number, driver, VIN
- **Фильтры**: по статусу (driving / idle / off)
- **Компактные карточки юнитов**:
  - Иконка статуса (цветной кружок)
  - Unit number (bold) + Driver name
  - Скорость: "62 mph" или "Stopped"
  - Последнее обновление: "2 sec ago"
  - Мини-прогрессбар топлива
- **Клик** по карточке — карта flyTo к юниту
- **Счётчики вверху**: Driving: 12 | Idle: 3 | Off: 5

#### 3.3 Detail Panel — при клике на маркер (справа, slide-in, 400px)

**Header:** Unit number, status badge, Driver name

**Секция Location:**
- Текущий адрес (reverse geocoding)
- Координаты (JetBrains Mono)
- Скорость, направление (компас)

**Секция Vehicle Stats:**
- Одометр (миль)
- Уровень топлива (прогрессбар)
- Статус двигателя
- Время в текущем статусе ("Driving for 2h 34m")

**Секция Today's Route:**
- Полилиния маршрута за сегодня
- Пройдено миль

**Quick Actions:**
- "Update Mileage" — обновляет units.current_mileage
- "Report Defect" — создание дефекта
- "Set Geofence" — рисование геозоны

#### 3.4 Top Bar — KPI + Controls (поверх карты, полупрозрачный)

**KPI бейджи:**
- In Motion: X | Idle: X | Stopped: X | In Repair: X
- Fleet Miles Today: X,XXX mi
- Fleet Fuel Avg: XX%

**Контролы:**
- Toggle: Geofences (show/hide)
- Toggle: Route trails (show/hide)
- Кнопка "Fit All" — все грузовики в кадре
- Кнопка Fullscreen

#### 3.5 History / Replay Mode (отдельная вкладка или режим)

- Выбор юнита + выбор даты
- Ползунок времени (timeline scrubber)
- Play / Pause с анимацией движения по маршруту
- Скорость: 1x, 2x, 5x, 10x
- Метки на маршруте: остановки, заправки, смена статуса

### 4. Адаптерная архитектура (TypeScript интерфейсы)

```typescript
interface GPSProviderAdapter {
  name: string;  // 'samsara' | 'motive' | 'geotab' | 'simulation'
  connect(config: ProviderConfig): Promise<void>;
  disconnect(): Promise<void>;
  getVehicleLocations(): Promise<VehicleLocation[]>;
  getVehicleLocation(vehicleId: string): Promise<VehicleLocation>;
  getLocationHistory(vehicleId: string, from: Date, to: Date): Promise<LocationPoint[]>;
  onLocationUpdate(callback: (location: VehicleLocation) => void): void;
}

interface VehicleLocation {
  externalVehicleId: string;
  unitId?: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedMph: number;
  engineStatus: 'off' | 'idle' | 'driving';
  odometer: number;
  fuelLevel?: number;
  timestamp: Date;
}

interface ProviderConfig {
  apiKey: string;
  apiUrl?: string;
  webhookUrl?: string;
  pollingIntervalMs?: number;
}
```

Реализовать для MVP только `simulation.adapter.ts`. Остальные адаптеры — пустые классы с TODO.

### 5. Интеграция с существующими модулями FleetOps

**Oil & Fluids:** GPS-одометр автоматически обновляет units.current_mileage, пересчитывая remaining_miles в oil_changes. Убирает ручной ввод.

**Mileage Logs:** Автоматическая запись ежедневного пробега (source = 'gps').

**IFTA:** Расчёт миль по штатам на основе GPS-треков (пересечение границ по координатам).

**Dashboard:** Новая KPI "In Motion / Idle / Stopped" + алерты по геозонам.

**Defects:** Создание дефекта из GPS-карты с привязкой к местоположению.

### 6. UI/UX

- Тёмная тема (navy backgrounds #0b0e14, #12161f)
- Blue accent (#3b82f6), статусные цвета (зелёный/жёлтый/красный)
- DM Sans для текста, JetBrains Mono для координат/скорости/одометра
- Плавные анимации маркеров (CSS transitions / requestAnimationFrame)
- Desktop-first, мобильная версия: карта fullscreen + bottom sheet

### 7. Моковые данные (20 грузовиков)

```
T-101, John Mitchell,    I-10 (LA→Houston),      driving, 62 mph, fuel 78%
T-102, Sarah Anderson,   I-95 (NY→Jacksonville),  idle,    0 mph,  fuel 45%
T-103, Mike Rodriguez,   I-40 (Memphis→Nashville), driving, 58 mph, fuel 92%
T-104, David Thompson,   I-80 (Chicago→Omaha),     off,     0 mph,  fuel 31%
T-105, James Wilson,     I-35 (Dallas→KC),          driving, 65 mph, fuel 67%
T-106, Robert Martinez,  I-75 (Detroit→Atlanta),    driving, 61 mph, fuel 54%
T-107, Chris Taylor,     I-90 (Seattle→Billings),   idle,    0 mph,  fuel 89%
T-108, Kevin Brown,      I-10 (Phoenix→El Paso),    driving, 57 mph, fuel 42%
T-109, Steve Davis,      I-95 (Baltimore→Richmond), off,     0 mph,  fuel 73%
T-110, Alex Johnson,     I-40 (OKC→Amarillo),       driving, 63 mph, fuel 81%
T-111, Brian White,      I-80 (SLC→Reno),           driving, 59 mph, fuel 36%
T-112, Daniel Harris,    I-35 (KC→Minneapolis),     idle,    0 mph,  fuel 95%
T-113, Mark Clark,       I-75 (Cincinnati→Tampa),   driving, 64 mph, fuel 58%
T-114, Tom Lewis,        I-90 (Sioux Falls→Chicago),off,     0 mph,  fuel 22%
T-115, Ryan Walker,      I-10 (SA→Houston),          driving, 60 mph, fuel 71%
T-116, Jason Hall,       I-95 (Philly→Baltimore),    driving, 56 mph, fuel 83%
T-117, Eric Young,       I-40 (Albuquerque→Amarillo),idle,    0 mph,  fuel 47%
T-118, Aaron King,       I-80 (Omaha→SLC),           driving, 62 mph, fuel 64%
T-119, Matt Wright,      I-35 (Dallas→OKC),          off,     0 mph,  fuel 88%
T-120, Greg Scott,       I-75 (Atlanta→Detroit),     driving, 66 mph, fuel 52%
```

### 8. Что НЕ нужно для MVP

- Реальная интеграция с Samsara/Motive/Geotab (только интерфейс + симулятор)
- ELD / Hours of Service
- Dash cam
- Расчёт ETA и маршрутизация
- Push-уведомления (только in-app toast)
- Мобильное приложение

### 9. Порядок реализации

1. Schema — создать таблицы, включить Realtime
2. Simulator — генерация движения по маршрутам
3. Map Component — базовая карта с маркерами
4. Realtime — подписка + анимация маркеров
5. Fleet Panel — боковая панель со списком
6. Detail Panel — информация при клике
7. History/Replay — маршрут за день + воспроизведение
8. Geofences — рисование зон + алерты
9. Integration hooks — подключение к Oil & Fluids, Mileage
10. Polish — анимации, responsive, performance

### 10. Критерии успеха

- Карта открывается < 2 секунд
- 20 грузовиков движутся по карте плавно
- Маркеры обновляются без прыжков (smooth animation)
- Клик на грузовик — детальная информация
- Фильтрация по статусу работает
- История маршрута отображается полилинией
- Replay mode с ползунком времени
- Тёмная тема консистентна с FleetOps
- Адаптерный интерфейс готов для production
