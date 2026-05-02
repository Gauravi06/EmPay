from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import random
import string
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'empay-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_ALGORITHM'] = 'HS256'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
jwt = JWTManager(app)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token', 'details': str(error)}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Missing token', 'details': str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token expired'}), 401

DB_PATH = os.path.join(os.path.dirname(__file__), 'empay.db')

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        from flask import make_response
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response

# ─── DB Helpers ───────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# ─── DB Init ──────────────────────────────────────────────────────────────────

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
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
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            check_in TEXT,
            check_out TEXT,
            break_time REAL DEFAULT 0,
            work_hours REAL DEFAULT 0,
            overtime REAL DEFAULT 0,
            status TEXT DEFAULT 'absent',
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, date)
        );

        CREATE TABLE IF NOT EXISTS time_off_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_name TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            days INTEGER NOT NULL,
            reason TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            comments TEXT,
            locked INTEGER DEFAULT 0,
            submitted_at TEXT DEFAULT (datetime('now')),
            approved_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS payrolls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_name TEXT,
            employee_code TEXT,
            uan TEXT,
            department TEXT,
            location TEXT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            period TEXT,
            worked_days REAL DEFAULT 0,
            total_days INTEGER DEFAULT 0,
            attendance INTEGER DEFAULT 0,
            paid_time_off REAL DEFAULT 0,
            sick_leave REAL DEFAULT 0,
            vacation REAL DEFAULT 0,
            holiday REAL DEFAULT 0,
            unpaid_leave REAL DEFAULT 0,
            basic_salary REAL DEFAULT 0,
            house_rent_allowance REAL DEFAULT 0,
            standard_allowance REAL DEFAULT 0,
            performance_bonus REAL DEFAULT 0,
            leave_travel_allowance REAL DEFAULT 0,
            gross_wage REAL DEFAULT 0,
            pf_employee REAL DEFAULT 0,
            pf_employer REAL DEFAULT 0,
            professional_tax REAL DEFAULT 0,
            tds REAL DEFAULT 0,
            total_deductions REAL DEFAULT 0,
            net_pay REAL DEFAULT 0,
            base_wage REAL DEFAULT 0,
            status TEXT DEFAULT 'draft',
            generated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS payslips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payroll_id INTEGER NOT NULL,
            generated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (payroll_id) REFERENCES payrolls(id)
        );
    """)

    # Seed default admin if no users exist
    existing = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing == 0:
        _seed_default_users(c)

    conn.commit()
    conn.close()

def _seed_default_users(c):
    """Create 4 default users, one per role"""
    defaults = [
        {
            'login_id': 'ADMIN001',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'email': 'admin@empay.com',
            'phone': '9000000001',
            'role': 'admin',
            'department': 'Management',
            'salary': 100000,
        },
        {
            'login_id': 'HR001',
            'password': 'hr123',
            'first_name': 'HR',
            'last_name': 'Officer',
            'email': 'hr@empay.com',
            'phone': '9000000002',
            'role': 'hr_officer',
            'department': 'Human Resources',
            'salary': 70000,
        },
        {
            'login_id': 'PAY001',
            'password': 'pay123',
            'first_name': 'Payroll',
            'last_name': 'Officer',
            'email': 'payroll@empay.com',
            'phone': '9000000003',
            'role': 'payroll_officer',
            'department': 'Finance',
            'salary': 70000,
        },
        {
            'login_id': 'EMP001',
            'password': 'emp123',
            'first_name': 'John',
            'last_name': 'Employee',
            'email': 'emp@empay.com',
            'phone': '9000000004',
            'role': 'employee',
            'department': 'Engineering',
            'salary': 50000,
        },
    ]

    year = datetime.now().year
    default_components = json.dumps({
        'basic': {'type': 'percentage', 'value': 50},
        'hra': {'type': 'percentage_of_basic', 'value': 50},
        'standardAllowance': {'type': 'fixed', 'value': 4167},
        'performanceBonus': {'type': 'percentage', 'value': 8.33},
        'leaveTravel': {'type': 'percentage', 'value': 5.333},
        'pf': {'type': 'percentage', 'value': 12},
        'professionalTax': {'type': 'fixed', 'value': 200}
    })
    default_time_off = json.dumps({
        'paid': 0, 'sick': 0, 'casual': 0,
        'vacation': 0, 'holiday': 0, 'unpaid': 0
    })

    for d in defaults:
        c.execute("""
            INSERT INTO users
            (login_id, password_hash, first_name, last_name, email, phone,
             role, department, salary, joining_date, joining_year,
             salary_components, time_off_used, company_name)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            d['login_id'],
            generate_password_hash(d['password']),
            d['first_name'], d['last_name'], d['email'], d['phone'],
            d['role'], d['department'], d['salary'],
            datetime.now().strftime('%Y-%m-%d'), year,
            default_components, default_time_off, 'EmPay Corp'
        ))

