import sqlite3
import os
from werkzeug.security import generate_password_hash
from datetime import date, timedelta

DATABASE = 'empay.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def seed():
    # Remove old database so we start fresh
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print("Old database removed.")

    conn = get_db()

    # ── Create tables ────────────────────────────────────────────────────────
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            temp_password TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'employee',
            department TEXT DEFAULT 'General',
            location TEXT DEFAULT 'Head Office',
            company_name TEXT,
            uan TEXT,
            salary REAL DEFAULT 50000,
            joining_date TEXT,
            joining_year INTEGER,
            status TEXT DEFAULT 'present',
            profile_picture TEXT,
            manager_id INTEGER,
            bank_details TEXT,
            salary_components TEXT,
            time_off_used TEXT DEFAULT '{}',
            personal_email TEXT,
            gender TEXT,
            marital_status TEXT,
            residing_address TEXT,
            nationality TEXT,
            about TEXT,
            certifications TEXT,
            grade TEXT DEFAULT 'Employee',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            check_in TEXT,
            check_out TEXT,
            status TEXT DEFAULT 'present',
            work_hours REAL,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, date)
        );

        CREATE TABLE IF NOT EXISTS payroll (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            basic_salary REAL,
            bonus REAL DEFAULT 0,
            deductions REAL DEFAULT 0,
            net_salary REAL,
            status TEXT DEFAULT 'pending',
            payment_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS time_off (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            days INTEGER NOT NULL DEFAULT 1,
            reason TEXT,
            status TEXT DEFAULT 'pending',
            applied_at TEXT DEFAULT (datetime('now')),
            approved_by INTEGER,
            comments TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            url TEXT NOT NULL,
            upload_date TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS announcements (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            body       TEXT NOT NULL,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        );
    ''')

    # ── Users ────────────────────────────────────────────────────────────────
    users = [
        ('EMP001', 'admin123',    'Alice',  'Admin',   'alice@empay.com',   '9000000001', 'admin',            'Management',  'Head Office', 'EmPay Corp', 90000,  'Senior Manager'),
        ('EMP002', 'hr123',       'Bob',    'HR',      'bob@empay.com',     '9000000002', 'hr_officer',       'HR',          'Head Office', 'EmPay Corp', 60000,  'HR Lead'),
        ('EMP003', 'payroll123',  'Carol',  'Payroll', 'carol@empay.com',   '9000000003', 'payroll_officer',  'Finance',     'Head Office', 'EmPay Corp', 65000,  'Finance Lead'),
        ('EMP004', 'emp123',      'David',  'Dev',     'david@empay.com',   '9000000004', 'employee',         'Engineering', 'Head Office', 'EmPay Corp', 55000,  'Engineer'),
        ('EMP005', 'emp123',      'Eva',    'Sales',   'eva@empay.com',     '9000000005', 'employee',         'Sales',       'Mumbai',      'EmPay Corp', 50000,  'Sales Rep'),
        ('EMP006', 'emp123',      'Frank',  'Design',  'frank@empay.com',   '9000000006', 'employee',         'Design',      'Pune',        'EmPay Corp', 52000,  'Designer'),
    ]

    user_ids = []
    for login_id, password, first, last, email, phone, role, dept, location, company, salary, grade in users:
        cur = conn.execute(
            '''INSERT INTO users
               (login_id, password_hash, first_name, last_name, email, phone,
                role, department, location, company_name, salary, grade,
                joining_date, joining_year, status, time_off_used)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (login_id, generate_password_hash(password), first, last, email, phone,
             role, dept, location, company, salary, grade,
             '2024-01-15', 2024, 'present', '{}')
        )
        user_ids.append(cur.lastrowid)

    print(f"Created {len(user_ids)} users.")

    # ── Attendance (last 30 weekdays) ─────────────────────────────────────────
    today      = date.today()
    weekdays   = []
    d          = today - timedelta(days=1)
    while len(weekdays) < 30:
        if d.weekday() < 5:   # Mon–Fri only
            weekdays.append(d)
        d -= timedelta(days=1)

    import random
    random.seed(42)

    att_rows = 0
    for uid in user_ids[3:]:   # employees only (EMP004–006)
        for day in weekdays:
            if random.random() < 0.1:   # 10% absent
                status, ci, co, wh = 'absent', None, None, None
            else:
                status = 'present'
                ci     = f'09:0{random.randint(0,5)}'
                co     = f'18:0{random.randint(0,5)}'
                wh     = round(random.uniform(7.5, 9.0), 2)
            conn.execute(
                'INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, status, work_hours) VALUES (?,?,?,?,?,?)',
                (uid, day.isoformat(), ci, co, status, wh)
            )
            att_rows += 1

    print(f"Created {att_rows} attendance records.")

    # ── Time Off ──────────────────────────────────────────────────────────────
    time_off_data = [
        (user_ids[3], 'paid',   (today - timedelta(days=10)).isoformat(), (today - timedelta(days=8)).isoformat(),  3, 'Family trip',      'approved'),
        (user_ids[4], 'sick',   (today - timedelta(days=3)).isoformat(),  (today - timedelta(days=2)).isoformat(),  2, 'Fever',            'approved'),
        (user_ids[5], 'casual', (today + timedelta(days=2)).isoformat(),  (today + timedelta(days=2)).isoformat(),  1, 'Personal work',    'pending'),
        (user_ids[3], 'paid',   (today + timedelta(days=7)).isoformat(),  (today + timedelta(days=9)).isoformat(),  3, 'Holiday plans',    'pending'),
        (user_ids[4], 'unpaid', (today - timedelta(days=20)).isoformat(), (today - timedelta(days=18)).isoformat(), 3, 'Emergency travel', 'rejected'),
    ]

    for uid, typ, sd, ed, days, reason, status in time_off_data:
        conn.execute(
            'INSERT INTO time_off (user_id, type, start_date, end_date, days, reason, status) VALUES (?,?,?,?,?,?,?)',
            (uid, typ, sd, ed, days, reason, status)
        )

    print(f"Created {len(time_off_data)} time off requests.")

    # ── Payroll (last 3 months) ───────────────────────────────────────────────
    today_m = date.today()
    months  = []
    m = today_m.replace(day=1)
    for _ in range(3):
        months.append((m.year, m.month))
        m = (m.replace(day=1) - timedelta(days=1)).replace(day=1)

    payroll_rows = 0
    for uid_idx, (login_id, _, _, _, _, _, role, _, _, _, salary, _) in enumerate(users):
        uid = user_ids[uid_idx]
        for year, month in months:
            basic      = salary
            bonus      = round(salary * 0.05, 2)
            pf         = round(salary * 0.12, 2)
            prof_tax   = 200
            deductions = round(pf + prof_tax, 2)
            net        = round(basic + bonus - deductions, 2)
            status     = 'paid' if month < today_m.month or year < today_m.year else 'approved'
            conn.execute(
                'INSERT INTO payroll (user_id, month, year, basic_salary, bonus, deductions, net_salary, status) VALUES (?,?,?,?,?,?,?,?)',
                (uid, month, year, basic, bonus, deductions, net, status)
            )
            payroll_rows += 1

    print(f"Created {payroll_rows} payroll records.")

    # ── Announcements ─────────────────────────────────────────────────────────
    conn.execute(
        'INSERT INTO announcements (title, body, created_by) VALUES (?,?,?)',
        ('Welcome to EmPay!', 'This is your new HR management system. Explore the dashboard, mark your attendance, and apply for leaves directly from the portal.', user_ids[0])
    )
    conn.execute(
        'INSERT INTO announcements (title, body, created_by) VALUES (?,?,?)',
        ('Payroll processed for last month', 'Salaries for all employees have been processed and credited. Check your payslip under the Payroll section.', user_ids[0])
    )

    print("Created 2 announcements.")

    conn.commit()
    conn.close()

    print("\nSeed complete! Login credentials:")
    print("  Admin          → EMP001 / admin123")
    print("  HR Officer     → EMP002 / hr123")
    print("  Payroll Officer→ EMP003 / payroll123")
    print("  Employee       → EMP004 / emp123")
    print("  Employee       → EMP005 / emp123")
    print("  Employee       → EMP006 / emp123")

if __name__ == '__main__':
    seed()