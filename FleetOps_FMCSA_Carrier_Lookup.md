# FleetOps — Модуль: Поиск перевозчика (FMCSA Carrier Lookup)

## Назначение

Встроенная функция поиска по открытым федеральным реестрам США (FMCSA SAFER System). Пользователь вводит **DOT Number**, **MC Number** или **название компании** — система возвращает публичные данные о перевозчике: название, адрес, количество грузовиков, трейлеров, водителей, статус лицензии, рейтинг безопасности.

---

## Источник данных

**FMCSA QCMobile API** — бесплатный REST API от Federal Motor Carrier Safety Administration.

- Портал разработчика: `https://mobile.fmcsa.dot.gov/QCDevsite/home`
- Base URL: `https://mobile.fmcsa.dot.gov/qc/services/`
- Формат ответа: JSON
- Аутентификация: параметр `webKey` в каждом запросе
- Лимит: 50 записей на запрос

### Получение API-ключа (webKey)

1. Создать аккаунт на **Login.gov** → `https://mobile.fmcsa.dot.gov/QCDevsite/logingovInfo`
2. Войти в Developer Portal
3. Перейти в **My WebKeys** → **Get a new WebKey**
4. Заполнить форму (Application Name: "FleetOps")
5. Сохранить полученный ключ

### Хранение ключа

```
# .env (НЕ коммитить в git)
FMCSA_API_KEY=your_web_key_here
```

В Supabase Edge Function ключ передаётся через **Supabase Secrets**:

```bash
supabase secrets set FMCSA_API_KEY=your_web_key_here
```

---

## API Endpoints

### 1. Поиск по названию

```
GET /carriers/name/{name}?webKey={key}
```

Параметры: `start` (offset), `size` (limit, max 50)

Пример: `/carriers/name/greyhound?webKey=xxx`

### 2. Поиск по DOT Number

```
GET /carriers/{dotNumber}?webKey={key}
```

Пример: `/carriers/44110?webKey=xxx`

### 3. Поиск по MC/Docket Number

```
GET /carriers/docket-number/{docketNumber}?webKey={key}
```

### 4. Дополнительные данные (по DOT Number)

| Endpoint | Данные |
|---|---|
| `/carriers/{dot}/basics` | BASIC Safety Scores (CSA рейтинги) |
| `/carriers/{dot}/cargo-carried` | Типы грузов |
| `/carriers/{dot}/operation-classification` | Классификация операций |
| `/carriers/{dot}/authority` | Авторизации (Common/Contract/Broker) |
| `/carriers/{dot}/oos` | Out of Service записи |
| `/carriers/{dot}/docket-numbers` | Связанные MC/MX номера |

---

## Возвращаемые поля (Carrier Details)

| Поле API | Описание | Отображение в UI |
|---|---|---|
| `legalName` | Юридическое название | Название компании |
| `dbaName` | Торговое название (DBA) | Альтернативное название |
| `dotNumber` | DOT номер | DOT # |
| `mcNumber` | MC номер | MC # |
| `allowToOperate` | Разрешение на работу (Y/N) | Статус: Active / Not Authorized |
| `outOfService` | Out of Service (Y/N) | Бейдж: OOS (красный) |
| `outOfServiceDate` | Дата OOS | Дата приостановки |
| `phyStreet` | Адрес (улица) | Строка адреса |
| `phyCity` | Город | Город |
| `phyState` | Штат | Штат |
| `phyZip` | Индекс | ZIP |
| `phyCountry` | Страна | Страна |
| `telephone` | Телефон | Контакт |
| `passengerVehicle` | Общее кол-во транспорта | Всего ТС |
| `busVehicle` | Школьные автобусы | — |
| `limoVehicle` | Лимузины | — |
| `miniBusVehicle` | Мини-автобусы | — |
| `motorCoachVehicle` | Автобусы | — |
| `vanVehicle` | Фургоны | — |
| `complaintCount` | Кол-во жалоб | Жалобы |

> **Примечание:** API не возвращает отдельно `powerUnits` (грузовики) и `drivers` в стандартном ответе. Эти данные доступны через SAFER web-сайт. Для получения полного набора данных рекомендуется дополнительный парсинг SAFER или использование расширенных данных из `/basics` endpoint.

---

## Архитектура

### Supabase Edge Function

Создать Edge Function `fmcsa-lookup` для проксирования запросов к FMCSA API. Это нужно чтобы:
- Не выставлять API-ключ на фронтенд
- Контролировать rate limiting
- Кэшировать результаты

