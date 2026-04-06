# FleetOps PRD: 3 Новых бизнес-модуля

## CRM Pipeline • Контакты • Денежный поток

**Версия:** 3.0 | **Дата:** 3 апреля 2026 | **Статус:** Ready for Development

---

# 1. Резюме

Данный документ описывает 3 новых бизнес-модуля для FleetOps, вдохновлённых функциональностью Odoo CRM, Contacts и Accounting. Модули превращают FleetOps из чисто технической fleet management системы в полноценную бизнес-платформу для логистической компании.

**Модули:**
1. **CRM Pipeline** — Kanban-доска заказов с кастомными столбцами и drag-and-drop переходами
2. **Contacts** — Справочник заказчиков и транспортных компаний с автообогащением данных из открытых источников
3. **Cash Flow** — Денежный поток: счета, платежи, долги, баланс, мультивалютность

**Стек:** React 18 + TypeScript, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS, Recharts

---

# 2. МОДУЛЬ: CRM PIPELINE

## 2.1 Бизнес-обоснование

Логистическая компания работает с заказами на перевозки. Каждый заказ проходит через стадии: от получения заявки до завершения доставки и оплаты. В Odoo CRM пользователи могут создавать кастомные pipeline stages и перетаскивать карточки между ними. FleetOps реализует аналогичную концепцию, но адаптированную под логистику.

**Ключевая идея:** Пользователи (Admin, Director) сами создают столбцы (стадии) и определяют порядок. Диспетчеры перетаскивают заказы между стадиями. Система не диктует фиксированный workflow — компания сама решает, какие стадии нужны.

## 2.2 Структура данных

### Таблица: `pipeline_stages`
Стадии, которые пользователи создают и настраивают сами.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | Название стадии (например: «Новая заявка», «В работе», «Доставлено») |
| position | INTEGER NOT NULL | Порядок отображения (0, 1, 2...) — drag-and-drop меняет позицию |
| color | VARCHAR(7) DEFAULT '#3b82f6' | Цвет столбца в HEX |
| is_won | BOOLEAN DEFAULT false | Стадия считается «выигранной/завершённой» (для аналитики) |
| is_lost | BOOLEAN DEFAULT false | Стадия считается «потерянной/отменённой» |
| is_folded | BOOLEAN DEFAULT false | Свёрнут ли столбец на доске по умолчанию |
| rot_days | INTEGER DEFAULT 0 | Через сколько дней карточка «протухает» — подсвечивается красным (0 = отключено, аналог Odoo Days to Rot) |
| auto_action | JSONB DEFAULT '{}' | Автоматические действия при попадании в стадию: `{"notify_email": true, "assign_to": "uuid", "change_status": "in_progress"}` |
| created_by | UUID FK → profiles | Кто создал |
| created_at | TIMESTAMPTZ DEFAULT now() | Дата создания |

### Таблица: `deals`
Заказы/сделки, которые двигаются по pipeline.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| deal_number | VARCHAR(20) UNIQUE NOT NULL | Автоинкремент: ORD-0001, ORD-0002... |
| title | VARCHAR(200) NOT NULL | Краткое описание заказа |
| contact_id | UUID FK → contacts | Заказчик (ссылка на модуль Contacts) |
| carrier_id | UUID FK → contacts NULLABLE | Транспортная компания-перевозчик |
| stage_id | UUID FK → pipeline_stages NOT NULL | Текущая стадия |
| amount | DECIMAL(12,2) | Сумма сделки |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта сделки |
| priority | ENUM('low','medium','high','urgent') DEFAULT 'medium' | Приоритет |
| pickup_location | TEXT | Адрес загрузки |
| delivery_location | TEXT | Адрес доставки |
| pickup_date | DATE | Планируемая дата загрузки |
| delivery_date | DATE | Планируемая дата доставки |
| unit_id | UUID FK → units NULLABLE | Назначенный грузовик |
| driver_id | UUID FK → drivers NULLABLE | Назначенный водитель |
| assigned_to | UUID FK → profiles | Ответственный менеджер |
| notes | TEXT | Заметки |
| tags | TEXT[] DEFAULT '{}' | Теги для фильтрации |
| expected_close_date | DATE | Ожидаемая дата закрытия |
| probability | INTEGER DEFAULT 50 | Вероятность закрытия в % (0–100) |
| lost_reason | TEXT | Причина потери (если перемещено в is_lost стадию) |
| stage_entered_at | TIMESTAMPTZ DEFAULT now() | Когда карточка попала в текущую стадию (для расчёта rot_days) |
| created_by | UUID FK → profiles | Кто создал |
| created_at | TIMESTAMPTZ DEFAULT now() | Дата создания |
| updated_at | TIMESTAMPTZ DEFAULT now() | Последнее обновление |

### Таблица: `deal_activities`
Активности (звонки, задачи, заметки) привязанные к сделке — аналог Odoo Activity Planner.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| deal_id | UUID FK → deals | Ссылка на сделку |
| activity_type | ENUM('call','email','meeting','task','note') | Тип активности |
| summary | VARCHAR(200) NOT NULL | Краткое описание |
| description | TEXT | Подробности |
| due_date | DATE | Дата выполнения |
| is_done | BOOLEAN DEFAULT false | Выполнено |
| done_at | TIMESTAMPTZ | Когда выполнено |
| assigned_to | UUID FK → profiles | Кому назначено |
| created_by | UUID FK → profiles | Кто создал |
| created_at | TIMESTAMPTZ DEFAULT now() | Дата создания |

