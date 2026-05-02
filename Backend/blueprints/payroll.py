import calendar as _cal
import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required

payroll_bp = Blueprint('payroll', __name__)

ADMIN   = 'admin'
PAYROLL = 'payroll_officer'

MONTH_NAMES = {i: _cal.month_name[i] for i in range(1, 13)}

def _role_ok(role):
    return role in [ADMIN, PAYROLL]

def _get_working_days(year, month):
    _, total_days = _cal.monthrange(year, month)
    return sum(
        1 for d in range(1, total_days + 1)
        if datetime.date(year, month, d).weekday() < 5
    )

def _get_present_days(conn, user_id, year, month):
    row = conn.execute(
        """
        SELECT COUNT(*) as cnt FROM attendance
        WHERE user_id = ?
          AND date LIKE ?
          AND (status = 'present' OR (check_in IS NOT NULL AND check_in != ''))
        """,
        (user_id, f"{year}-{str(month).zfill(2)}%")
    ).fetchone()
    return row['cnt'] if row else 0

def _normalize(record):
    r = dict(record)

    if 'first_name' in r:
        r['employee_name'] = f"{r.pop('first_name', '')} {r.pop('last_name', '')}".strip()

    r['employee_code']  = r.get('login_id', '')
    r['period']         = f"{MONTH_NAMES.get(r.get('month', 0), '')} {r.get('year', '')}"

    earned = r.get('basic_salary') or 0
    bonus  = r.get('bonus') or 0
    r['gross_wage']       = round(earned + bonus, 2)
    r['total_deductions'] = r.get('deductions', 0)
    r['net_pay']          = r.get('net_salary', 0)

    r['days_present']          = r.get('days_present') or 0
    r['working_days']          = r.get('working_days') or 0
    r['pf_employee']           = round(earned * 0.12, 2)
    r['professional_tax']      = 200 if earned > 0 else 0
    r['tds']                   = 0
    r['performance_bonus']     = bonus
    r['house_rent_allowance']  = 0
    r['standard_allowance']    = 0
    r['leave_travel_allowance']= 0

    return r


@payroll_bp.route('', methods=['GET'])
@token_required
def get_payroll(current_user):
    role        = current_user['role']
    employee_id = request.args.get('employee_id', current_user['id'])
    year        = request.args.get('year')
    month       = request.args.get('month')

    if not _role_ok(role) and int(employee_id) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403

    conn  = get_db()
    query = '''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department, u.salary as full_salary
        FROM payroll p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
    '''
    params = [employee_id]

    if year:
        query  += ' AND p.year = ?'
        params.append(year)
    if month:
        query  += ' AND p.month = ?'
        params.append(month)

    query  += ' ORDER BY p.year DESC, p.month DESC'
    records = conn.execute(query, params).fetchall()
    return jsonify({'payrolls': [_normalize(r) for r in records]})


@payroll_bp.route('/all', methods=['GET'])
@token_required
def get_all_payroll(current_user):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Access denied'}), 403

    conn   = get_db()
    year   = request.args.get('year')
    month  = request.args.get('month')
    query  = '''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department, u.salary as full_salary
        FROM payroll p
        JOIN users u ON p.user_id = u.id
    '''
    params, conditions = [], []
    if year:
        conditions.append('p.year = ?');  params.append(year)
    if month:
        conditions.append('p.month = ?'); params.append(month)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query  += ' ORDER BY p.year DESC, p.month DESC'
    records = conn.execute(query, params).fetchall()
    return jsonify({'payrolls': [_normalize(r) for r in records]})