# ─── Role Permission Check ─────────────────────────────────────────────────────

ROLE_PERMISSIONS = {
    'admin': {
        'employees': ['view', 'create', 'edit', 'delete'],
        'attendance': ['view', 'create', 'edit', 'approve'],
        'time_off': ['view', 'create', 'edit', 'approve'],
        'payroll': ['view', 'create', 'edit'],
        'reports': ['view', 'create'],
        'settings': ['view', 'edit'],
    },
    'hr_officer': {
        'employees': ['view', 'create', 'edit'],
        'attendance': ['view', 'edit', 'approve'],
        'time_off': ['view', 'edit', 'approve'],
        'payroll': ['view'],
        'reports': ['view'],
        'settings': [],
    },
    'payroll_officer': {
        'employees': ['view'],
        'attendance': ['view'],
        'time_off': ['view', 'approve'],
        'payroll': ['view', 'create', 'edit'],
        'reports': ['view', 'create'],
        'settings': [],
    },
    'employee': {
        'employees': ['view'],
        'attendance': ['view', 'create'],
        'time_off': ['view', 'create'],
        'payroll': [],
        'reports': [],
        'settings': [],
    },
}

TIME_OFF_LIMITS = {
    'paid': 24, 'sick': 12, 'casual': 6,
    'vacation': 20, 'holiday': 10, 'unpaid': float('inf')
}

def has_perm(role, module, permission):
    return permission in ROLE_PERMISSIONS.get(role, {}).get(module, [])

def get_current_user():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    conn = get_db()
    user = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone())
    conn.close()
    return user