### Таблица: `deal_stage_history`
Лог перемещений между стадиями — для аналитики конверсии.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| deal_id | UUID FK → deals | Ссылка на сделку |
| from_stage_id | UUID FK → pipeline_stages NULLABLE | Откуда (null для первичного создания) |
| to_stage_id | UUID FK → pipeline_stages | Куда |
| moved_by | UUID FK → profiles | Кто переместил |
| moved_at | TIMESTAMPTZ DEFAULT now() | Когда |

## 2.3 UI/UX Спецификация

### Kanban-доска (основной вид)

- **Столбцы** — горизонтальный ряд колонок по стадиям, отсортированные по `position`
- **Карточки** внутри столбцов:
  - Deal number + title (жирный)
  - Контакт заказчика (имя компании)
  - Сумма + валюта
  - Приоритет (цветная точка: зелёный/жёлтый/оранжевый/красный)
  - Назначенный менеджер (аватар)
  - Даты pickup/delivery
  - Иконка активности (если есть просроченные)
- **Drag & drop** — перетаскивание карточки между столбцами обновляет `stage_id` и создаёт запись в `deal_stage_history`
- **«Протухшие» карточки** — если `rot_days > 0` и карточка в стадии дольше rot_days, она подсвечивается красной рамкой. Счётчик протухших показывается в заголовке столбца
- **«+ Добавить стадию»** — кнопка справа от последнего столбца. Клик → inline input → Enter для сохранения
- **Настройки стадии** — иконка ⚙️ в заголовке столбца: Edit (имя, цвет, rot_days, auto_action), Fold, Delete (только если нет карточек)
- **Перетаскивание столбцов** — drag handle в заголовке, меняет `position` всех стадий

### Создание сделки

- Кнопка «+ New Deal» в хедере страницы
- Модальное окно:
  - Title (обязательно)
  - Contact (dropdown с поиском из модуля Contacts — заказчики)
  - Carrier (dropdown — транспортные компании из Contacts)
  - Amount + Currency selector
  - Pickup/Delivery locations + dates
  - Priority (кнопки Low/Medium/High/Urgent)
  - Stage (по умолчанию — первая стадия)
  - Assigned To
  - Tags (multi-select)
  - Notes

### Детальный вид сделки

Клик на карточку → слайд-панель справа:
- Header: deal_number, title, stage badge, priority
- **Info section**: контакт, перевозчик, суммы, даты, unit, driver
- **Timeline/Activities**: список активностей с фильтром (все/звонки/задачи/заметки). Кнопка «+ Add Activity»
- **Stage History**: визуальный таймлайн перемещений между стадиями
- **Связанные документы**: invoices (из модуля Cash Flow), если есть

### KPI-карточки (верх страницы)

- **All Deals**: общее количество активных сделок
- **Total Value**: сумма по всем активным сделкам
- **Won This Month**: количество и сумма сделок перешедших в is_won стадию за текущий месяц
- **Lost This Month**: количество потерянных
- **Overdue Activities**: количество просроченных активностей
- **Conversion Rate**: % сделок дошедших до is_won стадии (за период)

### Дополнительные виды

- **Table view** — таблица всех сделок с сортировкой, фильтрами, поиском
- **Funnel chart** — визуализация воронки (количество сделок по стадиям)

## 2.4 Права доступа

| Действие | Admin | Director | Dispatcher | Viewer |
|----------|-------|----------|------------|--------|
| Просмотр Pipeline | ✅ | ✅ | ✅ | ✅ |
| Создание стадий | ✅ | ✅ | ❌ | ❌ |
| Редактирование/удаление стадий | ✅ | ✅ | ❌ | ❌ |
| Создание сделок | ✅ | ✅ | ✅ | ❌ |
| Перемещение сделок (drag & drop) | ✅ | ✅ | ✅ | ❌ |
| Редактирование сделок | ✅ | ✅ | ✅ (свои) | ❌ |
| Удаление сделок | ✅ | ❌ | ❌ | ❌ |
| Просмотр аналитики | ✅ | ✅ | ❌ | ❌ |

## 2.5 Интеграция с существующими модулями

- **Contacts** → contact_id и carrier_id ссылаются на таблицу contacts
- **Units** → unit_id позволяет назначить грузовик на заказ
- **Drivers** → driver_id позволяет назначить водителя
- **Cash Flow** → invoice может быть связан с deal через deal_id
- **Dashboard** → KPI-карточка «Active Deals» / «Overdue Deals» на главном дашборде

---

# 3. МОДУЛЬ: CONTACTS (Контакты)

## 3.1 Бизнес-обоснование

Единый справочник всех бизнес-контактов. Два типа: **заказчики** (shipper/broker — кто заказывает перевозку) и **транспортные компании/перевозчики** (carrier — кто осуществляет перевозку, включая свою компанию). Аналог Odoo Contacts с функцией Partner Autocomplete — система автоматически находит данные компании (адрес, налоговый номер, телефон) из открытых источников при вводе названия или EIN/tax number.

