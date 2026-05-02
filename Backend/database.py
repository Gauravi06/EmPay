import sqlite3
from flask import g

DATABASE = 'empay.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db(app):
    with app.app_context():
        db = get_db()
        db.execute('''
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
        ''')
        
        db.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                check_in TEXT,
                check_out TEXT,
                status TEXT DEFAULT 'present',
                work_hours REAL DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, date)
            );
        ''')
        
        db.execute('''
            CREATE TABLE IF NOT EXISTS payroll (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                basic_salary REAL DEFAULT 0,
                house_rent_allowance REAL DEFAULT 0,
                standard_allowance REAL DEFAULT 0,
                performance_bonus REAL DEFAULT 0,
                leave_travel_allowance REAL DEFAULT 0,
                fixed_allowance REAL DEFAULT 0,
                gross_wage REAL DEFAULT 0,
                pf_employee REAL DEFAULT 0,
                professional_tax REAL DEFAULT 0,
                tds REAL DEFAULT 0,
                total_deductions REAL DEFAULT 0,
                net_pay REAL DEFAULT 0,
                bonus REAL DEFAULT 0,
                deductions REAL DEFAULT 0,
                net_salary REAL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_date TEXT,
                worked_days INTEGER DEFAULT 0,
                total_days INTEGER DEFAULT 26,
                attendance INTEGER DEFAULT 0,
                paid_time_off INTEGER DEFAULT 0,
                sick_leave INTEGER DEFAULT 0,
                unpaid_leave INTEGER DEFAULT 0,
                employee_name TEXT,
                employee_code TEXT,
                department TEXT,
                location TEXT,
                uan TEXT,
                period TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')
        
        db.execute('''
            CREATE TABLE IF NOT EXISTS time_off (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                days INTEGER NOT NULL,
                reason TEXT,
                status TEXT DEFAULT 'pending',
                locked INTEGER DEFAULT 0,
                comments TEXT,
                employee_name TEXT,
                submitted_at TEXT DEFAULT (datetime('now')),
                approved_at TEXT,
                applied_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')
        
        db.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                url TEXT NOT NULL,
                upload_date TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')
        
        db.commit()