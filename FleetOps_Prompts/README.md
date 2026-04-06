# FleetOps — Промты для Claude Code

## Как использовать

Промт разбит на **10 файлов** по фазам разработки. Каждый файл — самостоятельная задача для Claude Code. Передавайте файлы **по одному**, в порядке номеров.

---

## Структура файлов

| # | Файл | Содержание | Фаза | ~Строк |
|---|------|-----------|------|--------|
| 00 | `00_OVERVIEW.md` | Контекст проекта, стек, роли | Прочитать первым ВСЕГДА | 42 |
| 01 | `01_AUTH_AND_UNITS.md` | Auth + User Management + Units CRUD | Phase 1 | 117 |
| 02 | `02_DRIVERS_AND_OIL.md` | Drivers HR + Oil & Fluids (ключевой модуль) | Phase 1 | 128 |
| 03 | `03_COMPLIANCE.md` | DOT Inspection + Registration + Repairs + Defects | Phase 2 | 152 |
| 04 | `04_DVIR_DISPATCH_ACCOUNTING.md` | DVIR + Dispatching + Accounting | Phase 2-3 | 212 |
| 05 | `05_FUEL_IFTA_INSURANCE_TRAILERS_VENDORS.md` | Fuel + IFTA + Insurance + Trailers + Vendors | Phase 3 | 222 |
| 06 | `06_AUDIT_DASHBOARD_NOTIFICATIONS_CONFIG.md` | Audit Log + Dashboard + Notifications + UI/UX + Config | Phase 3-4 | 324 |
| 07 | `07_SAMSARA_INTEGRATION.md` | Samsara API (8 endpoints, Edge Functions, webhooks) | Phase 5 | 690 |
| 08 | `08_TTELD_INTEGRATION.md` | TT ELD API (6 endpoints, Edge Functions) | Phase 5 | 183 |
| 09 | `09_WIALON_REGION_PROFILE.md` | Wialon/IMG API + Region Profile (US/CIS) | Phase 5 | 359 |

---

## Порядок работы с Claude Code

### Phase 1: Core MVP (5-6 недель)

**Сессия 1:** Передайте `00_OVERVIEW.md` + `01_AUTH_AND_UNITS.md`
```
Задача: Создай Supabase проект, database schema, RLS policies.
Реализуй Auth (login, roles, profiles), Units CRUD, Unit Profile.
Sidebar navigation, dark/light theme.
```

**Сессия 2:** Передайте `00_OVERVIEW.md` + `02_DRIVERS_AND_OIL.md`
```
Задача: Реализуй Drivers HR модуль и Oil & Fluids модуль.
Oil — самый важный модуль: workflow Mileage → Send → Done,
цветовая индикация, dual trigger (mileage + time).
Также: страница Mileage Entry (bulk entry для всех units).
```

### Phase 2: Compliance Modules (4-5 недель)

**Сессия 3:** Передайте `00_OVERVIEW.md` + `03_COMPLIANCE.md`
```
Задача: Реализуй DOT Inspections (table + cards + countdown rings),
Registration, Repairs (с categories + cost analytics),
Defects (severity levels + resolve workflow).
```

**Сессия 4:** Передайте `00_OVERVIEW.md` + `04_DVIR_DISPATCH_ACCOUNTING.md`
```
Задача: Реализуй DVIR (чеклист + auto-create defects),
Dispatching (load board Kanban + load lifecycle),
Accounting (transactions, invoices, P&L, settlements).
```

### Phase 3: Operations (3-4 недели)

**Сессия 5:** Передайте `00_OVERVIEW.md` + `05_FUEL_IFTA_INSURANCE_TRAILERS_VENDORS.md`
```
Задача: Реализуй Fuel Management (MPG analytics),
IFTA Reporting, Insurance Tracking,
Trailer Management, Vendors.
```

### Phase 4: Polish & Advanced (2-3 недели)

**Сессия 6:** Передайте `00_OVERVIEW.md` + `06_AUDIT_DASHBOARD_NOTIFICATIONS_CONFIG.md`
```
Задача: Реализуй Audit Log (triggers на все таблицы),
Dashboard (KPI cards + problem columns + realtime),
Notifications (in-app + email), Export CSV/Excel.
Настрой Mock Data, responsive, fullscreen mode.
```

### Phase 5: Integrations & Multi-Region (4-5 недель)

**Сессия 7:** Передайте `00_OVERVIEW.md` + `07_SAMSARA_INTEGRATION.md`
```
Задача: Реализуй Samsara Integration — Settings UI,
Vehicle mapping, Edge Functions (odometer, GPS, DVIR webhook,
IFTA, fault codes), Cron Jobs, Live Fleet Map, Sync Log.
```

**Сессия 8:** Передайте `00_OVERVIEW.md` + `08_TTELD_INTEGRATION.md`
```
Задача: Реализуй TT ELD Integration — Settings UI,
Vehicle mapping по VIN, Edge Function для GPS + odometer
из tracking history, Driver sync.
```

**Сессия 9:** Передайте `00_OVERVIEW.md` + `09_WIALON_REGION_PROFILE.md`
```
Задача: Реализуй Wialon (IMG) Integration для СНГ рынка.
Region Profile (US/CIS) — onboarding, unit conversion,
module visibility, i18n (русский).
```

---

## Важные правила для Claude Code

1. **ВСЕГДА передавайте `00_OVERVIEW.md` первым** — он содержит стек, роли, контекст
2. **Один файл = одна сессия** — не передавайте несколько модулей за раз
3. **Каждая сессия начинается с**: "Прочитай эти два файла и реализуй всё что описано"
4. **Между сессиями**: проверяйте результат, тестируйте, фиксите баги
5. **При багах**: покажите Claude Code ошибку + соответствующий файл промта
6. **Mock data**: создавайте в Session 6 (Dashboard), ссылаясь на все предыдущие таблицы

---

## Сравнение интеграций

| Возможность | Samsara | TT ELD | Wialon (IMG) |
|---|---|---|---|
| GPS real-time | ✅ | ✅ | ✅ |
| Одометр авто | ✅ | ✅ (из trackings) | ✅ (counter) |
| DVIR | ✅ webhook | ❌ | ❌ |
| IFTA по штатам | ✅ | ❌ | ❌ |
| Fault codes | ✅ | ❌ | ❌ |
| Уровень топлива | ✅ | ❌ | ✅ (датчик) |
| Service intervals | ❌ | ❌ | ✅ |
| Webhooks | ✅ | ❌ | ❌ |
| Рынок | США | США (узб.) | СНГ |
| Стоимость | $27+/мес за truck | Дешевле | Дешевле |
