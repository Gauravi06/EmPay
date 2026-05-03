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

        # Users Table
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

        # Attendance Table
        db.execute('''
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
        ''')

        try:
            db.execute('ALTER TABLE attendance ADD COLUMN work_hours REAL')
            db.commit()
        except Exception:
            pass

        # Payroll Table
        db.execute('''
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
        ''')

        # Time Off Table
        db.execute('''
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
        ''')

        for col, defn in [('approved_by', 'INTEGER'), ('comments', 'TEXT')]:
            try:
                db.execute(f'ALTER TABLE time_off ADD COLUMN {col} {defn}')
                db.commit()
            except Exception:
                pass

        # Documents Table
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

        # Announcements Table
        db.execute('''
            CREATE TABLE IF NOT EXISTS announcements (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                body       TEXT NOT NULL,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id)
            );
        ''')

        # Notifications Table
        db.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL,
                title      TEXT NOT NULL,
                message    TEXT NOT NULL,
                type       TEXT DEFAULT 'info',
                is_read    INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        ''')

        db.commit()