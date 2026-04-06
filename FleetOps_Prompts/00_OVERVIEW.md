# ПРОМТ ДЛЯ CLAUDE CODE: Полная реализация FleetOps Platform

## Контекст проекта

Ты реализуешь FleetOps — web-based fleet management platform для логистической компании, управляющей автопарком грузовиков в США из Узбекистана. Платформа объединяет функциональность двух лидеров рынка:

1. **Samsara** — телематика, preventive maintenance, DVIR, compliance, AI-диагностика, work orders
2. **QuickManage TMS** — dispatching, accounting, fleet management, safety & HR, AI-ассистент

FleetOps берёт лучшее из обоих, но фокусируется на **technical fleet management + dispatching + accounting** в одной платформе, без необходимости покупать дорогое IoT-оборудование.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + TypeScript, Tailwind CSS, Recharts, Lucide React icons |
| Backend | Supabase (PostgreSQL 15+, Auth, Edge Functions, Realtime, Storage) |
| Auth | Supabase Auth с Row Level Security (RLS) per role |
| Hosting | Vercel (frontend), Supabase Cloud (backend) |
| File Storage | Supabase Storage (documents, invoices, receipts, certificates) |
| State Management | Zustand или React Context + useReducer |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack Table v8 |
| Date handling | date-fns с timezone support (date-fns-tz) |
| PDF export | @react-pdf/renderer |
| Excel export | SheetJS (xlsx) |

---

## Роли пользователей (4 роли)

| Роль | Описание |
|------|----------|
| **Admin** | Полный доступ ко всему. Управление пользователями, удаление записей |
| **Director** | Просмотр всего, создание/редактирование, экспорт, audit log. Без удаления и управления users |
| **Dispatcher** | Ежедневная работа: ввод пробега, создание записей, defects, loads. Редактирование своих записей |
| **Viewer** | Только просмотр dashboard и всех модулей. Без какого-либо ввода данных |

---