def require_perm(module, permission):
    """Decorator-like helper; call at start of route and return error if denied."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404, None
    if not has_perm(user['role'], module, permission):
        return jsonify({'error': 'Access denied'}), 403, None
    return None, None, user

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    login_id = data.get('loginId', '').strip()
    password = data.get('password', '').strip()

    conn = get_db()
    user = row_to_dict(conn.execute(
        "SELECT * FROM users WHERE login_id=?", (login_id,)
    ).fetchone())
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user['id']))
    return jsonify({
        'success': True,
        'token': token,
        'user': _safe_user(user)
    })

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Admin-only first-time registration; open if no admin exists."""
    data = request.json
    conn = get_db()

    admin_exists = conn.execute("SELECT 1 FROM users WHERE role='admin'").fetchone()
    if admin_exists:
        conn.close()
        return jsonify({'error': 'Registration is closed. Contact your admin.'}), 403

    year = datetime.now().year
    login_id = f"ADMIN{year}001"
    pw_hash = generate_password_hash(data['password'])

    try:
        conn.execute("""
            INSERT INTO users (login_id, password_hash, first_name, last_name,
            email, phone, role, joining_date, joining_year)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (login_id, pw_hash, data['firstName'], data['lastName'],
              data['email'], data.get('phone', ''), 'admin',
              datetime.now().strftime('%Y-%m-%d'), year))
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

    conn.close()
    return jsonify({'success': True, 'loginId': login_id})

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'user': _safe_user(user)})

@app.route('/api/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user = get_current_user()
    data = request.json
    old_pw = data.get('oldPassword', '')
    new_pw = data.get('newPassword', '')

    if not check_password_hash(user['password_hash'], old_pw):
        return jsonify({'success': False, 'message': 'Invalid current password'}), 400

    conn = get_db()
    conn.execute("UPDATE users SET password_hash=?, temp_password=NULL WHERE id=?",
                 (generate_password_hash(new_pw), user['id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Password updated successfully'})

# ─── Employee Routes ───────────────────────────────────────────────────────────

def _safe_user(u):
    """Strip password_hash from user dict."""
    safe = {k: v for k, v in u.items() if k not in ('password_hash',)}
    # Parse JSON fields
    for field in ('bank_details', 'salary_components', 'time_off_used'):
        if safe.get(field) and isinstance(safe[field], str):
            try:
                safe[field] = json.loads(safe[field])
            except Exception:
                pass
    return safe

@app.route('/api/employees', methods=['GET'])
@jwt_required()
def get_employees():
    err, _status, user = require_perm('employees', 'view')
    if err: return err, _status

    conn = get_db()
    rows = rows_to_list(conn.execute("SELECT * FROM users ORDER BY id").fetchall())
    conn.close()
    return jsonify({'employees': [_safe_user(r) for r in rows]})

@app.route('/api/employees/<int:emp_id>', methods=['GET'])
@jwt_required()
def get_employee(emp_id):
    err, _status, user = require_perm('employees', 'view')
    if err: return err, _status

    conn = get_db()
    row = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (emp_id,)).fetchone())
    conn.close()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'employee': _safe_user(row)})

@app.route('/api/employees', methods=['POST'])
@jwt_required()
def create_employee():
    err, _status, user = require_perm('employees', 'create')
    if err: return err, _status

    data = request.json
    year = datetime.now().year
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM users WHERE joining_year=?", (year,)).fetchone()[0]
    serial = str(count + 1).zfill(4)
    name_code = (data['firstName'][:2] + data['lastName'][:2]).upper()
    login_id = f"IO{name_code}{year}{serial}"

    temp_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    pw_hash = generate_password_hash(temp_pw)

    default_components = json.dumps({
        'basic': {'type': 'percentage', 'value': 50},
        'hra': {'type': 'percentage_of_basic', 'value': 50},
        'standardAllowance': {'type': 'fixed', 'value': 4167},
        'performanceBonus': {'type': 'percentage', 'value': 8.33},
        'leaveTravel': {'type': 'percentage', 'value': 5.333},
        'pf': {'type': 'percentage', 'value': 12},
        'professionalTax': {'type': 'fixed', 'value': 200}
    })
    default_time_off = json.dumps({
        'paid': 0, 'sick': 0, 'casual': 0,
        'vacation': 0, 'holiday': 0, 'unpaid': 0
    })

    try:
        conn.execute("""
            INSERT INTO users
            (login_id, password_hash, temp_password, first_name, last_name,
             email, phone, role, department, location, company_name, uan,
             salary, joining_date, joining_year, salary_components, time_off_used)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            login_id, pw_hash, temp_pw,
            data['firstName'], data['lastName'],
            data['email'], data.get('phone', ''),
            data.get('role', 'employee'),
            data.get('department', 'General'),
            data.get('location', 'Head Office'),
            data.get('companyName', 'EmPay Corp'),
            data.get('uan', ''),
            data.get('salary', 50000),
            datetime.now().strftime('%Y-%m-%d'), year,
            default_components, default_time_off
        ))
        conn.commit()
        new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        new_emp = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (new_id,)).fetchone())
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

    conn.close()
    return jsonify({'success': True, 'employee': _safe_user(new_emp), 'tempPassword': temp_pw, 'loginId': login_id}), 201

@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
@jwt_required()
def update_employee(emp_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # Self-update allowed; others need edit permission
    if user['id'] != emp_id:
        err, _status, user = require_perm('employees', 'edit')
        if err: return err, _status

    data = request.json
    allowed_fields = ['first_name', 'last_name', 'email', 'phone', 'department',
                      'location', 'uan', 'salary', 'role', 'status',
                      'bank_details', 'manager_id', 'profile_picture', 'company_name',
                      'salary_components', 'time_off_used']

    conn = get_db()
    updates = []
    values = []
    for field in allowed_fields:
        camel = _to_camel(field)
        if camel in data or field in data:
            val = data.get(camel, data.get(field))
            if isinstance(val, (dict, list)):
                val = json.dumps(val)
            updates.append(f"{field}=?")
            values.append(val)

    if updates:
        values.append(emp_id)
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id=?", values)
        conn.commit()

    updated = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (emp_id,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'employee': _safe_user(updated)})