```
supabase/functions/fmcsa-lookup/index.ts
```

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";
const FMCSA_KEY = Deno.env.get("FMCSA_API_KEY")!;

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { searchType, query } = await req.json();

    // Валидация
    if (!searchType || !query) {
      return new Response(
        JSON.stringify({ error: "searchType and query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let url: string;

    switch (searchType) {
      case "dot":
        url = `${FMCSA_BASE}/carriers/${encodeURIComponent(query)}?webKey=${FMCSA_KEY}`;
        break;
      case "mc":
        url = `${FMCSA_BASE}/carriers/docket-number/${encodeURIComponent(query)}?webKey=${FMCSA_KEY}`;
        break;
      case "name":
        url = `${FMCSA_BASE}/carriers/name/${encodeURIComponent(query)}?webKey=${FMCSA_KEY}&size=20`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid searchType. Use: dot, mc, name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const fmcsaRes = await fetch(url);
    const data = await fmcsaRes.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Деплой Edge Function

```bash
supabase functions deploy fmcsa-lookup
supabase secrets set FMCSA_API_KEY=your_key_here
```

---

## Frontend — React компонент

### Расположение

```
src/components/CarrierLookup/
├── CarrierLookup.tsx        # Основной компонент
├── CarrierCard.tsx           # Карточка результата
├── useCarrierSearch.ts       # Хук для API вызовов
└── types.ts                  # TypeScript типы
```

### types.ts

```typescript
export interface CarrierData {
  legalName: string;
  dbaName?: string;
  dotNumber: number;
  mcNumber?: number;
  allowToOperate: "Y" | "N";
  outOfService?: "Y" | "N";
  outOfServiceDate?: string;
  phyStreet: string;
  phyCity: string;
  phyState: string;
  phyZip: string;
  phyCountry: string;
  telephone?: string;
  passengerVehicle?: number;
  busVehicle?: number;
  limoVehicle?: number;
  miniBusVehicle?: number;
  motorCoachVehicle?: number;
  vanVehicle?: number;
  complaintCount?: number;
}

export type SearchType = "dot" | "mc" | "name";
```

### useCarrierSearch.ts

```typescript
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CarrierData, SearchType } from "./types";

export function useCarrierSearch() {
  const [results, setResults] = useState<CarrierData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (searchType: SearchType, query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "fmcsa-lookup",
        { body: { searchType, query: query.trim() } }
      );

      if (fnError) throw fnError;

      // FMCSA возвращает content → carrier (одиночный) или content[] (массив)
      const carriers = Array.isArray(data?.content)
        ? data.content.map((c: any) => c.carrier)
        : data?.content?.carrier
          ? [data.content.carrier]
          : [];

      setResults(carriers);

      if (carriers.length === 0) {
        setError("Перевозчик не найден. Проверьте введённые данные.");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при поиске");
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}
```

### CarrierLookup.tsx

```tsx
import { useState } from "react";
import { Search, Truck, MapPin, Phone, Shield, AlertTriangle } from "lucide-react";
import { useCarrierSearch } from "./useCarrierSearch";
import { CarrierCard } from "./CarrierCard";
import type { SearchType } from "./types";

export function CarrierLookup() {
  const [searchType, setSearchType] = useState<SearchType>("dot");
  const [query, setQuery] = useState("");
  const { results, loading, error, search } = useCarrierSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchType, query);
  };

  const placeholders: Record<SearchType, string> = {
    dot: "Введите DOT номер (напр. 44110)",
    mc: "Введите MC номер (напр. 1515)",
    name: "Введите название компании",
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          Carrier Lookup — FMCSA
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Поиск по открытым данным FMCSA (DOT #, MC #, название)
        </p>
      </div>

      {/* Форма поиска */}
      <div className="bg-[#12161f] rounded-lg border border-slate-700/50 p-4">
        <div className="flex gap-2 mb-3">
          {(["dot", "mc", "name"] as SearchType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                searchType === type
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-300 border border-transparent"
              }`}
            >
              {type === "dot" ? "DOT #" : type === "mc" ? "MC #" : "Name"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            placeholder={placeholders[searchType]}
            className="flex-1 bg-[#0b0e14] border border-slate-700 rounded-lg px-4 py-2.5
              text-white placeholder-slate-500 font-mono text-sm
              focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
              text-white rounded-lg text-sm font-medium transition-colors
              flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      {/* Результаты */}
      <div className="space-y-3">
        {results.map((carrier, i) => (
          <CarrierCard key={carrier.dotNumber || i} carrier={carrier} />
        ))}
      </div>
    </div>
  );
}
```

### CarrierCard.tsx

```tsx
import { Truck, MapPin, Phone, Shield, ShieldAlert, Building2 } from "lucide-react";
import type { CarrierData } from "./types";

interface Props {
  carrier: CarrierData;
}

export function CarrierCard({ carrier }: Props) {
  const isActive = carrier.allowToOperate === "Y";
  const isOOS = carrier.outOfService === "Y";

  const totalVehicles =
    (carrier.passengerVehicle || 0) +
    (carrier.busVehicle || 0) +
    (carrier.limoVehicle || 0) +
    (carrier.miniBusVehicle || 0) +
    (carrier.motorCoachVehicle || 0) +
    (carrier.vanVehicle || 0);

  return (
    <div className="bg-[#12161f] rounded-lg border border-slate-700/50 p-5 space-y-4">
      {/* Шапка: Название + Статус */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{carrier.legalName}</h3>
          {carrier.dbaName && (
            <p className="text-sm text-slate-400">DBA: {carrier.dbaName}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isOOS ? (
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              OUT OF SERVICE
            </span>
          ) : isActive ? (
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              ACTIVE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              NOT AUTHORIZED
            </span>
          )}
        </div>
      </div>

      {/* KPI Бейджи */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b0e14] rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">DOT #</p>
          <p className="text-sm font-mono text-blue-400 font-bold">
            {carrier.dotNumber || "—"}
          </p>
        </div>
        <div className="bg-[#0b0e14] rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">MC #</p>
          <p className="text-sm font-mono text-blue-400 font-bold">
            {carrier.mcNumber || "—"}
          </p>
        </div>
        <div className="bg-[#0b0e14] rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Vehicles</p>
          <p className="text-sm font-mono text-white font-bold flex items-center justify-center gap-1">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            {totalVehicles || "—"}
          </p>
        </div>
        <div className="bg-[#0b0e14] rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Complaints</p>
          <p className={`text-sm font-mono font-bold ${
            (carrier.complaintCount || 0) > 0 ? "text-orange-400" : "text-green-400"
          }`}>
            {carrier.complaintCount ?? 0}
          </p>
        </div>
      </div>

      {/* Адрес и телефон */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
        {carrier.phyCity && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            {[carrier.phyStreet, carrier.phyCity, carrier.phyState, carrier.phyZip]
              .filter(Boolean)
              .join(", ")}
          </span>
        )}
        {carrier.telephone && (
          <span className="flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-slate-500" />
            {carrier.telephone}
          </span>
        )}
      </div>

      {/* Ссылка на SAFER */}
      <div className="pt-2 border-t border-slate-700/50">
        <a
          href={`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnap&query_param=USDOT&query_string=${carrier.dotNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <Shield className="w-3.5 h-3.5" />
          Полный профиль на FMCSA SAFER →
        </a>
      </div>
    </div>
  );
}
```

---

## Интеграция в FleetOps

### Sidebar Navigation

Добавить пункт в сайдбар:

```tsx
{
  icon: Search,
  label: "Carrier Lookup",
  path: "/carrier-lookup",
  badge: null // без бейджа
}
```

Расположение: после основных модулей, перед Settings.

### Routing

```tsx
// App.tsx / router
<Route path="/carrier-lookup" element={<CarrierLookup />} />
```

### Права доступа

| Действие | Admin | Director | Dispatcher | Viewer |
|---|---|---|---|---|
| Поиск перевозчика | ✅ | ✅ | ✅ | ✅ |

Доступ для всех ролей — данные публичные.

---

## Кэширование (опционально)

Для снижения нагрузки на FMCSA API можно кэшировать результаты в Supabase.

### Таблица: carrier_cache

```sql
CREATE TABLE carrier_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dot_number INTEGER UNIQUE,
  carrier_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carrier_cache_dot ON carrier_cache(dot_number);
```

### Логика кэширования в Edge Function

1. При поиске по DOT — сначала проверить `carrier_cache`
2. Если запись есть и `fetched_at` < 24 часов — вернуть из кэша
3. Если нет или устарела — запросить FMCSA API, сохранить в кэш, вернуть

---

## Ограничения FMCSA API

- **Rate limit**: не документирован явно, но рекомендуется не более 100 запросов/минуту
- **Лимит результатов**: максимум 50 записей на запрос по имени
- **Доступность**: API иногда недоступен (maintenance), нужен graceful fallback
- **Данные**: не все поля заполнены у всех перевозчиков
- **Power Units / Drivers**: стандартный endpoint не возвращает эти поля напрямую — они доступны через SAFER web-интерфейс. Для автоматического получения потребуется парсинг SAFER или сторонние API (AlphaLoops, CarrierOK и др.)

---

## Расширения (v2)

- **SAFER Scraping**: Supabase Edge Function с парсингом HTML-страницы SAFER для получения `powerUnits`, `drivers`, fleet size
- **Сохранение в контакты**: кнопка "Сохранить" для добавления перевозчика в локальный справочник vendors
- **Сравнение перевозчиков**: таблица side-by-side для нескольких DOT номеров
- **BASIC Scores**: визуализация CSA рейтингов (Recharts spider/radar chart)
- **Мониторинг**: подписка на изменения статуса перевозчика (периодическая проверка)
