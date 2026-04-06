# FleetOps PRD v3.1: Доработка 3 бизнес-модулей

## Дополнения на основе анализа Odoo

**Версия:** 3.1 | **Дата:** 3 апреля 2026 | **Статус:** Enhanced

Данный документ содержит **только доработки и новые функции** к существующему PRD v3.0. Все базовые таблицы, UI и логика из v3.0 остаются без изменений. Здесь описано то, что добавляется сверху.

---

# 1. CRM PIPELINE — Доработки

## 1.1 Множественные Pipeline (Odoo Sales Teams)

В Odoo каждая Sales Team имеет свой набор стадий. В FleetOps реализуем аналог — **несколько независимых pipeline** для разных типов сделок.

### Новая таблица: `pipelines`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | Название pipeline: «Freight Orders», «Brokerage», «Reefer Loads» |
| description | TEXT | Описание назначения |
| team_lead_id | UUID FK → profiles NULLABLE | Ответственный руководитель |
| is_default | BOOLEAN DEFAULT false | Pipeline по умолчанию для новых сделок |
| is_active | BOOLEAN DEFAULT true | Активен ли |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### Изменения в `pipeline_stages`

| Новая колонка | Тип | Описание |
|---------------|-----|----------|
| pipeline_id | UUID FK → pipelines NOT NULL | К какому pipeline относится стадия |

### Изменения в `deals`

| Новая колонка | Тип | Описание |
|---------------|-----|----------|
| pipeline_id | UUID FK → pipelines NOT NULL | К какому pipeline относится сделка |

**UI:** Вверху страницы CRM — табы или dropdown для переключения между pipeline. Каждый pipeline показывает только свои стадии и сделки. Admin/Director могут создавать новые pipeline через Settings.

## 1.2 Автоматические действия при переходе между стадиями (Odoo Automation)

Odoo позволяет настраивать автоматические email, SMS и назначение задач при переходе сделки в стадию. Расширяем `auto_action` в `pipeline_stages`:

### Расширенная структура `auto_action` (JSONB)

```json
{
  "on_enter": {
    "send_email": {
      "enabled": true,
      "template_id": "uuid-шаблона",
      "to": "contact"
    },
    "create_activity": {
      "enabled": true,
      "type": "call",
      "summary": "Подтвердить загрузку",
      "due_days": 1,
      "assign_to": "deal_owner"
    },
    "change_deal_field": {
      "probability": 75
    },
    "notify_user": {
      "enabled": true,
      "user_ids": ["uuid1", "uuid2"],
      "message": "Сделка {deal_number} перешла в стадию {stage_name}"
    }
  },
  "on_exit": {
    "require_fields": ["unit_id", "driver_id"],
    "require_note": true
  }
}
```

**`on_enter`** — что происходит когда карточка попадает в стадию:
- `send_email` — автоматическая отправка email клиенту по шаблону
- `create_activity` — автосоздание задачи/звонка/встречи с назначением ответственному
- `change_deal_field` — автоматическое изменение полей (probability, priority)
- `notify_user` — in-app уведомление конкретным пользователям

**`on_exit`** — условия для выхода из стадии (drag & drop заблокирован если не выполнены):
- `require_fields` — обязательные поля которые должны быть заполнены (нельзя двинуть сделку в «В доставке» без назначенного unit и driver)
- `require_note` — обязательный комментарий при перемещении

**UI:** В настройках стадии (⚙️ → Edit) — вкладка «Automation» с визуальным конструктором правил.

## 1.3 Запланированные активности с системой напоминаний (Odoo Activity Planner)

Odoo на каждой сделке показывает «следующий шаг» и подсвечивает просроченные. Усиливаем.

### Изменения в `deal_activities`

| Новая колонка | Тип | Описание |
|---------------|-----|----------|
| reminder_type | ENUM('none','15min','1hour','1day','3days') DEFAULT 'none' | Когда напомнить |
| reminder_sent | BOOLEAN DEFAULT false | Отправлено ли напоминание |
| is_overdue | BOOLEAN COMPUTED | due_date < CURRENT_DATE AND is_done = false |

### Иконка активности на карточке сделки

На каждой карточке в Kanban — маленькая иконка состояния активности:
- 🟢 Зелёный часы — есть запланированные активности, срок не истёк
- 🔴 Красный часы (пульсирует) — есть просроченные активности
- ⚫ Серый часы — нет запланированных активностей

