# ПРОМТ: Генерация PRD для расширения FleetOps

## Контекст

Ты — продуктовый аналитик, специализирующийся на fleet management системах для логистических компаний в США. У тебя есть существующая платформа FleetOps (React 18 + TypeScript, Supabase, Vercel) с реализованными модулями: Dashboard, Oil & Fluids, DOT Inspection, Registration, Repairs, Defects, Mileage Logs, Units/Unit Profile, Drivers HR (базовый), Audit Log (базовый), Auth с 4 ролями (Admin, Director, Dispatcher, Viewer).

По результатам gap-анализа выявлены недостающие модули, критически необходимые для полноценной работы логистической компании, управляющей автопарком грузовиков в США из Узбекистана.

## Задача

Создай отдельный PRD-документ **FleetOps_PRD_Expansion** на русском языке, описывающий **10 новых модулей** для расширения платформы. Документ должен быть готов к передаче команде разработки.

## Структура PRD

### 1. Резюме
- Краткое описание целей расширения
- Ссылка на основной PRD (FleetOps_PRD_v2)
- Список всех 10 новых модулей

### 2. Модуль: Управление водителями (Driver Management)
**Приоритет: Критический | Регуляторное требование FMCSA**

Полная карточка водителя с отслеживанием квалификационных документов (Driver Qualification Files по 49 CFR §391.51).

Описать:
- **Таблица `drivers`**: id, full_name, phone, email, date_of_birth, cdl_number, cdl_state, cdl_class (A/B/C), cdl_expiry_date, medical_card_number, medical_card_expiry_date, hire_date, termination_date, status (working/reviewing/terminated), current_unit_id (FK → units), notes, created_at
- **Таблица `driver_history`**: id, unit_id, driver_id, assigned_date, removed_date, note
- **UI: Карточки и таблица** — аватар с инициалами (цвет по статусу), ФИО, телефон, дата найма, стаж, назначенный юнит, CDL с датой истечения, Medical Card с датой истечения, кнопки действий
- **KPI-карточки**: Working (зелёный), Reviewing (жёлтый), Terminated (красный), Expiring Docs (оранжевый — CDL или Medical < 90 дней), Avg Tenure
- **Цветовая индикация сроков CDL и Medical Card**: > 90 дней = зелёный, 30–90 = жёлтый, 7–30 = оранжевый, < 7 или истёк = красный
- **Создание/редактирование** через модальное окно
- **Интеграция**: замена текстового driver_name на driver_id (FK) в таблице units. Алерты по истечению документов на главном Dashboard. Переход из карточки водителя к юниту и обратно.

### 3. Модуль: Осмотры транспорта (DVIR — Driver Vehicle Inspection Reports)
**Приоритет: Критический | Федеральное требование 49 CFR §396.11**

Электронные предрейсовые и послерейсовые осмотры.

Описать:
- **Таблица `dvir_reports`**: id, unit_id, driver_id, report_type (pre_trip/post_trip), report_date, items_checked (JSONB — массив пунктов чеклиста с результатами pass/fail), defects_found (BOOLEAN), defect_description (TEXT), signature_url, status (clean/defects_noted/out_of_service), created_at
- **Стандартный чеклист** (на основе FMCSA требований): тормоза, шины, фары/сигналы, зеркала, рулевое управление, сцепное устройство, выхлопная система, аварийное оборудование, стеклоочистители, звуковой сигнал, ремни безопасности, уровень жидкостей
- **UI**: форма чеклиста с pass/fail переключателями, поле для описания дефекта, кнопка электронной подписи
- **Workflow**: водитель/диспетчер заполняет чеклист → если defects_found = true → автоматически создаётся запись в таблице `defects` с dvir_report_id → дефект появляется на Dashboard
- **Архив отчётов** с фильтрами по юниту, водителю, дате, статусу — готов к предъявлению при DOT-аудите

### 4. Модуль: Учёт топлива (Fuel Management)
**Приоритет: Критический | 30–40% операционных расходов**

Описать:
- **Таблица `fuel_entries`**: id, unit_id, driver_id, fuel_date, gallons (DECIMAL), price_per_gallon (DECIMAL), total_cost (DECIMAL computed), fuel_type (diesel/DEF/gasoline), odometer_at_fill (INTEGER), location_state, location_city, station_name, receipt_url, entered_by (FK → users), created_at
- **Вычисляемые метрики**: MPG по юниту (мили между заправками / галлоны), средний MPG по флоту, стоимость за милю, аномалии расхода (MPG < 80% от среднего юнита)
- **UI**: таблица заправок с фильтрами, карточки юнитов с MPG-графиком, выделение аномалий красным
- **KPI на Dashboard**: общий расход топлива ($), средний MPG, количество аномалий, топ-3 юнита по расходу
- **Модальное окно добавления**: юнит, водитель, дата, галлоны, цена, штат, станция, загрузка чека