**Источники автообогащения для US-компаний:**
- **FMCSA SAFER** (https://safer.fmcsa.dot.gov) — по MC# или DOT# находит: название, адрес, телефон, кол-во ТС, тип операции, статус authority
- **OpenCorporates API** — по названию компании: регистрационные данные, адрес, дата основания
- **Google Places API** — дополнительные данные: адрес, телефон, website, часы работы

## 3.2 Структура данных

### Таблица: `contacts`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| contact_type | ENUM('company','person') NOT NULL | Тип: компания или физлицо |
| company_type | ENUM('customer','carrier','both','other') DEFAULT 'customer' | Подтип компании |
| company_name | VARCHAR(200) | Название компании |
| display_name | VARCHAR(200) NOT NULL | Отображаемое имя (= company_name или full_name) |
| full_name | VARCHAR(100) | ФИО контактного лица |
| job_title | VARCHAR(100) | Должность контактного лица |
| parent_id | UUID FK → contacts NULLABLE | Родительская компания (для контактного лица внутри компании) |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(20) | Основной телефон |
| mobile | VARCHAR(20) | Мобильный |
| website | VARCHAR(255) | Вебсайт |
| — **Адрес** | | |
| street | VARCHAR(200) | Улица, дом |
| city | VARCHAR(100) | Город |
| state | VARCHAR(50) | Штат (для US — 2-буквенный код) |
| zip | VARCHAR(20) | ZIP-код |
| country | VARCHAR(2) DEFAULT 'US' | ISO код страны |
| — **Реквизиты** | | |
| tax_id | VARCHAR(20) | EIN (Employer Identification Number) для US / ИНН |
| mc_number | VARCHAR(20) | MC# (Motor Carrier number) — для транспортных компаний |
| dot_number | VARCHAR(20) | DOT# — для транспортных компаний |
| usdot_status | VARCHAR(20) | Статус USDOT authority (active/inactive/not authorized) |
| authority_status | VARCHAR(50) | Common/Contract/Broker authority status |
| — **Финансовые** | | |
| payment_terms | INTEGER DEFAULT 30 | Стандартный срок оплаты в днях |
| credit_limit | DECIMAL(12,2) DEFAULT 0 | Кредитный лимит |
| currency | VARCHAR(3) DEFAULT 'USD' | Предпочтительная валюта |
| — **Дополнительные** | | |
| fleet_size | INTEGER | Количество ТС (из FMCSA) |
| driver_count | INTEGER | Количество водителей (из FMCSA) |
| insurance_info | JSONB DEFAULT '{}' | Страховые данные из FMCSA: `{"liability": "1000000", "cargo": "100000", "insurer": "..."}` |
| logo_url | TEXT | URL логотипа компании |
| tags | TEXT[] DEFAULT '{}' | Теги: ['vip', 'reefer', 'flatbed', 'hazmat'] |
| rating | INTEGER CHECK (1-5) | Рейтинг 1–5 звёзд |
| notes | TEXT | Заметки |
| is_active | BOOLEAN DEFAULT true | Активен/деактивирован |
| enriched_at | TIMESTAMPTZ | Когда последний раз обогащались данные |
| enrichment_source | VARCHAR(50) | Источник обогащения (fmcsa/opencorporates/manual) |
| created_by | UUID FK → profiles | Кто создал |
| created_at | TIMESTAMPTZ DEFAULT now() | Дата создания |
| updated_at | TIMESTAMPTZ DEFAULT now() | Последнее обновление |

### Таблица: `contact_interactions`
Лог взаимодействий с контактом.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| contact_id | UUID FK → contacts | Ссылка на контакт |
| interaction_type | ENUM('call','email','meeting','note') | Тип |
| summary | TEXT NOT NULL | Описание |
| interaction_date | TIMESTAMPTZ DEFAULT now() | Дата |
| created_by | UUID FK → profiles | Кто создал |

### Таблица: `contact_bank_accounts`
Банковские реквизиты контакта (для выставления счетов и платежей).

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| contact_id | UUID FK → contacts | Ссылка на контакт |
| bank_name | VARCHAR(100) | Название банка |
| account_number | VARCHAR(50) | Номер счёта |
| routing_number | VARCHAR(20) | Routing number (US) |
| swift | VARCHAR(11) | SWIFT/BIC (для международных) |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта счёта |
| is_primary | BOOLEAN DEFAULT false | Основной счёт |
| created_at | TIMESTAMPTZ DEFAULT now() | Дата создания |

## 3.3 Функция автообогащения (Partner Autocomplete)

### Workflow

1. Пользователь создаёт новый контакт и вводит **MC#**, **DOT#** или **название компании**
2. Система вызывает Supabase Edge Function, которая:
   - Если введён MC#/DOT# → запрос к **FMCSA SAFER Web Services API**
   - Если введено название → запрос к **OpenCorporates API** + **Google Places API**
3. Результаты возвращаются в модальное окно:
   - Найденные данные отображаются с предпросмотром
   - Кнопка **«Применить»** заполняет форму найденными данными
   - Пользователь может отредактировать перед сохранением
4. Поле `enriched_at` + `enrichment_source` обновляются

### Данные из FMCSA SAFER

При вводе MC# или DOT# система находит:
- Legal Name, DBA Name
- Physical Address, Mailing Address
- Telephone
- USDOT Status, Authority Status (Common/Contract/Broker)
- Fleet Size (Power Units + Drivers)
- Insurance on file (liability amount, cargo amount, insurer name)
- Operation Classification (authorized for hire, private, etc.)
- Cargo Carried types

### Кнопка «🔄 Обновить данные»

На карточке контакта — кнопка для повторного обогащения. Полезно для проверки актуальности authority status и страховки перед началом работы с перевозчиком.

## 3.4 UI/UX Спецификация

### Список контактов

**KPI-карточки (верх страницы):**
- Total Contacts (всего)
- Customers (зелёный) — заказчики
- Carriers (синий) — перевозчики
- Inactive (серый) — деактивированные
- Authority Issues (красный) — перевозчики с неактивным USDOT/authority

**Два режима просмотра:**

**Cards view:**
- Логотип/аватар (инициалы, цвет по типу: customers=зелёный, carriers=синий)
- Company name, contact person name
- Телефон, email
- MC# / DOT# (для перевозчиков)
- Tags badges
- Rating (звёзды)
- Статус authority (зелёный бейдж «Active» / красный «Inactive»)

**Table view:**
- Display Name, Type badge, Phone, Email, City/State, MC#, DOT#, Authority Status, Fleet Size, Rating, Created

### Карточка контакта (детальный вид)

**Header:**
- Логотип/аватар, display name, company type badge, rating stars
- Быстрые действия: Call, Email, New Deal, New Invoice

**Tabs:**
- **Overview** — основная информация, адрес, реквизиты, FMCSA данные, страховка
- **Contacts** — связанные контактные лица (parent_id = this contact)
- **Deals** — сделки из CRM Pipeline связанные с этим контактом
- **Invoices** — счета из Cash Flow
- **Interactions** — лог звонков, писем, встреч
- **Bank Accounts** — банковские реквизиты
- **Documents** — загруженные документы (W-9, договоры, сертификаты)

### Модальное окно создания

Двухколоночный layout:
- **Левая колонка**: Company/Person toggle, Company Name (с автокомплитом), Contact Person, Job Title, Phone, Email
- **Правая колонка**: Address fields, Tax ID, MC#, DOT#, Payment Terms, Currency
- **Внизу**: кнопка «🔍 Найти в открытых данных» → запускает обогащение → заполняет форму
- Tags, Rating, Notes

## 3.5 Права доступа

| Действие | Admin | Director | Dispatcher | Viewer |
|----------|-------|----------|------------|--------|
| Просмотр контактов | ✅ | ✅ | ✅ | ✅ |
| Создание контактов | ✅ | ✅ | ✅ | ❌ |
| Редактирование | ✅ | ✅ | ✅ (свои) | ❌ |
| Удаление/деактивация | ✅ | ❌ | ❌ | ❌ |
| Обогащение данных | ✅ | ✅ | ✅ | ❌ |
| Банковские реквизиты | ✅ | ✅ | ❌ | ❌ |
| Экспорт | ✅ | ✅ | ❌ | ❌ |

## 3.6 Интеграция

- **CRM Pipeline** → deals.contact_id и deals.carrier_id ссылаются на contacts
- **Cash Flow** → invoices.contact_id, bills.contact_id ссылаются на contacts
- **Repairs** → repairs.vendor_id может ссылаться на contacts (тип=other, для мастерских)
- **Dashboard** → алерт «Authority Issues» если перевозчик с неактивным статусом

---

# 4. МОДУЛЬ: CASH FLOW (Денежный поток)

## 4.1 Бизнес-обоснование

Центральный финансовый модуль для логистической компании. Отслеживает: кому и сколько должны заплатить, кто и сколько должен компании, текущий баланс, выставление счетов. Вдохновлён Odoo Accounting/Invoicing с упрощением для логистики.

**Ключевые задачи:**
- Выставление инвойсов заказчикам (Accounts Receivable)
- Учёт счетов от поставщиков/перевозчиков (Accounts Payable)
- Регистрация платежей (входящих и исходящих)
- Показ текущего баланса, дебиторской и кредиторской задолженности
- Мультивалютность (USD основная + UZS, RUB, EUR для расчётов с Узбекистаном)
- P&L отчёт за период

## 4.2 Структура данных

### Таблица: `currencies`
Справочник валют с актуальными курсами.

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| code | VARCHAR(3) UNIQUE NOT NULL | ISO код (USD, UZS, RUB, EUR) |
| name | VARCHAR(50) NOT NULL | Полное название |
| symbol | VARCHAR(5) NOT NULL | Символ ($, сўм, ₽, €) |
| rate_to_usd | DECIMAL(15,6) NOT NULL | Курс к USD (USD = 1.000000) |
| is_active | BOOLEAN DEFAULT true | Активна ли валюта |
| auto_update | BOOLEAN DEFAULT true | Автообновление курса |
| rate_updated_at | TIMESTAMPTZ | Когда курс обновлялся |

### Таблица: `invoices`
Исходящие счета заказчикам (Accounts Receivable).

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| invoice_number | VARCHAR(20) UNIQUE NOT NULL | Автоинкремент: INV-0001 |
| invoice_type | ENUM('invoice','credit_note') DEFAULT 'invoice' | Тип: счёт или кредит-нота |
| contact_id | UUID FK → contacts NOT NULL | Заказчик |
| deal_id | UUID FK → deals NULLABLE | Связанная сделка из CRM |
| — **Суммы** | | |
| subtotal | DECIMAL(12,2) NOT NULL | Сумма до налогов |
| tax_amount | DECIMAL(12,2) DEFAULT 0 | Налог |
| total | DECIMAL(12,2) NOT NULL | Итого |
| amount_paid | DECIMAL(12,2) DEFAULT 0 | Уже оплачено |
| amount_due | DECIMAL(12,2) COMPUTED | total - amount_paid |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта счёта |
| exchange_rate | DECIMAL(15,6) DEFAULT 1.0 | Курс к USD на момент создания |
| total_usd | DECIMAL(12,2) COMPUTED | total / exchange_rate — сумма в USD |
| — **Даты** | | |
| issue_date | DATE NOT NULL DEFAULT CURRENT_DATE | Дата выставления |
| due_date | DATE NOT NULL | Срок оплаты |
| paid_date | DATE | Дата полной оплаты |
| — **Статус** | | |
| status | ENUM('draft','sent','partial','paid','overdue','cancelled') DEFAULT 'draft' | Статус |
| — **Контент** | | |
| lines | JSONB NOT NULL | Позиции счёта: `[{"description": "Freight Chicago→LA", "quantity": 1, "unit_price": 3500.00, "amount": 3500.00}]` |
| notes | TEXT | Примечания |
| document_url | TEXT | Ссылка на PDF/файл |
| — **Мета** | | |
| sent_at | TIMESTAMPTZ | Когда отправлен |
| created_by | UUID FK → profiles | Кто создал |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

### Таблица: `bills`
Входящие счета от поставщиков/перевозчиков (Accounts Payable).

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| bill_number | VARCHAR(20) UNIQUE NOT NULL | Автоинкремент: BILL-0001 |
| vendor_ref | VARCHAR(50) | Номер счёта поставщика |
| contact_id | UUID FK → contacts NOT NULL | Поставщик/перевозчик |
| category | ENUM('freight','fuel','repair','insurance','lease','toll','permit','salary','office','other') NOT NULL | Категория расхода |
| deal_id | UUID FK → deals NULLABLE | Связанная сделка |
| unit_id | UUID FK → units NULLABLE | Связанный юнит |
| — **Суммы** | | |
| subtotal | DECIMAL(12,2) NOT NULL | Сумма до налогов |
| tax_amount | DECIMAL(12,2) DEFAULT 0 | Налог |
| total | DECIMAL(12,2) NOT NULL | Итого |
| amount_paid | DECIMAL(12,2) DEFAULT 0 | Уже оплачено |
| amount_due | DECIMAL(12,2) COMPUTED | total - amount_paid |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта |
| exchange_rate | DECIMAL(15,6) DEFAULT 1.0 | Курс к USD |
| total_usd | DECIMAL(12,2) COMPUTED | total / exchange_rate |
| — **Даты** | | |
| bill_date | DATE NOT NULL | Дата счёта |
| due_date | DATE NOT NULL | Срок оплаты |
| paid_date | DATE | Дата полной оплаты |
| — **Статус** | | |
| status | ENUM('draft','pending','partial','paid','overdue','cancelled') DEFAULT 'draft' | Статус |
| — **Контент** | | |
| lines | JSONB NOT NULL | Позиции: `[{"description": "...", "quantity": 1, "unit_price": 500, "amount": 500}]` |
| notes | TEXT | |
| document_url | TEXT | Загруженный файл счёта |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ DEFAULT now() | |

### Таблица: `payments`
Все платежи (входящие от заказчиков и исходящие поставщикам).

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| payment_number | VARCHAR(20) UNIQUE NOT NULL | Автоинкремент: PAY-0001 |
| payment_type | ENUM('incoming','outgoing') NOT NULL | Входящий (от клиента) или исходящий (поставщику) |
| payment_method | ENUM('bank_transfer','check','cash','card','wire','zelle','other') | Метод оплаты |
| contact_id | UUID FK → contacts NOT NULL | Кто заплатил / кому заплатили |
| invoice_id | UUID FK → invoices NULLABLE | Привязка к исходящему счёту |
| bill_id | UUID FK → bills NULLABLE | Привязка к входящему счёту |
| amount | DECIMAL(12,2) NOT NULL | Сумма платежа |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта платежа |
| exchange_rate | DECIMAL(15,6) DEFAULT 1.0 | Курс к USD на момент платежа |
| amount_usd | DECIMAL(12,2) COMPUTED | amount / exchange_rate |
| payment_date | DATE NOT NULL | Дата платежа |
| memo | VARCHAR(200) | Назначение платежа |
| document_url | TEXT | Подтверждение (скан чека, выписка) |
| status | ENUM('draft','confirmed','reconciled','cancelled') DEFAULT 'draft' | Статус |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### Таблица: `accounts`
Счета компании (банковские счета, касса).

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | Название счёта (например: «Chase Business Checking», «Касса USD») |
| account_type | ENUM('bank','cash','other') DEFAULT 'bank' | Тип |
| bank_name | VARCHAR(100) | Название банка |
| account_number | VARCHAR(50) | Номер счёта |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта счёта |
| current_balance | DECIMAL(14,2) DEFAULT 0 | Текущий баланс (обновляется при подтверждении платежей) |
| is_active | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

## 4.3 Мультивалютная логика

### Принцип работы (аналогично Odoo)

1. **Основная валюта компании** — USD (все итоговые отчёты в USD)
2. **Поддерживаемые валюты**: USD, UZS, RUB, EUR (расширяется)
3. **При создании счёта/платежа в иностранной валюте:**
   - Пользователь выбирает валюту
   - Система подставляет текущий курс (из `currencies.rate_to_usd`)
   - Вычисляет `total_usd` = total × rate_to_usd
4. **Курсовая разница:**
   - Если платёж в другой валюте чем счёт → конвертация по курсу на дату платежа
   - Если курс изменился между датой выставления и оплатой → фиксируется exchange gain/loss
5. **Автообновление курсов**: Supabase Edge Function вызывает API (exchangerate.host) ежедневно и обновляет `currencies.rate_to_usd`

### UI мультивалюты

- В любой денежной форме — dropdown выбора валюты рядом с суммой
- При выборе не-USD валюты появляется строка: «≈ $X,XXX.XX по курсу Y.ZZZZ»
- В таблицах и отчётах — показ в оригинальной валюте + USD эквивалент серым
- Настройка «Отображать суммы в» (USD / оригинальная валюта) в preferences

## 4.4 UI/UX Спецификация

### Dashboard Cash Flow (основная страница модуля)

**KPI-карточки (верх):**
- **Cash Balance** (зелёный): сумма текущих балансов всех accounts в USD
- **Accounts Receivable** (синий): сумма amount_due по всем неоплаченным invoices
- **Accounts Payable** (оранжевый): сумма amount_due по всем неоплаченным bills
- **Overdue Receivable** (красный): AR где due_date < today
- **Overdue Payable** (красный пульс): AP где due_date < today
- **Net Cash Flow** (текущий месяц): incoming payments - outgoing payments

**Графики:**
- **Cash Flow Timeline** (Recharts Area): по месяцам — income vs expenses, линия net
- **Expense Breakdown** (Pie chart): расходы по категориям (fuel, repair, insurance...)
- **Receivable Aging** (Bar chart): 0–30 дней, 31–60, 61–90, 90+ — сколько денег «зависло»

### Страница Invoices (исходящие счета)

**Table view:**
- Invoice #, Customer, Issue Date, Due Date, Total, Paid, Due, Status badge, Actions
- Статус бейджи: Draft (серый), Sent (синий), Partial (жёлтый), Paid (зелёный), Overdue (красный, пульс), Cancelled (зачёркнутый)
- Фильтры: по статусу, по клиенту, по дате, по валюте
- Сортировка по Due Date (ближайшие сверху для unpaid)
- **Total summary bar** сверху: Total Invoiced, Total Paid, Total Outstanding

**Создание Invoice:**
Модальное окно или полностраничная форма:
- Customer (поиск из Contacts)
- Deal (опционально — подтягивает данные из CRM)
- Currency + exchange rate
- **Line items** (динамическая таблица):
  - Description | Qty | Unit Price | Amount
  - Кнопка «+ Add Line»
  - Auto-sum
- Tax (% или фикс)
- Due Date (auto-calculated: issue_date + contact.payment_terms)
- Notes
- Кнопки: Save Draft / Send (меняет status на 'sent')

### Страница Bills (входящие счета)

Аналогичная структура, но для расходов:
- Bill #, Vendor, Vendor Ref, Category badge, Bill Date, Due Date, Total, Paid, Due, Status
- Category badges цветные: fuel=жёлтый, repair=оранжевый, insurance=синий, toll=серый...
- Создание bill: vendor, category, unit (опционально), line items, document upload

### Страница Payments

- Payment #, Type (in/out), Contact, Amount, Currency, Date, Method, Linked Invoice/Bill, Status
- **Incoming** (зелёная стрелка вверх) и **Outgoing** (красная стрелка вниз)
- Быстрая регистрация платежа: из invoice/bill клик «Register Payment» → модалка с amount, method, date

### Страница Accounts

- Карточки банковских счетов: название, банк, номер, валюта, **текущий баланс (крупно)**
- Mini-chart истории баланса за последние 30 дней
- Кнопка «Adjust Balance» для ручной коррекции

### Отчёт P&L (Profit & Loss)

- Период: выбор месяца/квартала/года
- **Revenue**: сумма оплаченных invoices за период (по категориям если есть)
- **Expenses**: сумма оплаченных bills за период (по категориям)
- **Net Profit**: Revenue - Expenses
- Таблица построчно по категориям
- Сравнение с предыдущим периодом (↑↓ %)

## 4.5 Автоматическая логика

### Статусы invoices/bills (автообновление)

```
draft → (пользователь отправляет) → sent/pending
sent/pending → (частичная оплата) → partial
sent/pending → (полная оплата) → paid
sent/pending → (due_date < today) → overdue
partial → (полная оплата) → paid
partial → (due_date < today) → overdue (если amount_due > 0)
любой → (пользователь отменяет) → cancelled
```

- **Scheduled function** (Supabase cron) ежедневно проверяет: все invoices/bills со status IN ('sent','pending','partial') WHERE due_date < today → status = 'overdue'
- При регистрации payment привязанного к invoice: `invoice.amount_paid += payment.amount` → пересчёт amount_due → смена status

### Связь с существующими модулями

- **Repairs**: при создании repair можно автоматически создать bill (expense, category=repair)
- **Fuel entries**: при создании fuel entry → автоматически bill (category=fuel)
- **Insurance**: страховой платёж → bill (category=insurance)

## 4.6 Права доступа

| Действие | Admin | Director | Dispatcher | Viewer |
|----------|-------|----------|------------|--------|
| Просмотр Cash Flow dashboard | ✅ | ✅ | ❌ | ❌ |
| Просмотр Invoices/Bills | ✅ | ✅ | ✅ | ✅ |
| Создание Invoice | ✅ | ✅ | ❌ | ❌ |
| Создание Bill | ✅ | ✅ | ✅ | ❌ |
| Регистрация Payment | ✅ | ✅ | ❌ | ❌ |
| Отмена Invoice/Bill | ✅ | ❌ | ❌ | ❌ |
| Управление Accounts | ✅ | ❌ | ❌ | ❌ |
| P&L отчёт | ✅ | ✅ | ❌ | ❌ |
| Экспорт | ✅ | ✅ | ❌ | ❌ |

---

# 5. SQL Schema Reference

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE company_type AS ENUM ('customer', 'carrier', 'both', 'other');
CREATE TYPE contact_entity_type AS ENUM ('company', 'person');
CREATE TYPE deal_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note');
CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'note');
CREATE TYPE invoice_type AS ENUM ('invoice', 'credit_note');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE bill_status AS ENUM ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE bill_category AS ENUM ('freight', 'fuel', 'repair', 'insurance', 'lease', 'toll', 'permit', 'salary', 'office', 'other');
CREATE TYPE payment_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'check', 'cash', 'card', 'wire', 'zelle', 'other');
CREATE TYPE payment_status AS ENUM ('draft', 'confirmed', 'reconciled', 'cancelled');
CREATE TYPE account_type AS ENUM ('bank', 'cash', 'other');