@payroll_bp.route('/generate', methods=['POST'])
@token_required
def generate_payroll(current_user):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Access denied'}), 403

    data        = request.json
    employee_id = data.get('employeeId', data.get('employee_id'))
    month       = data.get('month')
    year        = data.get('year')

    if not all([employee_id, month, year]):
        return jsonify({'error': 'employeeId, month, and year are required'}), 400

    month = int(month)
    year  = int(year)

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    existing = conn.execute(
        'SELECT id FROM payroll WHERE user_id = ? AND month = ? AND year = ?',
        (employee_id, month, year)
    ).fetchone()
    if existing:
        return jsonify({'error': 'Payroll already generated for this period'}), 400

    full_salary  = user['salary'] or 50000
    working_days = _get_working_days(year, month)
    present_days = _get_present_days(conn, employee_id, year, month)

    earned_salary = round(full_salary * (present_days / working_days), 2) if working_days > 0 else full_salary

    bonus            = data.get('bonus', 0)
    pf               = round(earned_salary * 0.12, 2)
    professional_tax = 200 if earned_salary > 0 else 0
    deductions       = round(pf + professional_tax, 2)
    net_salary       = round(earned_salary + bonus - deductions, 2)

    try:
        conn.execute("ALTER TABLE payroll ADD COLUMN days_present INTEGER DEFAULT 0")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE payroll ADD COLUMN working_days INTEGER DEFAULT 0")
    except Exception:
        pass

    cursor = conn.execute('''
        INSERT INTO payroll
            (user_id, month, year, basic_salary, bonus, deductions, net_salary,
             days_present, working_days, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (employee_id, month, year, earned_salary, bonus, deductions, net_salary,
          present_days, working_days))
    conn.commit()

    record = conn.execute('''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department, u.salary as full_salary
        FROM payroll p JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ''', (cursor.lastrowid,)).fetchone()

    return jsonify({
        'message': 'Payroll generated successfully',
        'payroll': _normalize(record),
        'attendanceSummary': {
            'presentDays':  present_days,
            'workingDays':  working_days,
            'fullSalary':   full_salary,
            'earnedSalary': earned_salary,
        }
    }), 201


@payroll_bp.route('/<int:payroll_id>', methods=['PUT'])
@token_required
def update_payroll(current_user, payroll_id):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Access denied'}), 403

    data   = request.json
    conn   = get_db()
    record = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not record:
        return jsonify({'error': 'Payroll record not found'}), 404

    basic_salary = data.get('basicSalary', record['basic_salary'])
    bonus        = data.get('bonus',        record['bonus'])
    deductions   = data.get('deductions',   record['deductions'])
    net_salary   = round(basic_salary + bonus - deductions, 2)
    status       = data.get('status',       record['status'])

    conn.execute('''
        UPDATE payroll SET basic_salary = ?, bonus = ?, deductions = ?, net_salary = ?, status = ?
        WHERE id = ?
    ''', (basic_salary, bonus, deductions, net_salary, status, payroll_id))
    conn.commit()

    updated = conn.execute('''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department, u.salary as full_salary
        FROM payroll p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    ''', (payroll_id,)).fetchone()
    return jsonify({'message': 'Payroll updated', 'payroll': _normalize(updated)})


@payroll_bp.route('/<int:payroll_id>/status', methods=['PUT'])
@token_required
def update_payroll_status(current_user, payroll_id):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Access denied'}), 403

    data   = request.json
    status = data.get('status')
    if status not in ['pending', 'approved', 'paid', 'rejected']:
        return jsonify({'error': 'Invalid status'}), 400

    conn   = get_db()
    record = conn.execute('SELECT id FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not record:
        return jsonify({'error': 'Payroll not found'}), 404

    payment_date = None
    if status == 'paid':
        payment_date = datetime.datetime.now().strftime('%Y-%m-%d')

    conn.execute(
        'UPDATE payroll SET status = ?, payment_date = COALESCE(?, payment_date) WHERE id = ?',
        (status, payment_date, payroll_id)
    )
    conn.commit()
    return jsonify({'message': f'Status updated to {status}'})


@payroll_bp.route('/<int:payroll_id>/payslip', methods=['GET', 'POST'])
@token_required
def get_payslip(current_user, payroll_id):
    conn   = get_db()
    record = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not record:
        return jsonify({'error': 'Payroll not found'}), 404

    role = current_user['role']
    if not _role_ok(role) and current_user['id'] != record['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403

    user   = conn.execute('SELECT * FROM users WHERE id = ?', (record['user_id'],)).fetchone()
    earned = record['basic_salary'] or 0
    bonus  = record['bonus'] or 0

    keys = record.keys()
    days_present = record['days_present'] if 'days_present' in keys else 0
    working_days = record['working_days'] if 'working_days' in keys else 0

    payslip = {
        'payrollId':            record['id'],
        'employee_name':        f"{user['first_name']} {user['last_name']}",
        'employee_code':        user['login_id'],
        'department':           user['department'],
        'period':               f"{MONTH_NAMES.get(record['month'], '')} {record['year']}",
        'month':                record['month'],
        'year':                 record['year'],
        'full_salary':          user['salary'] or 50000,
        'basic_salary':         earned,
        'bonus':                bonus,
        'performance_bonus':    bonus,
        'gross_wage':           round(earned + bonus, 2),
        'pf_employee':          round(earned * 0.12, 2),
        'professional_tax':     200 if earned > 0 else 0,
        'tds':                  0,
        'house_rent_allowance': 0,
        'standard_allowance':   0,
        'leave_travel_allowance': 0,
        'total_deductions':     record['deductions'],
        'net_pay':              record['net_salary'],
        'status':               record['status'],
        'payment_date':         record['payment_date'],
        'days_present':         days_present,
        'working_days':         working_days,
    }
    return jsonify({'payslip': payslip})