### 5. Модуль: IFTA-отчётность
**Приоритет: Важный | Обязательные квартальные отчёты**

Описать:
- **Таблица `ifta_mileage`**: id, unit_id, quarter (1-4), year, state_code (VARCHAR(2)), miles_driven (INTEGER), fuel_gallons_purchased (DECIMAL), created_at
- **Функциональность**: ручной ввод пробега по штатам (с возможностью будущей автоматизации через GPS), подтягивание данных о заправках из fuel_entries, расчёт налога по штатам, формирование квартального отчёта, экспорт в CSV/Excel
- **UI**: таблица по штатам с колонками: штат, мили, галлоны купленные, галлоны потреблённые, налоговая ставка, к оплате/возврату
- **Напоминания**: алерты за 14 дней до дедлайнов (30 апреля, 31 июля, 31 октября, 31 января)

### 6. Модуль: Страхование (Insurance Tracking)
**Приоритет: Критический | Провал покрытия = остановка бизнеса**

Описать:
- **Таблица `insurance_policies`**: id, policy_type (liability/cargo/physical_damage/workers_comp/general), provider_name, policy_number, coverage_amount (DECIMAL), premium_amount (DECIMAL), effective_date, expiry_date, document_url, applies_to (fleet_wide/specific), unit_id (FK nullable), notes, created_at
- **Цветовая индикация**: аналогично DOT Inspection (> 90 дней зелёный, 30–90 жёлтый, 7–30 оранжевый, < 7 красный)
- **UI**: карточки полисов, таблица, KPI (активные полисы, истекающие < 30 дней, общая сумма покрытия, общая премия)
- **Алерт на Dashboard** при приближении срока истечения любого полиса

### 7. Модуль: Обслуживание по времени (Time-Based Maintenance)
**Приоритет: Важный | Двойной триггер ТО**

Описать:
- **Изменения в таблице `oil_changes`**: добавить time_interval_days (INTEGER), last_service_date (DATE), next_service_date (COMPUTED: last_service_date + time_interval_days), trigger_type ENUM ('mileage', 'time', 'both')
- **Логика**: если trigger_type = 'both', статус определяется по ХУДШЕМУ из двух показателей (пробег или время). Если осталось 20% пробега (жёлтый) но 5% времени (красный) → показываем красный
- **UI**: в таблице Oil & Fluids добавить колонку «Дней до ТО» рядом с «Остаток миль». Цвет строки определяется худшим показателем.
- **Настройки по умолчанию**: Engine Oil — 15 000 миль / 180 дней, Transmission — 30 000 миль / 365 дней, Differential — 50 000 миль / 730 дней, Coolant — 40 000 миль / 730 дней, Power Steering — 60 000 миль / 730 дней

### 8. Модуль: Управление трейлерами (Trailer Management)
**Приоритет: Важный | Отдельные инспекции и регистрации**

Описать:
- **Таблица `trailers`**: id, trailer_number (VARCHAR UNIQUE), vin (VARCHAR(17)), trailer_type ENUM (dry_van/reefer/flatbed/tanker/lowboy), status ENUM (active/inactive/in_repair), current_unit_id (FK → units nullable), registration_state, plate_number, make, model, year, created_at
- **Таблица `trailer_history`**: id, trailer_id, unit_id, attached_date, detached_date, note
- **Интеграция с существующими модулями**: таблицы inspections, registrations, repairs, defects получают дополнительное поле trailer_id (FK nullable). Запись привязывается ЛИБО к unit_id ЛИБО к trailer_id.
- **UI**: отдельная вкладка в сайдбаре «Trailers», карточки трейлеров с номером, типом, VIN, текущим тягачом, статусами инспекции/регистрации
- **Профиль трейлера**: аналогично Unit Profile — Overview, Inspections, Registration, Repairs, Defects, History

### 9. Модуль: Учёт шин (Tire Management)
**Приоритет: Желательный | Вторая статья расходов после топлива**

Описать:
- **Таблица `tires`**: id, asset_type ENUM (unit/trailer), asset_id (UUID), position VARCHAR(10) (LF, RF, LRO, LRI, RRO, RRI, и т.д. — 18 позиций для тягач + трейлер), brand, model, size, dot_code (код производства на шине), install_date, install_mileage, tread_depth_current (DECIMAL мм), tread_depth_min (DECIMAL — минимально допустимая), status ENUM (active/spare/retreaded/scrapped), cost (DECIMAL), created_at
- **Таблица `tire_inspections`**: id, tire_id, inspection_date, tread_depth (DECIMAL), pressure (DECIMAL PSI), condition_notes, inspected_by (FK → users)
- **UI**: визуальная диаграмма позиций шин на схеме грузовика/трейлера, цветовая индикация износа (зелёный > 50%, жёлтый 25–50%, оранжевый 10–25%, красный < 10% до минимума)
- **KPI**: общие расходы на шины, средний пробег шины, количество шин требующих замены