-- ============================================
-- CONTACTS MODULE
-- ============================================

CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_type contact_entity_type NOT NULL,
  company_type company_type DEFAULT 'customer',
  company_name VARCHAR(200),
  display_name VARCHAR(200) NOT NULL,
  full_name VARCHAR(100),
  job_title VARCHAR(100),
  parent_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  street VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',
  tax_id VARCHAR(20),
  mc_number VARCHAR(20),
  dot_number VARCHAR(20),
  usdot_status VARCHAR(20),
  authority_status VARCHAR(50),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  fleet_size INTEGER,
  driver_count INTEGER,
  insurance_info JSONB DEFAULT '{}',
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  enriched_at TIMESTAMPTZ,
  enrichment_source VARCHAR(50),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_company_type ON contacts(company_type);
CREATE INDEX idx_contacts_display_name ON contacts(display_name);
CREATE INDEX idx_contacts_mc_number ON contacts(mc_number);
CREATE INDEX idx_contacts_dot_number ON contacts(dot_number);
CREATE INDEX idx_contacts_parent_id ON contacts(parent_id);

CREATE TABLE contact_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  interaction_type interaction_type NOT NULL,
  summary TEXT NOT NULL,
  interaction_date TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE contact_bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  routing_number VARCHAR(20),
  swift VARCHAR(11),
  currency VARCHAR(3) DEFAULT 'USD',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CRM PIPELINE MODULE