## 1.4 Прогнозирование выручки (Odoo Revenue Forecast)

### Новый KPI-блок: Expected Revenue

- **Weighted Pipeline** = Σ(deal.amount × deal.probability / 100) по всем активным сделкам
- **Expected This Month** = weighted sum только для сделок с expected_close_date в текущем месяце
- **Expected Next Month** = то же для следующего месяца

**UI:** График «Revenue Forecast» — Bar chart по месяцам, два бара: Expected (голубой, weighted) и Won (зелёный, фактически закрытые is_won).

## 1.5 Причины потери и аналитика (Odoo Lost Reasons)

### Новая таблица: `lost_reasons`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | «Цена слишком высокая», «Выбрали другого перевозчика», «Отмена заказа» |
| is_active | BOOLEAN DEFAULT true | |

### Изменения в `deals`

| Новая колонка | Тип | Описание |
|---------------|-----|----------|
| lost_reason_id | UUID FK → lost_reasons NULLABLE | Ссылка на структурированную причину |

**UI:** При перетаскивании сделки в is_lost стадию — модальное окно:
- Dropdown с причинами потери (из lost_reasons)
- Текстовое поле для комментария
- Кнопки «Mark as Lost» / «Cancel»

**Аналитика:** Pie chart «Lost Reasons» — показывает распределение причин потери за период. Помогает директору понять, почему теряются сделки.

## 1.6 Шаблоны email (Odoo Email Templates)

### Новая таблица: `email_templates`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | «Rate Confirmation», «Delivery Update», «Invoice Reminder» |
| subject | VARCHAR(200) NOT NULL | Тема письма с переменными: «Order {deal_number} — Rate Confirmation» |
| body_html | TEXT NOT NULL | HTML тело с переменными: {contact_name}, {deal_number}, {amount}, {pickup_date}... |
| module | ENUM('crm','cashflow','general') | К какому модулю относится |
| is_active | BOOLEAN DEFAULT true | |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Переменные-плейсхолдеры:** `{contact_name}`, `{company_name}`, `{deal_number}`, `{deal_title}`, `{amount}`, `{currency}`, `{pickup_location}`, `{delivery_location}`, `{pickup_date}`, `{delivery_date}`, `{unit_number}`, `{driver_name}`, `{invoice_number}`, `{due_date}`.

**UI:** Settings → Email Templates — WYSIWYG редактор с подстановкой переменных. При отправке из сделки или invoice — выбор шаблона из dropdown.

---

# 2. CONTACTS — Доработки

## 2.1 Chatter / Лента активности (Odoo Chatter)

В Odoo каждая запись имеет Chatter — лента сообщений, заметок и системных логов. Это одна из самых мощных концепций Odoo. Реализуем для контактов.

### Новая таблица: `chatter_messages`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| entity_type | VARCHAR(50) NOT NULL | 'contact', 'deal', 'invoice', 'bill' — к чему привязано |
| entity_id | UUID NOT NULL | ID записи |
| message_type | ENUM('comment','note','system','email_in','email_out') | Тип сообщения |
| body | TEXT NOT NULL | Текст сообщения (поддержка Markdown) |
| author_id | UUID FK → profiles NULLABLE | Автор (null для системных) |
| attachments | JSONB DEFAULT '[]' | Массив файлов: `[{"name": "W-9.pdf", "url": "...", "size": 12345}]` |
| is_internal | BOOLEAN DEFAULT false | Внутренняя заметка (не видна клиенту если будет портал) |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Чем это лучше отдельных `contact_interactions`:**
- Единая таблица для ВСЕХ сущностей (контакты, сделки, invoices, bills)
- Автоматические системные сообщения: «Статус изменён с Active на Inactive», «Данные обогащены из FMCSA»
- Прикрепление файлов к сообщениям
- Видно всю историю взаимодействия в одном месте

**UI:** Внизу каждой карточки контакта (и сделки, и invoice) — лента сообщений:
- Текстовое поле для ввода + кнопка 📎 для файлов
- Toggle «Note» (внутренняя) / «Comment» (видимая)
- Системные сообщения выделены серым с иконкой ⚙️
- Фильтр: All / Comments / Notes / System

## 2.2 Подписчики и уведомления (Odoo Followers)

В Odoo на каждую запись можно «подписать» пользователей — они получают уведомления об изменениях.