@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(emp_id):
    err, _status, user = require_perm('employees', 'delete')
    if err: return err, _status

    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?", (emp_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/employees/<int:emp_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(emp_id):
    err, _status, user = require_perm('settings', 'edit')
    if err: return err, _status

    new_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    conn = get_db()
    conn.execute("UPDATE users SET password_hash=?, temp_password=? WHERE id=?",
                 (generate_password_hash(new_pw), new_pw, emp_id))
    conn.commit()
    emp = row_to_dict(conn.execute("SELECT email FROM users WHERE id=?", (emp_id,)).fetchone())
    conn.close()
    print(f"[EMAIL] Password reset for {emp['email']}: {new_pw}")
    return jsonify({'success': True, 'tempPassword': new_pw})

@app.route('/api/employees/<int:emp_id>/role', methods=['PUT'])
@jwt_required()
def update_role(emp_id):
    err, _status, user = require_perm('settings', 'edit')
    if err: return err, _status

    data = request.json
    new_role = data.get('role')
    if new_role not in ROLE_PERMISSIONS:
        return jsonify({'error': 'Invalid role'}), 400

    conn = get_db()
    conn.execute("UPDATE users SET role=? WHERE id=?", (new_role, emp_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ─── Attendance Routes ─────────────────────────────────────────────────────────

@app.route('/api/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    err, _status, user = require_perm('attendance', 'view')
    if err: return err, _status

    emp_id = request.args.get('employeeId', type=int)
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    conn = get_db()
    # Employees can only see own attendance
    if user['role'] == 'employee':
        emp_id = user['id']

    query = "SELECT * FROM attendance WHERE 1=1"
    params = []
    if emp_id:
        query += " AND user_id=?"
        params.append(emp_id)
    if year and month:
        query += " AND strftime('%Y', date)=? AND strftime('%m', date)=?"
        params += [str(year), str(month).zfill(2)]

    rows = rows_to_list(conn.execute(query + " ORDER BY date", params).fetchall())
    conn.close()
    return jsonify({'attendance': rows})

@app.route('/api/attendance', methods=['POST'])
@jwt_required()
def mark_attendance():
    user = get_current_user()
    data = request.json

    target_id = data.get('employeeId', user['id'])
    # Employees can only mark own attendance
    if user['role'] == 'employee' and target_id != user['id']:
        return jsonify({'error': 'Access denied'}), 403

    date = data.get('date')
    check_in = data.get('checkIn')
    check_out = data.get('checkOut')
    break_time = data.get('breakTime', 0)

    conn = get_db()
    existing = row_to_dict(conn.execute(
        "SELECT * FROM attendance WHERE user_id=? AND date=?", (target_id, date)
    ).fetchone())

    work_hours = 0
    overtime = 0
    status = 'absent'

    if check_in:
        status = 'present'
    if check_in and check_out:
        ci = datetime.strptime(f"{date}T{check_in}", "%Y-%m-%dT%H:%M")
        co = datetime.strptime(f"{date}T{check_out}", "%Y-%m-%dT%H:%M")
        total = (co - ci).total_seconds() / 3600
        work_hours = max(0, total - (break_time / 60))
        overtime = max(0, work_hours - 9)

    if existing:
        conn.execute("""
            UPDATE attendance SET check_in=COALESCE(?,check_in),
            check_out=COALESCE(?,check_out), break_time=?,
            work_hours=?, overtime=?, status=?
            WHERE user_id=? AND date=?
        """, (check_in, check_out, break_time, work_hours, overtime, status, target_id, date))
    else:
        conn.execute("""
            INSERT INTO attendance (user_id, date, check_in, check_out, break_time, work_hours, overtime, status)
            VALUES (?,?,?,?,?,?,?,?)
        """, (target_id, date, check_in, check_out, break_time, work_hours, overtime, status))

    conn.commit()
    record = row_to_dict(conn.execute(
        "SELECT * FROM attendance WHERE user_id=? AND date=?", (target_id, date)
    ).fetchone())
    conn.close()
    return jsonify({'success': True, 'attendance': record})

@app.route('/api/attendance/today', methods=['GET'])
@jwt_required()
def today_attendance():
    err, _status, user = require_perm('attendance', 'view')
    if err: return err, _status

    today = datetime.now().strftime('%Y-%m-%d')
    conn = get_db()
    rows = rows_to_list(conn.execute("""
        SELECT u.id, u.first_name, u.last_name, u.login_id, u.department,
               a.check_in, a.check_out, a.work_hours, a.status
        FROM users u
        LEFT JOIN attendance a ON a.user_id=u.id AND a.date=?
    """, (today,)).fetchall())
    conn.close()
    return jsonify({'attendance': rows})

# ─── Time Off Routes ───────────────────────────────────────────────────────────

@app.route('/api/time-off', methods=['GET'])
@jwt_required()
def get_time_off():
    user = get_current_user()
    conn = get_db()

    if user['role'] in ('admin', 'hr_officer', 'payroll_officer'):
        rows = rows_to_list(conn.execute(
            "SELECT * FROM time_off_requests ORDER BY submitted_at DESC"
        ).fetchall())
    else:
        rows = rows_to_list(conn.execute(
            "SELECT * FROM time_off_requests WHERE user_id=? ORDER BY submitted_at DESC",
            (user['id'],)
        ).fetchall())

    conn.close()
    return jsonify({'requests': rows})

@app.route('/api/time-off', methods=['POST'])
@jwt_required()
def submit_time_off():
    user = get_current_user()
    data = request.json

    start = data['startDate']
    end = data['endDate']
    leave_type = data['type']
    days = _calc_days(start, end)

    conn = get_db()
    time_off_used = json.loads(user.get('time_off_used') or '{}')
    used = time_off_used.get(leave_type, 0)
    limit = TIME_OFF_LIMITS.get(leave_type, 0)

    if limit != float('inf') and used + days > limit:
        conn.close()
        return jsonify({'success': False, 'message': f'Insufficient {leave_type} leave. Available: {limit - used} days'}), 400

    conn.execute("""
        INSERT INTO time_off_requests (user_id, employee_name, start_date, end_date, days, reason, type)
        VALUES (?,?,?,?,?,?,?)
    """, (user['id'], f"{user['first_name']} {user['last_name']}",
          start, end, days, data['reason'], leave_type))
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    req = row_to_dict(conn.execute("SELECT * FROM time_off_requests WHERE id=?", (new_id,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'request': req}), 201

@app.route('/api/time-off/<int:req_id>/approve', methods=['POST'])
@jwt_required()
def approve_time_off(req_id):
    err, _status, user = require_perm('time_off', 'approve')
    if err: return err, _status

    data = request.json
    approved = data.get('approved', True)
    comments = data.get('comments', '')

    conn = get_db()
    req = row_to_dict(conn.execute("SELECT * FROM time_off_requests WHERE id=?", (req_id,)).fetchone())
    if not req:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    status = 'approved' if approved else 'rejected'
    conn.execute("""
        UPDATE time_off_requests SET status=?, comments=?, approved_at=?
        WHERE id=?
    """, (status, comments, datetime.now().isoformat(), req_id))

    if approved:
        emp = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (req['user_id'],)).fetchone())
        time_off_used = json.loads(emp.get('time_off_used') or '{}')
        time_off_used[req['type']] = time_off_used.get(req['type'], 0) + req['days']
        conn.execute("UPDATE users SET time_off_used=? WHERE id=?",
                     (json.dumps(time_off_used), req['user_id']))

    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/time-off/<int:req_id>/lock', methods=['POST'])
@jwt_required()
def lock_time_off(req_id):
    err, _status, user = require_perm('time_off', 'edit')
    if err: return err, _status

    data = request.json
    locked = 1 if data.get('lock', True) else 0
    conn = get_db()
    conn.execute("UPDATE time_off_requests SET locked=? WHERE id=?", (locked, req_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ─── Payroll Routes ────────────────────────────────────────────────────────────

@app.route('/api/payroll', methods=['GET'])
@jwt_required()
def get_payroll():
    user = get_current_user()
    conn = get_db()

    if user['role'] in ('admin', 'payroll_officer'):
        rows = rows_to_list(conn.execute(
            "SELECT * FROM payrolls ORDER BY year DESC, month DESC"
        ).fetchall())
    elif user['role'] == 'hr_officer':
        rows = rows_to_list(conn.execute(
            "SELECT * FROM payrolls ORDER BY year DESC, month DESC"
        ).fetchall())
    else:
        # Employees cannot view payroll
        conn.close()
        return jsonify({'error': 'Access denied'}), 403

    conn.close()
    return jsonify({'payrolls': rows})

@app.route('/api/payroll/generate', methods=['POST'])
@jwt_required()
def generate_payroll():
    err, _status, user = require_perm('payroll', 'create')
    if err: return err, _status

    data = request.json
    emp_id = data['employeeId']
    year = data['year']
    month = data['month']

    conn = get_db()
    emp = row_to_dict(conn.execute("SELECT * FROM users WHERE id=?", (emp_id,)).fetchone())
    if not emp:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404

    # Get attendance for the month
    attendance_rows = rows_to_list(conn.execute("""
        SELECT * FROM attendance WHERE user_id=?
        AND strftime('%Y', date)=? AND strftime('%m', date)=?
    """, (emp_id, str(year), str(month).zfill(2))).fetchall())

    # Get approved time off for the month
    time_off_rows = rows_to_list(conn.execute("""
        SELECT * FROM time_off_requests WHERE user_id=? AND status='approved'
        AND strftime('%Y', start_date)=? AND strftime('%m', start_date)=?
    """, (emp_id, str(year), str(month).zfill(2))).fetchall())

    # Calc working days (approx weekends)
    import calendar
    total_days = calendar.monthrange(year, month)[1]
    working_days = total_days - 8  # approx weekends

    present_days = len([a for a in attendance_rows if a['status'] == 'present' and a['check_in']])
    paid_toff = sum(r['days'] for r in time_off_rows if r['type'] == 'paid')
    sick = sum(r['days'] for r in time_off_rows if r['type'] == 'sick')
    vacation = sum(r['days'] for r in time_off_rows if r['type'] == 'vacation')
    holiday = sum(r['days'] for r in time_off_rows if r['type'] == 'holiday')
    unpaid = sum(r['days'] for r in time_off_rows if r['type'] == 'unpaid')

    payable_days = present_days + paid_toff + sick + vacation + holiday
    daily_rate = emp['salary'] / working_days
    base_wage = daily_rate * payable_days

    basic = base_wage * 0.5
    hra = basic * 0.5
    std_allow = 4167
    perf_bonus = base_wage * 0.0833
    lta = base_wage * 0.05333
    gross = basic + hra + std_allow + perf_bonus + lta

    pf_emp = base_wage * 0.12
    pf_er = base_wage * 0.12
    prof_tax = 200
    tds = base_wage * 0.1 if base_wage > 50000 else 0
    total_ded = pf_emp + prof_tax + tds
    net_pay = gross - total_ded

    month_name = datetime(year, month, 1).strftime('%B %Y')

    conn.execute("""
        INSERT INTO payrolls
        (user_id, employee_name, employee_code, uan, department, location,
         year, month, period, worked_days, total_days, attendance,
         paid_time_off, sick_leave, vacation, holiday, unpaid_leave,
         basic_salary, house_rent_allowance, standard_allowance,
         performance_bonus, leave_travel_allowance, gross_wage,
         pf_employee, pf_employer, professional_tax, tds,
         total_deductions, net_pay, base_wage, status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        emp_id, f"{emp['first_name']} {emp['last_name']}", emp['login_id'],
        emp.get('uan', ''), emp.get('department', ''), emp.get('location', ''),
        year, month, month_name, payable_days, working_days, present_days,
        paid_toff, sick, vacation, holiday, unpaid,
        basic, hra, std_allow, perf_bonus, lta, gross,
        pf_emp, pf_er, prof_tax, tds, total_ded, net_pay, base_wage, 'draft'
    ))
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    payroll = row_to_dict(conn.execute("SELECT * FROM payrolls WHERE id=?", (new_id,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'payroll': payroll}), 201

@app.route('/api/payroll/<int:payroll_id>/status', methods=['PUT'])
@jwt_required()
def update_payroll_status(payroll_id):
    err, _status, user = require_perm('payroll', 'edit')
    if err: return err, _status

    data = request.json
    status = data.get('status')
    conn = get_db()
    conn.execute("UPDATE payrolls SET status=? WHERE id=?", (status, payroll_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/payroll/<int:payroll_id>/payslip', methods=['POST'])
@jwt_required()
def generate_payslip(payroll_id):
    err, _status, user = require_perm('payroll', 'create')
    if err: return err, _status

    conn = get_db()
    payroll = row_to_dict(conn.execute("SELECT * FROM payrolls WHERE id=?", (payroll_id,)).fetchone())
    if not payroll:
        conn.close()
        return jsonify({'error': 'Payroll not found'}), 404

    conn.execute("INSERT INTO payslips (payroll_id) VALUES (?)", (payroll_id,))
    conn.commit()
    slip_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    slip = row_to_dict(conn.execute("SELECT * FROM payslips WHERE id=?", (slip_id,)).fetchone())
    conn.close()
    return jsonify({'success': True, 'payslip': {**slip, **payroll}})

# ─── Reports ───────────────────────────────────────────────────────────────────

@app.route('/api/reports/summary', methods=['GET'])
@jwt_required()
def reports_summary():
    err, _status, user = require_perm('reports', 'view')
    if err: return err, _status

    conn = get_db()
    total_emp = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_payroll = conn.execute("SELECT COALESCE(SUM(net_pay),0) FROM payrolls WHERE status='paid'").fetchone()[0]
    pending_leaves = conn.execute("SELECT COUNT(*) FROM time_off_requests WHERE status='pending'").fetchone()[0]
    present_today = conn.execute("""
        SELECT COUNT(*) FROM attendance WHERE date=? AND status='present'
    """, (datetime.now().strftime('%Y-%m-%d'),)).fetchone()[0]

    monthly = rows_to_list(conn.execute("""
        SELECT month, year, SUM(net_pay) as total_payroll,
               SUM(gross_wage) as gross, COUNT(*) as count
        FROM payrolls GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 12
    """).fetchall())

    dept_dist = rows_to_list(conn.execute("""
        SELECT department, COUNT(*) as count FROM users GROUP BY department
    """).fetchall())

    conn.close()
    return jsonify({
        'totalEmployees': total_emp,
        'totalPayroll': total_payroll,
        'pendingLeaves': pending_leaves,
        'presentToday': present_today,
        'monthlyPayroll': monthly,
        'departmentDistribution': dept_dist
    })

# ─── Settings ──────────────────────────────────────────────────────────────────

@app.route('/api/settings/users', methods=['GET'])
@jwt_required()
def settings_users():
    err, _status, user = require_perm('settings', 'view')
    if err: return err, _status

    conn = get_db()
    rows = rows_to_list(conn.execute(
        "SELECT id, login_id, first_name, last_name, email, role, department, status FROM users"
    ).fetchall())
    conn.close()
    return jsonify({'users': rows})

# ─── Utility ──────────────────────────────────────────────────────────────────

def _calc_days(start, end):
    s = datetime.strptime(start, '%Y-%m-%d')
    e = datetime.strptime(end, '%Y-%m-%d')
    return max(1, (e - s).days + 1)

def _to_camel(snake):
    parts = snake.split('_')
    return parts[0] + ''.join(p.title() for p in parts[1:])

# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    print("✅ EmPay Backend running on http://localhost:5000")
    print("Default logins:")
    print("  Admin:          ADMIN001 / admin123")
    print("  HR Officer:     HR001    / hr123")
    print("  Payroll Officer:PAY001   / pay123")
    print("  Employee:       EMP001   / emp123")
    app.run(debug=True, port=5000)