### 10. Модуль: Управление поставщиками (Vendor Management)
**Приоритет: Желательный | Контроль расходов по сервисам**

Описать:
- **Таблица `vendors`**: id, name, vendor_type ENUM (mechanic_shop/parts_supplier/tire_shop/dealer/fuel_station/body_shop), address, city, state, zip, phone, email, contact_person, rating (1-5), notes, created_at
- **Интеграция**: поле vendor_id (FK) добавляется в таблицу repairs. Справочник доступен при создании записи ремонта.
- **UI**: справочник поставщиков с поиском и фильтрами, карточки с контактами и суммой расходов
- **Аналитика**: общие расходы по каждому поставщику, количество обращений, средняя стоимость ремонта

### 11. Расширение Audit Log
**Приоритет: Критический | Обязателен для DOT-аудита**

Описать:
- **Таблица `audit_logs`**: id, user_id (FK → users), action ENUM (create/update/delete), table_name VARCHAR, record_id UUID, old_values (JSONB), new_values (JSONB), ip_address, user_agent, created_at
- **UI**: таблица с фильтрами (по пользователю, юниту, модулю, дате), карточки диспетчеров с количеством изменений, визуализация old → new (старое значение зачёркнуто красным, новое зелёным)
- **KPI**: всего изменений, изменений сегодня, самый изменяемый юнит, мини-график за 14 дней
- **Автоматическое логирование** через Supabase Database Triggers на всех таблицах
- **Доступ**: только Admin и Director

### 12. Изменения в Dashboard
Описать новые KPI-карточки и алерты, которые появляются на главном Dashboard:
- Registration Due (< 30 дней)
- CDL/Medical Expiring (< 90 дней)
- Insurance Expiring (< 30 дней)
- Fuel Cost (за текущий период)
- Fleet MPG (средний расход)
- IFTA Deadline (ближайший срок подачи)

Новые колонки проблем:
- CDL/Medical Expiring — водители с истекающими документами
- Insurance Due — полисы близкие к истечению

### 13. Изменения в существующих таблицах
Описать ВСЕ изменения в существующих таблицах:
- units: добавить current_driver_id (FK → drivers)
- oil_changes: добавить time_interval_days, last_service_date, next_service_date, trigger_type
- repairs: добавить vendor_id (FK → vendors), category ENUM
- defects: добавить dvir_report_id (FK → dvir_reports), severity ENUM (critical/moderate/low)
- inspections: добавить trailer_id (FK → trailers nullable)
- registrations: добавить trailer_id (FK → trailers nullable)

### 14. Обработка часовых поясов
- Все даты хранятся в UTC (TIMESTAMPTZ)
- UI отображает в часовом поясе пользователя (настройка в профиле)
- Mileage logs: log_date привязан к дате по US timezone грузовика
- Диспетчеры в Узбекистане (UTC+5) видят даты в своём часовом поясе, но ввод пробега привязан к US-дате

### 15. Роли и разрешения для новых модулей
Расписать матрицу прав для каждого нового модуля по 4 ролям (Admin, Director, Dispatcher, Viewer) — кто может просматривать, создавать, редактировать, удалять.

### 16. SQL Schema Reference
Полный SQL для создания ВСЕХ новых таблиц, включая:
- CREATE TYPE для новых ENUM
- CREATE TABLE для каждой новой таблицы
- ALTER TABLE для изменений в существующих таблицах
- CREATE INDEX для часто используемых запросов
- Trigger functions для автоматического audit log

### 17. Фазы разработки
- Фаза 1 (Compliance, 4–5 недель): Водители, DVIR, Страхование, Audit Log, Часовые пояса
- Фаза 2 (Финансы, 3–4 недели): Топливо, IFTA, ТО по времени, Поставщики, Dashboard KPI
- Фаза 3 (Расширение, 2–3 недели): Трейлеры, Шины, расширение модулей для трейлеров

## Требования к формату
- Язык: русский
- Формат: структурированный PRD с таблицами, списками, чёткими спецификациями
- Каждый модуль должен содержать: бизнес-обоснование, структуру данных (таблицы с колонками и типами), описание UI, цветовую логику (если применимо), интеграцию с существующими модулями
- Стиль: аналогичен FleetOps_PRD_v2 (data-dense, техническая документация)
- UI/UX: тёмная тема (navy backgrounds), DM Sans / JetBrains Mono, цветовые индикаторы

## Дополнительный контекст
- Платформа работает на Supabase (PostgreSQL + Auth + RLS + Realtime + Storage)
- Frontend: React 18 + TypeScript + Tailwind CSS + Recharts
- Hosting: Vercel + Supabase Cloud
- Целевая аудитория: диспетчеры и директора в Узбекистане, управляющие флотом в США
- Desktop-first дизайн
- Существующая ролевая модель с RLS на уровне БД