### Новая таблица: `entity_followers`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| entity_type | VARCHAR(50) NOT NULL | 'contact', 'deal', 'invoice' |
| entity_id | UUID NOT NULL | ID записи |
| user_id | UUID FK → profiles NOT NULL | Подписчик |
| notify_on | JSONB DEFAULT '{"comment": true, "status_change": true, "assignment": true}' | На что уведомлять |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Логика:**
- Создатель записи автоматически подписывается
- Assigned_to автоматически подписывается
- Можно вручную добавить подписчиков (кнопка «+ Follow» / «+ Add Follower»)
- При новом комментарии / смене статуса — in-app уведомление + email (если включён)

**UI:** Рядом с chatter — маленький блок «Followers»: аватарки подписанных пользователей + кнопка «+».

## 2.3 Дублирование и слияние контактов (Odoo Merge)

### Функция обнаружения дубликатов

При создании нового контакта система проверяет:
1. Совпадение `mc_number` или `dot_number` (точное) — алерт «Контакт с MC# XXXXXX уже существует»
2. Совпадение `tax_id` (точное)
3. Fuzzy match по `company_name` (Levenshtein distance < 3 или ILIKE)
4. Совпадение `phone` или `email`

**UI при создании:**
- Жёлтый баннер: «Найден похожий контакт: [Company Name] (MC# XXXXXX)»
- Кнопки: «Открыть существующий» / «Создать всё равно» / «Объединить»

### Функция слияния (Merge)

Admin может выбрать 2+ контакта → Action «Merge Contacts»:
- Выбрать «главный» контакт (в который сливаем)
- Все сделки, invoices, bills, interactions второго контакта переносятся на главный
- Второй контакт деактивируется (soft delete)

## 2.4 Сегменты и умные списки (Odoo Filters)

### Новая таблица: `saved_filters`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | «VIP Customers», «Inactive Carriers», «Texas Carriers» |
| module | VARCHAR(50) NOT NULL | 'contacts', 'deals', 'invoices' |
| filter_config | JSONB NOT NULL | Конфигурация фильтра |
| is_shared | BOOLEAN DEFAULT false | Доступен всем или только создателю |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Пример `filter_config`:**

```json
{
  "conditions": [
    {"field": "company_type", "operator": "=", "value": "carrier"},
    {"field": "state", "operator": "in", "value": ["TX", "CA", "IL"]},
    {"field": "rating", "operator": ">=", "value": 4},
    {"field": "usdot_status", "operator": "=", "value": "active"}
  ],
  "logic": "AND"
}
```

**UI:** В списке контактов — dropdown «Saved Filters» рядом с поиском. Кнопка «Save Current Filter» сохраняет текущую комбинацию фильтров.

## 2.5 Документы контакта (Odoo Documents)

### Новая таблица: `contact_documents`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| contact_id | UUID FK → contacts | Ссылка на контакт |
| document_type | ENUM('w9','contract','rate_confirmation','insurance_certificate','authority_letter','carrier_packet','other') | Тип документа |
| name | VARCHAR(200) NOT NULL | Имя файла |
| file_url | TEXT NOT NULL | URL в Supabase Storage |
| file_size | INTEGER | Размер в байтах |
| expiry_date | DATE NULLABLE | Дата истечения (для insurance, authority) |
| notes | TEXT | |
| uploaded_by | UUID FK → profiles | |
| uploaded_at | TIMESTAMPTZ DEFAULT now() | |

**UI:** Таб «Documents» на карточке контакта:
- Сетка иконок документов с типом, именем, датой загрузки
- Цветовая индикация истечения: зелёный (>90d), жёлтый (30–90d), красный (<30d, истёк)
- Drag & drop загрузка файлов
- Предпросмотр PDF прямо в системе

**Алерты:** Документы с expiry_date → при <30 дней — алерт на Dashboard «Expiring Documents».

## 2.6 Расширенный поиск по US-реестрам

К существующему FMCSA SAFER обогащению добавляем:

### FMCSA SMS (Safety Measurement System)

По DOT# дополнительно получаем:
- **CSA Score** (Compliance, Safety, Accountability) — рейтинг безопасности перевозчика
- **Inspection Results** — процент прохождения инспекций
- **Crash Data** — количество аварий за последние 24 месяца
- **Out-of-Service Rate** — % случаев когда ТС или водитель были сняты с линии

### Новые колонки в `contacts`

| Колонка | Тип | Описание |
|---------|-----|----------|
| safety_rating | VARCHAR(20) | Satisfactory / Conditional / Unsatisfactory |
| csa_scores | JSONB DEFAULT '{}' | `{"unsafe_driving": 45, "crash_indicator": 22, "hos_compliance": 67, "vehicle_maintenance": 31, "driver_fitness": 15}` |
| oos_rate | DECIMAL(5,2) | Out-of-Service Rate в % |
| last_inspection_date | DATE | Дата последней DOT инспекции |
| operation_classification | TEXT[] | ['authorized_for_hire', 'private_property'] |
| cargo_carried | TEXT[] | ['general_freight', 'household_goods', 'refrigerated'] |

**UI:** На карточке carrier-контакта — блок «Safety Profile»:
- CSA Score визуализация (bar chart, цвет по уровню: <50 зелёный, 50–75 жёлтый, >75 красный)
- Safety Rating badge
- OOS Rate
- Кнопка «⚠️ Safety Alert» если есть проблемы

---

# 3. CASH FLOW — Доработки

## 3.1 Автоматические напоминания об оплате (Odoo Payment Follow-up)

Odoo автоматически рассылает серии напоминаний клиентам с просроченными счетами. Реализуем аналог.

### Новая таблица: `follow_up_levels`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| name | VARCHAR(100) NOT NULL | «Friendly Reminder», «Second Notice», «Final Warning» |
| days_overdue | INTEGER NOT NULL | Через сколько дней просрочки активировать (7, 14, 30, 60) |
| action | ENUM('email','note','both') | Отправить email / создать заметку / оба |
| email_template_id | UUID FK → email_templates NULLABLE | Шаблон письма |
| severity | ENUM('low','medium','high','critical') | Уровень серьёзности |
| position | INTEGER NOT NULL | Порядок в последовательности |
| is_active | BOOLEAN DEFAULT true | |

### Новая таблица: `follow_up_history`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| invoice_id | UUID FK → invoices | Какой счёт |
| level_id | UUID FK → follow_up_levels | Какой уровень напоминания |
| sent_at | TIMESTAMPTZ DEFAULT now() | Когда отправлено |
| sent_by | ENUM('auto','manual') | Автоматически или вручную |
| response_note | TEXT | Заметка о реакции клиента |

### Предустановленные уровни

| Уровень | Дней просрочки | Тон | Действие |
|---------|---------------|-----|----------|
| Friendly Reminder | 7 | Мягкий | Email: «Напоминаем о неоплаченном счёте INV-XXXX на сумму $X,XXX» |
| Second Notice | 14 | Деловой | Email + внутренняя заметка: «Счёт просрочен 14 дней» |
| Urgent Notice | 30 | Настойчивый | Email: «Требуется немедленная оплата. Возможна приостановка услуг» |
| Final Warning | 60 | Жёсткий | Email + заметка + алерт директору: «60 дней просрочки» |

**Логика:** Supabase cron ежедневно:
1. Выбирает все overdue invoices
2. Для каждого считает дни просрочки
3. Определяет текущий уровень follow-up
4. Если ещё не отправлено для этого уровня — отправляет email + создаёт запись в follow_up_history

**UI:** На странице Invoice — таб «Follow-up»:
- Таймлайн отправленных напоминаний
- Кнопка «Send Reminder Now» (ручная отправка)
- Поле для заметки о реакции клиента

## 3.2 Рекуррентные (повторяющиеся) счета (Odoo Subscriptions)

Для постоянных расходов (лизинг, страховка, подписки) — автоматическое создание bills.

### Новая таблица: `recurring_bills`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| contact_id | UUID FK → contacts NOT NULL | Поставщик |
| category | bill_category NOT NULL | Категория |
| description | VARCHAR(200) NOT NULL | «Monthly Truck Lease — Unit T-101» |
| amount | DECIMAL(12,2) NOT NULL | Сумма |
| currency | VARCHAR(3) DEFAULT 'USD' | Валюта |
| frequency | ENUM('weekly','monthly','quarterly','annual') NOT NULL | Частота |
| start_date | DATE NOT NULL | Начало |
| end_date | DATE NULLABLE | Конец (null = бессрочно) |
| next_bill_date | DATE NOT NULL | Дата следующего выставления |
| unit_id | UUID FK → units NULLABLE | Привязка к юниту |
| lines | JSONB NOT NULL | Позиции счёта |
| auto_confirm | BOOLEAN DEFAULT false | Автоматически подтверждать (status = pending вместо draft) |
| is_active | BOOLEAN DEFAULT true | |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Логика:** Supabase cron ежедневно:
1. Проверяет `recurring_bills` где `next_bill_date <= today` AND `is_active = true`
2. Создаёт bill из шаблона (со status 'draft' или 'pending')
3. Сдвигает `next_bill_date` по frequency

**UI:** Страница Cash Flow → подменю «Recurring»:
- Таблица шаблонов: описание, поставщик, сумма, частота, следующая дата
- Создание/редактирование через модалку
- Toggle active/inactive

## 3.3 Курсовые разницы (Odoo Exchange Difference)

### Новая таблица: `exchange_differences`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| payment_id | UUID FK → payments | Платёж вызвавший разницу |
| invoice_id | UUID FK → invoices NULLABLE | Связанный invoice |
| bill_id | UUID FK → bills NULLABLE | Связанный bill |
| invoice_rate | DECIMAL(15,6) | Курс на момент создания счёта |
| payment_rate | DECIMAL(15,6) | Курс на момент платежа |
| amount_difference_usd | DECIMAL(12,2) | Разница в USD (+ gain / - loss) |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**Логика:** При регистрации платежа к invoice/bill в иностранной валюте:
- Если `payment.exchange_rate != invoice.exchange_rate`:
  - Вычислить разницу: `(1/payment_rate - 1/invoice_rate) × amount_in_foreign_currency`
  - Создать запись в `exchange_differences`
  - Positive = exchange gain, Negative = exchange loss

**UI:** В отчёте P&L — отдельная строка «Exchange Gains/Losses» с суммой за период.

## 3.4 Расширенный P&L и новые отчёты

### Отчёт: Balance Sheet (Баланс)

| Раздел | Источник |
|--------|---------|
| **Assets** | |
| Cash & Bank | Σ accounts.current_balance |
| Accounts Receivable | Σ invoices.amount_due WHERE status != 'cancelled' |
| **Liabilities** | |
| Accounts Payable | Σ bills.amount_due WHERE status != 'cancelled' |
| **Equity** | |
| Retained Earnings | Assets - Liabilities (auto-calculated) |

### Отчёт: Cash Flow Statement (Движение денежных средств)

| Раздел | Формула |
|--------|---------|
| **Operating Activities** | |
| Cash from Customers | Σ payments(incoming) за период |
| Cash to Vendors | Σ payments(outgoing) за период |
| Net Operating | incoming - outgoing |
| **Начало периода** | Σ accounts.balance на начало |
| **Конец периода** | Σ accounts.balance на конец |

### Отчёт: Aging Report (Дебиторка/Кредиторка по срокам)

Таблица по контактам с колонками:

| Контакт | Current | 1–30 days | 31–60 days | 61–90 days | 90+ days | Total |
|---------|---------|-----------|------------|------------|----------|-------|
| ABC Logistics | $5,000 | $2,000 | $0 | $0 | $0 | $7,000 |
| XYZ Carrier | $0 | $0 | $3,500 | $1,200 | $0 | $4,700 |

**UI:** Отдельный таб «Reports» в Cash Flow с sub-tabs: P&L, Balance Sheet, Cash Flow, AR Aging, AP Aging.

## 3.5 Быстрые действия из Invoice/Bill (Odoo Smart Buttons)

На каждом Invoice — «Smart Buttons» сверху (аналог Odoo):

- **💰 Payments (2)** — количество связанных платежей, клик → список
- **📧 Sent (1)** — сколько раз отправлен, клик → история отправок
- **🔔 Follow-ups (3)** — количество напоминаний, клик → история
- **📋 Deal** — если связан с CRM сделкой, клик → переход к сделке
- **💬 Messages (5)** — количество сообщений в chatter

## 3.6 Пакетные платежи (Odoo Batch Payments)

### Новая таблица: `payment_batches`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| batch_number | VARCHAR(20) UNIQUE | BATCH-0001 |
| payment_type | payment_direction NOT NULL | incoming или outgoing |
| payment_method | payment_method | Метод для всех платежей в batch |
| total_amount | DECIMAL(14,2) COMPUTED | Сумма всех платежей |
| currency | VARCHAR(3) DEFAULT 'USD' | |
| payment_date | DATE NOT NULL | Дата пакетного платежа |
| status | ENUM('draft','confirmed','cancelled') DEFAULT 'draft' | |
| notes | TEXT | |
| created_by | UUID FK → profiles | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

### Новая колонка в `payments`

| Колонка | Тип | Описание |
|---------|-----|----------|
| batch_id | UUID FK → payment_batches NULLABLE | Принадлежность к пакету |

**Use case:** Директор выбирает 10 bills для оплаты → нажимает «Pay Selected» → создаётся batch payment с 10 записями payments. Одно действие вместо 10.

**UI:** На странице Bills — checkbox у каждой строки + кнопка «Pay Selected (N)» → модалка: payment_date, method, confirm → создаёт batch + N payments.

---

# 4. Сквозные доработки для всех модулей

## 4.1 Система уведомлений (Odoo Notifications)

### Новая таблица: `notifications`

| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID PK | Auto-generated |
| user_id | UUID FK → profiles NOT NULL | Получатель |
| title | VARCHAR(200) NOT NULL | Заголовок |
| body | TEXT | Текст уведомления |
| entity_type | VARCHAR(50) | 'deal', 'invoice', 'contact'... |
| entity_id | UUID NULLABLE | ID записи для перехода по клику |
| is_read | BOOLEAN DEFAULT false | Прочитано |
| source | ENUM('system','user','automation') | Источник |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**UI:** 🔔 Bell icon в header с badge-счётчиком непрочитанных. Dropdown с последними уведомлениями. Клик → переход к связанной записи.

**Триггеры уведомлений:**
- CRM: сделка протухла, просроченная активность, сделка назначена тебе
- Contacts: authority status changed, document expiring
- Cash Flow: новый платёж получен, invoice overdue, follow-up sent, batch payment confirmed
- Followers: новый комментарий в chatter на записи где ты подписан

## 4.2 Экспорт данных (Odoo Export)

Во всех таблицах (contacts, deals, invoices, bills, payments) — кнопка «Export»:
- Форматы: CSV, Excel (.xlsx)
- Выбор колонок для экспорта
- Применение текущих фильтров
- Доступ: Admin, Director

## 4.3 Глобальный поиск (Odoo Global Search)

В header — поле поиска с горячей клавишей `Cmd/Ctrl + K`:
- Ищет по: contacts (name, MC#, DOT#), deals (number, title), invoices (number), bills (number), units (unit_number)
- Результаты группированы по типу с иконками
- Клик → переход к записи

---

# 5. Обновлённый SQL (только новые таблицы)

```sql
-- ============================================
-- NEW ENUMS
-- ============================================

CREATE TYPE follow_up_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE follow_up_action AS ENUM ('email', 'note', 'both');
CREATE TYPE message_type AS ENUM ('comment', 'note', 'system', 'email_in', 'email_out');
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE reminder_type AS ENUM ('none', '15min', '1hour', '1day', '3days');
CREATE TYPE notification_source AS ENUM ('system', 'user', 'automation');

-- ============================================
-- MULTIPLE PIPELINES
-- ============================================

CREATE TABLE pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES profiles(id),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add pipeline_id to existing tables
ALTER TABLE pipeline_stages ADD COLUMN pipeline_id UUID REFERENCES pipelines(id);
ALTER TABLE deals ADD COLUMN pipeline_id UUID REFERENCES pipelines(id);

-- ============================================
-- LOST REASONS
-- ============================================

CREATE TABLE lost_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE deals ADD COLUMN lost_reason_id UUID REFERENCES lost_reasons(id);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL,
  module VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CHATTER (universal comments)
-- ============================================

CREATE TABLE chatter_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  message_type message_type NOT NULL DEFAULT 'comment',
  body TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chatter_entity ON chatter_messages(entity_type, entity_id);
CREATE INDEX idx_chatter_created ON chatter_messages(created_at DESC);

-- ============================================
-- FOLLOWERS
-- ============================================

CREATE TABLE entity_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  notify_on JSONB DEFAULT '{"comment": true, "status_change": true, "assignment": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id, user_id)
);

CREATE INDEX idx_followers_entity ON entity_followers(entity_type, entity_id);

-- ============================================
-- CONTACT DOCUMENTS
-- ============================================

CREATE TABLE contact_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  expiry_date DATE,
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contact_docs ON contact_documents(contact_id);

-- ============================================
-- SAVED FILTERS
-- ============================================

CREATE TABLE saved_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  filter_config JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTACTS — safety columns
-- ============================================

ALTER TABLE contacts ADD COLUMN safety_rating VARCHAR(20);
ALTER TABLE contacts ADD COLUMN csa_scores JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN oos_rate DECIMAL(5,2);
ALTER TABLE contacts ADD COLUMN last_inspection_date DATE;
ALTER TABLE contacts ADD COLUMN operation_classification TEXT[];
ALTER TABLE contacts ADD COLUMN cargo_carried TEXT[];

-- ============================================
-- FOLLOW-UP LEVELS
-- ============================================

CREATE TABLE follow_up_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  days_overdue INTEGER NOT NULL,
  action follow_up_action NOT NULL,
  email_template_id UUID REFERENCES email_templates(id),
  severity follow_up_severity NOT NULL,
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO follow_up_levels (name, days_overdue, action, severity, position) VALUES
  ('Friendly Reminder', 7, 'email', 'low', 1),
  ('Second Notice', 14, 'both', 'medium', 2),
  ('Urgent Notice', 30, 'both', 'high', 3),
  ('Final Warning', 60, 'both', 'critical', 4);

CREATE TABLE follow_up_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  level_id UUID REFERENCES follow_up_levels(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_by VARCHAR(10) DEFAULT 'auto',
  response_note TEXT
);

-- ============================================
-- RECURRING BILLS
-- ============================================

CREATE TABLE recurring_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) NOT NULL,
  category bill_category NOT NULL,
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  frequency recurring_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_bill_date DATE NOT NULL,
  unit_id UUID REFERENCES units(id),
  lines JSONB NOT NULL DEFAULT '[]',
  auto_confirm BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXCHANGE DIFFERENCES
-- ============================================

CREATE TABLE exchange_differences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  invoice_id UUID REFERENCES invoices(id),
  bill_id UUID REFERENCES bills(id),
  invoice_rate DECIMAL(15,6),
  payment_rate DECIMAL(15,6),
  amount_difference_usd DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAYMENT BATCHES
-- ============================================

CREATE TABLE payment_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number VARCHAR(20) UNIQUE NOT NULL,
  payment_type payment_direction NOT NULL,
  payment_method payment_method,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_date DATE NOT NULL,
  status payment_status DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ADD COLUMN batch_id UUID REFERENCES payment_batches(id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  entity_type VARCHAR(50),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  source notification_source DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- ACTIVITY REMINDERS
-- ============================================

ALTER TABLE deal_activities ADD COLUMN reminder_type reminder_type DEFAULT 'none';
ALTER TABLE deal_activities ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
```

---

# 6. Обновлённые фазы разработки

### Фаза 1: Contacts + Core Infrastructure (3 недели)
- Contacts базовый CRUD (из v3.0)
- Chatter (универсальный для всех модулей)
- Followers + Notifications
- Contact Documents
- FMCSA обогащение + Safety Profile
- Обнаружение дубликатов

### Фаза 2: CRM Pipeline (3–4 недели)
- Multiple Pipelines
- Kanban + drag-and-drop (из v3.0)
- Stage automation (on_enter / on_exit rules)
- Activities с напоминаниями
- Lost Reasons + аналитика
- Revenue Forecast
- Email Templates

### Фаза 3: Cash Flow (4 недели)
- Invoices, Bills, Payments базовый (из v3.0)
- Мультивалютность + Exchange Differences
- Follow-up Levels + автоматические напоминания
- Recurring Bills
- Batch Payments
- Расширенные отчёты: P&L, Balance Sheet, Cash Flow Statement, Aging

### Фаза 4: Polish + Cross-module (2 недели)
- Saved Filters для всех модулей
- Глобальный поиск
- Export CSV/Excel
- Smart Buttons на всех сущностях
- Chatter интеграция во все модули (deals, invoices, bills)
- Тестирование + fix

**Общий срок: 12–14 недель** (было 9–13 в v3.0, добавлено ~2–3 недели на расширенный функционал)

---

*Документ v3.1 — расширение к FleetOps PRD v3.0 на основе детального анализа модулей Odoo: CRM (AI scoring, automation, pipelines), Contacts (chatter, followers, partner autocomplete, documents), Accounting (follow-up, recurring, multi-currency exchange, batch payments, reporting), Discuss (notifications), Documents (file management).*
