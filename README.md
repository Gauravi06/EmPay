# EmPay — Smart Human Resource Management System

A full-stack HRMS built for startups, institutions, and SMEs to manage employees, attendance, payroll, and time off through a clean role-based interface.

---


## Overview

EmPay is a hackathon project that simulates real-world ERP workflows. It covers:

- User registration and role-based login
- Employee profile management
- Attendance tracking with check-in/check-out
- Leave (time off) application and approval workflows
- Payroll generation with PF, professional tax, and net salary breakdown
- Dashboard analytics and reports

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Zustand (with persistence) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Date Handling | date-fns |
| Backend | Python, Flask 3.0 |
| Auth | JWT (PyJWT) |
| Database | SQLite (via sqlite3) |
| Password Hashing | Werkzeug |
| CORS | Flask-CORS |

---

## Project Structure

```
EmPay/
├── Backend/
│   ├── app.py                  # Flask app factory, blueprint registration
│   ├── database.py             # SQLite connection, table creation (init_db)
│   ├── utils.py                # JWT helpers, token_required decorator, _safe_user
│   ├── seed.py                 # Demo data seeder
│   ├── requirements.txt
│   ├── empay.db                # SQLite database (auto-created)
│   └── blueprints/
│       ├── auth.py             # /api/auth — login, signup, /me
│       ├── employees.py        # /api/employees — CRUD
│       ├── attendance.py       # /api/attendance — check-in/out, history
│       ├── time_off.py         # /api/time-off — apply, approve, allocate
│       ├── payroll.py          # /api/payroll — generate, update, payslip
│       └── misc.py             # /api/reports/summary, /api/documents
│
└── Frontend/
    ├── src/
    │   ├── stores/
    │   │   └── authStore.js    # Zustand store — all API calls, role permissions
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Header.jsx
    │   │   ├── EmployeeCard.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── SignUp.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── EmployeeList.jsx
    │   │   ├── EmployeeProfile.jsx
    │   │   ├── MyProfile.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── TimeOff.jsx
    │   │   ├── Payroll.jsx
    │   │   ├── Reports.jsx
    │   │   ├── Settings.jsx
    │   │   ├── AdminSettings.jsx
    │   │   └── ChangePassword.jsx
    │   ├── App.jsx              # Routes with ProtectedRoute wrappers
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Roles & Permissions

| Module | Admin | HR Officer | Payroll Officer | Employee |
|--------|-------|-----------|-----------------|----------|
| Employees | Full (CRUD) | View, Create, Edit | View Only | View Only |
| Attendance | Full | View, Edit | View Only | View Own + Check-in |
| Time Off | Full + Approve | View, Edit | View + Approve | View Own + Apply |
| Payroll | Full | View Only | View, Generate, Edit | No Access |
| Reports | View, Create | View Only | View, Create | No Access |
| Settings | Full | No Access | No Access | No Access |

### Role Details

**Admin (`admin`)**
- Full access to all modules
- Only role that can access Settings and Admin Settings
- Can change any user's role (cannot change own role)
- No access limitations

**HR Officer (`hr_officer`)**
- Can create and update employee profiles
- Can view all employee attendance records
- Can manage and allocate leaves to employees
- Cannot access payroll data or system settings

**Payroll Officer (`payroll_officer`)**
- Can approve or reject time-off requests
- Can generate payslips and payroll reports
- Can view attendance records
- Cannot create or modify employee data

**Employee (`employee`)**
- Can mark attendance (check-in/check-out)
- Can apply for time off and view request status
- Can view own attendance and profile
- Can access the employee directory (view only)
- Cannot access settings, payroll, or salary info

---

## Modules

### 1. Authentication
- `POST /api/auth/signup` — First user auto-assigned `admin` role; subsequent users get `employee`
- `POST /api/auth/login` — Accepts `login_id` or `email`
- `GET /api/auth/me` — Returns current user from token
- Login IDs auto-generated: `EMP001`, `EMP002`, etc.
- JWT tokens valid for 24 hours

### 2. Employee Management
- Full CRUD for admin and HR
- Fields: name, email, phone, department, location, salary, role, joining date, bank details, UAN, profile picture, bio, certifications
- Each role has field-level edit restrictions (e.g. only admin can change salary/role)

### 3. Attendance
- Employees can check in and check out from Dashboard or Attendance page
- Admin/HR can mark attendance manually for any employee on any date
- Monthly view with present/absent/late/leave breakdown
- Late detection: check-in after 09:05 AM counts as late

### 4. Time Off
- Employees apply with type (Paid, Sick, Casual, Unpaid, Vacation, Holiday), dates, and reason
- Payroll Officer and Admin can approve or reject
- HR can allocate leave balance to employees via `POST /api/time-off/allocate`
- Approved leaves update the employee's `time_off_used` record
- Leave limits: Paid 24, Sick 12, Casual 6, Vacation 20, Holiday 10, Unpaid unlimited

### 5. Payroll
- Admin/Payroll Officer generate payroll per employee per month
- Calculations:
  - PF Deduction: 12% of basic salary
  - Professional Tax: ₹200 flat
  - Net Salary = Basic + Bonus − (PF + Professional Tax)
- Payslip endpoint returns full breakdown
- One payroll record per employee per month (duplicate generation blocked)

### 6. Dashboard & Analytics
- Check-in/Check-out button for employees
- Today's attendance pie chart
- Monthly payroll bar chart
- Employee cards with status indicators
- Summary stats: total employees, present today, pending leaves, total payroll

### 7. Reports
- Salary statement report per employee per year
- Attendance trend charts
- Department distribution
- Printable via browser print dialog

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip

### 1. Clone the repo

```bash
git clone https://github.com/Gauravi06/EmPay.git
cd EmPay
```

### 2. Backend Setup

```bash
cd Backend
pip install -r requirements.txt
python app.py
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. First Run

