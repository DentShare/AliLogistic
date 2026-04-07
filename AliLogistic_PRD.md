# AliLogistic — Product Requirements Document (PRD)

**Version:** 2.0
**Date:** 2026-04-07
**Product:** AliLogistic Fleet Management Platform
**Stack:** React 19 + TypeScript + Tailwind CSS 4 + Vite 8
**Hosting:** Railway (Production) + GitHub (Source)
**URLs:**
- Production: https://alilogistic-production.up.railway.app
- Repository: https://github.com/DentShare/AliLogistic

---

## 1. Product Overview

AliLogistic is a real-time fleet management platform for trucking logistics companies in the USA. It provides dispatchers and directors with a unified view of fleet operations, vehicle maintenance, compliance tracking, and workforce management.

**Target Users:**
- Dispatchers — daily operations, status updates, mileage entry
- Directors — fleet overview, cost monitoring, compliance
- Admins — user management, system configuration
- Viewers — read-only monitoring (TV dashboard displays)

**Core Problem:** Fleet managers need a single screen to see which trucks are rolling, which have maintenance issues, which inspections are expiring, and which drivers need attention — all in real time.

---

## 2. Architecture

### 2.1 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 |
| Styling | Tailwind CSS 4 + DM Sans / JetBrains Mono |
| Build | Vite 8 |
| Icons | Lucide React |
| Routing | React Router 7 |
| State | React Context (AppProvider) |
| Auth | localStorage + hardcoded credentials (mock) |
| Data | In-memory mock data (120 units) |
| Deploy | Dockerfile + Railway |