-- ============================================

CREATE TABLE pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  is_folded BOOLEAN DEFAULT false,
  rot_days INTEGER DEFAULT 0,
  auto_action JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  carrier_id UUID REFERENCES contacts(id),
  stage_id UUID REFERENCES pipeline_stages(id) NOT NULL,
  amount DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  priority deal_priority DEFAULT 'medium',
  pickup_location TEXT,
  delivery_location TEXT,
  pickup_date DATE,
  delivery_date DATE,
  unit_id UUID REFERENCES units(id),
  driver_id UUID REFERENCES drivers(id),
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  expected_close_date DATE,
  probability INTEGER DEFAULT 50,
  lost_reason TEXT,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX idx_deals_created_at ON deals(created_at);

CREATE TABLE deal_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  summary VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  is_done BOOLEAN DEFAULT false,
  done_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id) NOT NULL,
  moved_by UUID REFERENCES profiles(id),
  moved_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CASH FLOW MODULE
-- ============================================

CREATE TABLE currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  rate_to_usd DECIMAL(15,6) NOT NULL DEFAULT 1.000000,
  is_active BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT true,
  rate_updated_at TIMESTAMPTZ
);

-- Seed default currencies
INSERT INTO currencies (code, name, symbol, rate_to_usd) VALUES
  ('USD', 'US Dollar', '$', 1.000000),
  ('UZS', 'Uzbek Sum', 'сўм', 0.000078),
  ('RUB', 'Russian Ruble', '₽', 0.011000),
  ('EUR', 'Euro', '€', 1.080000);

CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  account_type account_type DEFAULT 'bank',
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'USD',
  current_balance DECIMAL(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  invoice_type invoice_type DEFAULT 'invoice',
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  deal_id UUID REFERENCES deals(id),
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  total_usd DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE WHEN exchange_rate > 0 THEN total / exchange_rate ELSE total END
  ) STORED,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  status invoice_status DEFAULT 'draft',
  lines JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  document_url TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE TABLE bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_number VARCHAR(20) UNIQUE NOT NULL,
  vendor_ref VARCHAR(50),
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  category bill_category NOT NULL,
  deal_id UUID REFERENCES deals(id),
  unit_id UUID REFERENCES units(id),
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  total_usd DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE WHEN exchange_rate > 0 THEN total / exchange_rate ELSE total END
  ) STORED,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status bill_status DEFAULT 'draft',
  lines JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  document_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bills_contact_id ON bills(contact_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_category ON bills(category);
CREATE INDEX idx_bills_due_date ON bills(due_date);

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_number VARCHAR(20) UNIQUE NOT NULL,
  payment_type payment_direction NOT NULL,
  payment_method payment_method,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  account_id UUID REFERENCES accounts(id),
  invoice_id UUID REFERENCES invoices(id),
  bill_id UUID REFERENCES bills(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate DECIMAL(15,6) DEFAULT 1.000000,
  amount_usd DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE WHEN exchange_rate > 0 THEN amount / exchange_rate ELSE amount END
  ) STORED,
  payment_date DATE NOT NULL,
  memo VARCHAR(200),
  document_url TEXT,
  status payment_status DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_contact_id ON payments(contact_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_bill_id ON payments(bill_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- ============================================
-- AUTO-INCREMENT FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION generate_deal_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deal_number := 'ORD-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(deal_number FROM 5) AS INTEGER)), 0) + 1
     FROM deals)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_number
  BEFORE INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION generate_deal_number();

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
     FROM invoices)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bill_number := 'BILL-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 6) AS INTEGER)), 0) + 1
     FROM bills)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bill_number
  BEFORE INSERT ON bills
  FOR EACH ROW EXECUTE FUNCTION generate_bill_number();

CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_number := 'PAY-' || LPAD(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER)), 0) + 1
     FROM payments)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_number
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_payment_number();

-- ============================================
-- PAYMENT → INVOICE/BILL UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND NEW.invoice_id IS NOT NULL THEN
    UPDATE invoices
    SET amount_paid = amount_paid + NEW.amount,
        status = CASE
          WHEN amount_paid + NEW.amount >= total THEN 'paid'
          WHEN amount_paid + NEW.amount > 0 THEN 'partial'
          ELSE status
        END,
        paid_date = CASE
          WHEN amount_paid + NEW.amount >= total THEN NEW.payment_date
          ELSE paid_date
        END,
        updated_at = now()
    WHERE id = NEW.invoice_id;
  END IF;

  IF NEW.status = 'confirmed' AND NEW.bill_id IS NOT NULL THEN
    UPDATE bills
    SET amount_paid = amount_paid + NEW.amount,
        status = CASE
          WHEN amount_paid + NEW.amount >= total THEN 'paid'
          WHEN amount_paid + NEW.amount > 0 THEN 'partial'
          ELSE status
        END,
        paid_date = CASE
          WHEN amount_paid + NEW.amount >= total THEN NEW.payment_date
          ELSE paid_date
        END,
        updated_at = now()
    WHERE id = NEW.bill_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_update_docs
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_on_payment();