On first launch, go to `http://localhost:5173/signup` and register. The **first user is automatically assigned the Admin role**.

---

## Seeding Demo Data

To populate the database with demo users, attendance, time off, and payroll records:

```bash
cd Backend
python seed.py
```

This creates 6 users:

| Role | Login ID | Password | Name |
|------|----------|----------|------|
| Admin | EMP001 | admin123 | Alice Admin |
| HR Officer | EMP002 | hr123 | Bob HR |
| Payroll Officer | EMP003 | payroll123 | Carol Payroll |
| Employee | EMP004 | emp123 | David Dev |
| Employee | EMP005 | emp123 | Eva Sales |
| Employee | EMP006 | emp123 | Frank Design |

Also seeds:
- 30 days of attendance records for employees (weekdays only, 90% present)
- 5 time off requests with mixed statuses
- 3 months of payroll records (Feb, Mar, Apr 2025)

> ⚠️ Running seed.py clears all existing data first.

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Any | Get current user |

### Employees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/employees` | Admin, HR | Get all employees |
| GET | `/api/employees/:id` | Admin, HR, Self | Get one employee |
| POST | `/api/employees` | Admin, HR | Create employee |
| PUT | `/api/employees/:id` | Admin, HR, Self (limited) | Update employee |
| DELETE | `/api/employees/:id` | Admin | Delete employee |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/attendance` | Admin, HR, Payroll, Self | Get attendance records |
| GET | `/api/attendance/today` | Admin, HR, Payroll, Self | Today's attendance |
| POST | `/api/attendance/check-in` | Any | Check in |
| POST | `/api/attendance/check-out` | Any | Check out |
| POST | `/api/attendance` | Admin, HR | Manual attendance entry |

### Time Off
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/time-off` | All | Get requests (filtered by role) |
| POST | `/api/time-off` | Any | Submit request |
| POST | `/api/time-off/:id/approve` | Admin, Payroll | Approve or reject |
| POST | `/api/time-off/allocate` | Admin, HR | Allocate leave days |

### Payroll
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/payroll` | Admin, Payroll, Self | Get payroll records |
| GET | `/api/payroll/all` | Admin, Payroll | Get all payrolls with employee info |
| POST | `/api/payroll/generate` | Admin, Payroll | Generate payroll for employee/month |
| PUT | `/api/payroll/:id` | Admin, Payroll | Edit payroll record |
| GET | `/api/payroll/:id/payslip` | Admin, Payroll, Self | Get payslip breakdown |

### Reports
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports/summary` | Admin | Dashboard summary stats |

---
Built for Odoo Hackthon
---