### 2.2 Theming
- **Dark theme** (default): Navy backgrounds (#070a0f → #12161f), slate text, accent blue (#3b82f6)
- **Light theme**: White/gray backgrounds, enhanced saturation for badges, darker text
- Toggle via sun/moon icon in Header

### 2.3 Authentication & Roles

| Role | View | Edit | Manage Users |
|------|------|------|-------------|
| Admin | All | All | Yes |
| Director | All | All | No |
| Dispatcher | All | Operations + Records | No |
| Viewer | All | None | No |

**Demo Credentials:**
- admin@logistictab.io / admin123 (Admin)
- mike@logistictab.io / mike123 (Dispatcher)
- alex@logistictab.io / alex123 (Dispatcher)
- demo@logistictab.io / demo123 (Viewer)

---

## 3. Navigation Structure

```
Sidebar (240px, collapsible in fullscreen)
  Dashboard           /                    KPI + kanban overview
  Updates             /updates             Real-time status board
  Daily Mileage       /mileage             Daily odometer entry
  Oil & Fluids        /oil                 Oil change tracking
  DOT Inspection      /inspections         DOT compliance
  Registration        /registrations       Vehicle registration
  Repairs             /repairs             Repair management
  Defects             /defects             Defect tracking
  Units               /units               Fleet inventory
    Unit Profile      /units/:id           Single unit detail
  Drivers HR          /drivers             Driver management
  Dispatchers         /dispatchers         User access control
  Audit Log           /audit               Change history
  Status Log          /updates/log         Status change history
```

**Header (56px):**
- "AliLogistic / [Page Name]" branding
- Global search bar
- "+ Add Record" quick action
- Notifications, theme toggle, fullscreen toggle

---

## 4. Module Specifications

### 4.1 Dashboard

**Purpose:** Central monitoring hub for fleet health. Designed for large screen TV displays.

**KPI Cards (8):**
| KPI | Data Source | Color |
|-----|-----------|-------|
| Fleet Size | Active units count | Blue |
| Rolling | Units with status 'rolling' | Emerald |
| Oil Urgent | Oil records critical/warning | Orange |
| Inspection Due | Inspections <= 30 days | Yellow |
| Active Defects | Defects with status 'active' | Red |
| In Repair | Repairs in_repair + sent | Orange |
| Needs Repair | Repairs needs_repair | Red |
| LIVE | Change detection indicator | Green pulse |

**Kanban Columns (8):**
1. Rolling — units in transit (green tint)
2. Oil Change Needed — critical/warning oil (red tint)
3. Sent for Change — sent_for_change oil (blue tint)
4. Inspection Due — expiring inspections (yellow tint)
5. Active Defects — active defects by severity (red tint)
6. In Repair — repairs in progress (orange tint)
7. Needs Repair — awaiting repair (red tint)
8. All Clear — no issues (green tint)

**Card Format (single line):**
```
T-101  John Smith              681 mi ●
```

**Special Features:**
- **Fullscreen mode**: Hides sidebar + header + KPI. Columns fill 100% screen. Empty columns auto-hidden.
- **LIVE indicator**: Pulsing green dot, shows timestamp of last data change
- **Airport flip animation**: Cards rotate (rotateX) when their data changes
- **Breathing glow**: Critical cards pulse red, warning cards pulse orange
- **Per-unit change tracking**: Only changed cards animate
- **Search**: Filters all columns simultaneously
- **Escape key**: Exits fullscreen

### 4.2 Updates (Operational Status Board)

**Purpose:** Live dispatch board showing where every truck is and what condition it's in.

**Architecture — Status vs Condition:**
- **Status** (column = location): rolling, at_shipper, at_receiver, sleeping, no_load
- **Condition** (badge on card): issue, getting_late, on_time, null

A truck can be `at_shipper` + `issue` (at shipper with a problem).

**5 Kanban Columns:**
| Column | Color | Description |
|--------|-------|------------|
| Rolling | Emerald | In transit |
| At Shipper | Purple | Loading |
| At Receiver | Indigo | Unloading |
| Sleeping | Blue | HOS rest |
| No Load | Gray | No active load |

**Card Format (single line with condition badge):**
```
 ISSUE  T-103 Alex Brown   1d  Update
```

**Slide-out Detail Panel (340px right):**
- Opens on card click
- Shows: unit, driver, location status, condition + note
- Load number, route (origin -> destination), ETA
- **Set Condition** buttons: Issue / Late / On Time / Clear + comment field
- **Change Location Status** button (opens modal)
- Recent changes history (last 10)

**Sleep Timer:** Shows `12h 30m awake` for sleeping units based on `last_activity_at`.

**Smart Search:** Multi-word search across unit number, driver, load, route, notes, condition, status.

**Filter:** Dropdown by status or condition.

**Auto 2-column:** Columns with 40+ units auto-switch to 2-column grid.

**Views:** Board (kanban) | Table

### 4.3 Daily Mileage

**Purpose:** Daily odometer reading entry for all units.

**Layout:** 2-column table side by side.

**Columns per table:**
| Column | Content |
|--------|---------|
| Unit | T-101 (bold) |
| Driver | Name |
| Current | Current odometer (read-only) |
| New | Input field (pre-filled with current) |
| Diff | +325 (colored by distance) |
| Updated | "today" / "3d ago" / "never" |

**Sorting:** Units with oldest updates appear first (stale-first). Units with >3 days since update highlighted red.

**Save All:** Single button saves all changed entries at once. Counter shows pending changes.

**Search:** Filter by unit number or driver name.

**Side Effects:** Updating mileage also recalculates oil remaining for all oil records of that unit.

### 4.4 Oil & Fluids

**Purpose:** Track oil change intervals and send units for service.

**Status Thresholds (configurable):**
| Status | Remaining | Color |
|--------|----------|-------|
| Critical | < 2,000 mi | Red |
| Warning | < 5,000 mi | Orange |
| OK | < 10,000 mi | Yellow |
| Good | >= 10,000 mi | Green |

**Actions:**
- Send for Change (marks sent_for_change = true)
- Complete Oil Change (resets remaining to full interval)
- Edit oil type / change interval

### 4.5 DOT Inspection

**Purpose:** Track DOT inspection dates and expiry countdown.

**Countdown Logic:**
| Days Remaining | Status | Color |
|---------------|--------|-------|
| < 0 | Expired | Red |
| <= 7 | Critical | Red |
| <= 30 | Warning | Orange |
| <= 90 | Soon | Yellow |
| > 90 | Valid | Green |

**Actions:** Pass Inspection (set new date), Upload Document

### 4.6 Registration

**Purpose:** Vehicle registration tracking per state.

**Data:** State, plate number, registration date, expiry date, document.

**Actions:** Renew (extends 1 year), Edit inline, Upload document.

### 4.7 Repairs

**Purpose:** Repair tracking with cost and status workflow.

**Status Flow:** needs_repair -> sent -> in_repair -> working

**Categories:** Brakes, Engine, Tires, Suspension, Electrical, HVAC, Transmission

**Data:** Date, invoice, service description, category, shop, cost, status.

### 4.8 Defects

**Purpose:** Track and resolve vehicle defects by severity.

**Severity Levels:** Critical (red pulse), Moderate (orange), Low (yellow)

**Actions:** Resolve defect, Reopen defect.

### 4.9 Units (Fleet Inventory)

**Purpose:** View all units, create new trucks, assign drivers.

**Views:** Card grid | Table

**Unit Card Shows:** Unit number, status badge, worst oil status, DOT status, defect count, driver assignment dropdown.

### 4.10 Unit Profile

**Purpose:** Deep-dive into a single unit across all modules.

**Tabs:**
1. **Overview** — Operational status, mileage, repair costs, active defects, vehicle info, oil/DOT/registration cards
2. **Status** — Current operational status + condition, route, ETA, "Update Status" button, recent status changes timeline
3. **Oil** — All oil records with progress bars and statuses
4. **Repairs** — Repair history table with totals
5. **Defects** — Defect cards with resolve/reopen
6. **Timeline** — Combined repair + defect timeline

### 4.11 Drivers HR

**Purpose:** Driver lifecycle management.

**Kanban Columns:** Reviewing -> Working -> Terminated

**Data:** Name, phone, CDL number, CDL expiry, medical expiry, hire date, assigned unit.

### 4.12 Dispatchers (User Management)

**Purpose:** Manage system users and access control.

**Fields:** Name, email, phone, role (admin/dispatcher/viewer), status, module access list.

### 4.13 Audit Log

**Purpose:** Complete change history across all modules.

**Entry Format:** Timestamp | Dispatcher | Unit | Module | Description | Field | Old Value | New Value

### 4.14 Status Log

**Purpose:** History of operational status transitions.

**Entry Format:** Time | Unit | Previous -> New (badges) | Note | Load # | Changed By

**Filters:** By unit, status, dispatcher.

---

## 5. Shared Components

### 5.1 KpiCard
```
Props: title, value, icon, color, subtitle?
```
Rounded card with icon top-right, large numeric value, optional subtitle.

### 5.2 StatusBadge
```
Props: status, label?, pulse?
```
Colored pill badge. Maps status strings to color schemes.

### 5.3 Modal
```
Props: title, open, onClose, children, width?
```
Backdrop blur, click-outside close, Escape close.

### 5.4 Toast
Auto-dismiss notification (3 seconds). Colored backgrounds.

### 5.5 GlobalModals
Centralized modal rendering:
- MileageModal — update unit odometer
- OilDoneModal — complete oil change
- CreateTruckModal — create new unit
- AddRecordModal — universal record adder (Oil/Inspection/Registration/Repair/Defect)
- UpdateStatusModal — change operational status (5 location statuses only)

---

## 6. Data Model

### 6.1 Core Entities

```
Unit (120 records)
  ├── OilRecord[] (1-3 per unit)
  ├── Inspection (1 per unit)
  ├── Registration (1 per unit)
  ├── Repair[] (0-3 per unit)
  ├── Defect[] (0-2 per unit)
  ├── UnitStatus (1 per unit — location + condition)
  ├── DailyMileageEntry[] (7 days history)
  └── Driver (1 assigned)

Dispatcher (5 records)
AuditEntry[] (change log)
UnitStatusLogEntry[] (status transitions)
```

### 6.2 Operational Status System

**Location Statuses (UnitOperationalStatus):**
| Status | Color | Description |
|--------|-------|------------|
| rolling | #22c55e | Vehicle in transit |
| at_shipper | #a855f7 | At loading dock |
| at_receiver | #6366f1 | At unloading dock |
| sleeping | #3b82f6 | HOS rest period |
| no_load | #6b7280 | No active assignment |

**Conditions (UnitCondition):**
| Condition | Color | Pulse | Description |
|-----------|-------|-------|------------|
| issue | #ef4444 | Yes | Problem requiring attention |
| getting_late | #f97316 | Yes | Behind schedule |
| on_time | #4ade80 | No | Running on schedule |
| null | — | No | No special condition |

---

## 7. UI/UX Specifications

### 7.1 Color System
- **Navy scale:** #070a0f (darkest) -> #2e374c (lightest)
- **Accent:** #3b82f6 (blue)
- **Status colors:** Emerald (good), Blue (info), Yellow (warning), Orange (urgent), Red (critical)

### 7.2 Typography
- **Primary:** DM Sans (system-ui fallback)
- **Mono:** JetBrains Mono (mileage, VIN, timestamps)

### 7.3 Animations
| Animation | Duration | Use Case |
|-----------|----------|----------|
| pulse-slow | 2s infinite | Critical status items |
| airport-flip | 0.6s | Dashboard card data change |
| critical-glow | 1.5s infinite | Red breathing glow on critical cards |
| warning-glow | 2s infinite | Orange breathing glow on warning cards |
| change-flash | 0.8s | Green flash on data update |
| slideIn | 0.3s | Toast notifications |

### 7.4 Responsive Behavior
- Sidebar: 240px fixed, hidden in fullscreen
- Header: 56px fixed, hidden in fullscreen
- KPI grid: 2 -> 4 -> 8 columns
- Kanban: horizontal scroll in normal, flex-stretch in fullscreen
- Auto 2-column: columns with 40+ items split into grid

---

## 8. Deployment

### 8.1 Docker
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
ENV PORT=3000
CMD ["sh", "-c", "serve dist -l $PORT -s"]
```

### 8.2 Railway
- Builder: Dockerfile
- Healthcheck: /
- Restart: ON_FAILURE (max 3 retries)
- Domain: alilogistic-production.up.railway.app

---

## 9. Future Roadmap

### Phase 1 — Backend Integration
- [ ] Supabase PostgreSQL database
- [ ] Supabase Auth (replace mock credentials)
- [ ] Supabase Realtime (multi-user live updates)
- [ ] Row Level Security (RLS) policies per role

### Phase 2 — Advanced Features
- [ ] GPS integration (Samsara / TT ELD / Wialon)
- [ ] IFTA fuel tax reporting
- [ ] Insurance tracking module
- [ ] Trailer management
- [ ] Vendor management
- [ ] Dispatching & load assignment
- [ ] Accounting integration

### Phase 3 — Mobile & Notifications
- [ ] Mobile-responsive driver app
- [ ] Push notifications for critical events
- [ ] SMS/email alerts for expiring inspections
- [ ] Driver self-service (submit defects, update status)

---

## 10. SQL Schema (Supabase Ready)

```sql
-- Unit operational statuses
CREATE TYPE unit_operational_status AS ENUM (
  'rolling', 'sleeping', 'at_shipper', 'at_receiver', 'no_load'
);

CREATE TYPE unit_condition AS ENUM (
  'issue', 'getting_late', 'on_time'
);

-- Current status per unit
CREATE TABLE unit_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status unit_operational_status NOT NULL DEFAULT 'no_load',
  condition unit_condition,
  condition_note TEXT DEFAULT '',
  note TEXT DEFAULT '',
  load_number VARCHAR(50),
  origin VARCHAR(200),
  destination VARCHAR(200),
  eta TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Status change log (append-only)
CREATE TABLE unit_status_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  previous_status unit_operational_status,
  new_status unit_operational_status NOT NULL,
  note TEXT,
  load_number VARCHAR(50),
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Daily mileage entries
CREATE TABLE daily_mileage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  entered_by UUID REFERENCES auth.users(id) NOT NULL,
  UNIQUE(unit_id, date)
);

-- Indexes
CREATE INDEX idx_unit_statuses_status ON unit_statuses(status);
CREATE INDEX idx_status_log_changed_at ON unit_status_log(changed_at DESC);
CREATE INDEX idx_daily_mileage_date ON daily_mileage(date DESC);

-- RLS
ALTER TABLE unit_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mileage ENABLE ROW LEVEL SECURITY;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE unit_statuses;
```

---

*Generated by Claude Opus 4.6 for AliLogistic project.*