-- ============================================
-- OVERDUE STATUS CRON (run daily via Supabase)
-- ============================================

CREATE OR REPLACE FUNCTION mark_overdue_documents()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('sent', 'partial')
    AND due_date < CURRENT_DATE
    AND amount_due > 0;

  UPDATE bills
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE
    AND amount_due > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES (примеры)
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read contacts
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin, Director, Dispatcher can insert contacts
CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director', 'dispatcher'))
  );

-- Only admin can delete contacts
CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin')
  );

-- Cash Flow: only admin and director can view financial data
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director'))
  );

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director'))
  );
```

---

# 6. Изменения в существующих модулях

### Dashboard — новые KPI и алерты
- **Active Deals**: количество сделок в pipeline (не в won/lost стадиях)
- **Overdue Invoices**: количество и сумма просроченных invoices
- **Overdue Bills**: количество и сумма просроченных bills
- **Cash Balance**: текущий баланс по всем accounts

### Sidebar Navigation — новые пункты
```
📊 Dashboard
🚛 Units
⚙️ Oil & Fluids
🔍 DOT Inspection
📋 Registration
🔧 Repairs
⚠️ Defects
👥 Drivers
--- (разделитель) ---
📈 CRM Pipeline     ← NEW
👤 Contacts          ← NEW
💰 Cash Flow         ← NEW
  ├─ Overview
  ├─ Invoices
  ├─ Bills
  ├─ Payments
  └─ Accounts
--- (разделитель) ---
📝 Audit Log
⚙️ Settings
```

---

# 7. Фазы разработки

### Фаза 1: Contacts (2–3 недели)
- Таблицы contacts, contact_interactions, contact_bank_accounts
- CRUD UI: cards + table view, создание/редактирование
- Поиск и фильтры
- Базовое обогащение через FMCSA SAFER API (Edge Function)
- RLS policies

### Фаза 2: CRM Pipeline (3–4 недели)
- Таблицы pipeline_stages, deals, deal_activities, deal_stage_history
- Kanban board с drag & drop (библиотека: @dnd-kit/core)
- CRUD стадий и сделок
- Детальный вид сделки (slide panel)
- KPI и фильтры
- Интеграция с Contacts (contact_id, carrier_id)

### Фаза 3: Cash Flow (3–4 недели)
- Таблицы currencies, accounts, invoices, bills, payments
- Мультивалютная логика + автообновление курсов
- Invoice CRUD + status workflow
- Bill CRUD + status workflow
- Payment registration + auto-update invoice/bill
- Cash Flow dashboard с графиками
- P&L отчёт
- Cron для overdue статусов

### Фаза 4: Интеграция и polish (1–2 недели)
- Связи между модулями (deal → invoice, repair → bill)
- Dashboard KPI обновление
- Sidebar обновление
- Audit log для новых таблиц
- Тестирование и fix

**Общий срок: 9–13 недель**

---

*Документ подготовлен на основе анализа Odoo CRM, Odoo Contacts (Partner Autocomplete), Odoo Accounting/Invoicing с адаптацией под стек FleetOps (React + Supabase) и специфику логистической компании.*
