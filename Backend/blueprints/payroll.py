import calendar as _cal
import datetime
from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required, add_notification

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
    
    r['gross_wage']       = round(earned + bonus + r.get('hra', 0) + r.get('travel_allowance', 0) + r.get('other_allowance', 0), 2)
    r['total_deductions'] = r.get('deductions', 0)
    r['net_pay']          = r.get('net_salary', 0)

    r['days_present']          = r.get('days_present') or 0
    r['working_days']          = r.get('working_days') or 0
    
    # Map database columns to the names expected by frontend
    r['pf_employee']           = r.get('pf', 0)
    r['professional_tax']      = r.get('prof_tax', 0)
    r['tds']                   = r.get('tds', 0)
    r['performance_bonus']     = bonus
    r['house_rent_allowance']  = r.get('hra', 0)
    r['standard_allowance']    = r.get('travel_allowance', 0)
    r['leave_travel_allowance']= r.get('other_allowance', 0)

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

    manual_basic = data.get('manual_basic')
    if manual_basic is not None:
        earned_salary = float(manual_basic)
    else:
        earned_salary = round(full_salary * (present_days / working_days), 2) if working_days > 0 else full_salary

    bonus            = data.get('bonus', 0)
    hra              = round(earned_salary * 0.4, 2) # 40% HRA
    travel           = 2000 if earned_salary > 0 else 0
    other            = 0
    
    pf               = round(earned_salary * 0.12, 2)
    prof_tax         = 200 if earned_salary > 0 else 0
    tds              = 0
    
    deductions       = round(pf + prof_tax + tds, 2)
    net_salary       = round(earned_salary + bonus + hra + travel + other - deductions, 2)

    cursor = conn.execute('''
        INSERT INTO payroll
            (user_id, month, year, basic_salary, bonus, hra, travel_allowance, other_allowance,
             pf, prof_tax, tds, deductions, net_salary, days_present, working_days, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (employee_id, month, year, earned_salary, bonus, hra, travel, other,
          pf, prof_tax, tds, deductions, net_salary, present_days, working_days))
    conn.commit()

    record = conn.execute('''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department, u.salary as full_salary
        FROM payroll p JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ''', (cursor.lastrowid,)).fetchone()

    # Notify User
    add_notification(
        employee_id,
        "Payroll Generated",
        f"Your payroll for {MONTH_NAMES[month]} {year} has been generated and is pending approval.",
        "info"
    )

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

@payroll_bp.route('/preview', methods=['GET'])
@token_required
def preview_payroll(current_user):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Access denied'}), 403
    
    employee_id = request.args.get('employee_id')
    month       = request.args.get('month')
    year        = request.args.get('year')
    
    if not all([employee_id, month, year]):
        return jsonify({'error': 'Missing parameters'}), 400
        
    conn = get_db()
    user = conn.execute('SELECT salary FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    full_salary  = user['salary'] or 50000
    working_days = _get_working_days(int(year), int(month))
    present_days = _get_present_days(conn, employee_id, int(year), int(month))
    earned_salary = round(full_salary * (present_days / working_days), 2) if working_days > 0 else full_salary
    
    return jsonify({
        'fullSalary': full_salary,
        'earnedSalary': earned_salary,
        'presentDays': present_days,
        'workingDays': working_days
    })


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

    basic_salary = data.get('basic_salary', data.get('basicSalary', record['basic_salary']))
    bonus        = data.get('bonus', record['bonus'])
    hra          = data.get('hra', record['hra'])
    travel       = data.get('travel_allowance', record['travel_allowance'])
    other        = data.get('other_allowance', record['other_allowance'])
    pf           = data.get('pf', record['pf'])
    prof_tax     = data.get('prof_tax', record['prof_tax'])
    tds          = data.get('tds', record['tds'])
    
    deductions   = round(pf + prof_tax + tds, 2)
    net_salary   = round(basic_salary + bonus + hra + travel + other - deductions, 2)
    status       = data.get('status', record['status'])

    conn.execute('''
        UPDATE payroll 
        SET basic_salary = ?, bonus = ?, hra = ?, travel_allowance = ?, other_allowance = ?,
            pf = ?, prof_tax = ?, tds = ?, deductions = ?, net_salary = ?, status = ?
        WHERE id = ?
    ''', (basic_salary, bonus, hra, travel, other, pf, prof_tax, tds, deductions, net_salary, status, payroll_id))
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

    # If marked as paid, notify employee
    if status == 'paid':
        p_rec = conn.execute('SELECT user_id, month, year FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
        if p_rec:
            add_notification(
                p_rec['user_id'],
                "Salary Credited",
                f"Your salary for {MONTH_NAMES.get(p_rec['month'], '')} {p_rec['year']} has been marked as PAID.",
                "success"
            )

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
        'gross_wage':           round(earned + bonus + record.get('hra', 0) + record.get('travel_allowance', 0) + record.get('other_allowance', 0), 2),
        'pf_employee':          record.get('pf', 0),
        'professional_tax':     record.get('prof_tax', 0),
        'tds':                  record.get('tds', 0),
        'house_rent_allowance': record.get('hra', 0),
        'standard_allowance':   record.get('travel_allowance', 0),
        'leave_travel_allowance': record.get('other_allowance', 0),
        'total_deductions':     record['deductions'],
        'net_pay':              record['net_salary'],
        'status':               record['status'],
        'payment_date':         record['payment_date'],
        'days_present':         days_present,
        'working_days':         working_days,
    }
    return jsonify({'payslip': payslip})

# ── Budget Settings ───────────────────────────────────────────────────────────

@payroll_bp.route('/budget', methods=['GET'])
@token_required
def get_budget(current_user):
    year  = request.args.get('year', datetime.datetime.now().year)
    month = request.args.get('month', datetime.datetime.now().month)
    conn  = get_db()
    row   = conn.execute(
        'SELECT budget FROM payroll_settings WHERE year = ? AND month = ?',
        (year, month)
    ).fetchone()
    return jsonify({'budget': row['budget'] if row else 0})

@payroll_bp.route('/budget', methods=['POST'])
@token_required
def set_budget(current_user):
    if current_user['role'] != 'admin':
        return jsonify({'error': 'Admin only'}), 403
    data   = request.json
    year   = data.get('year')
    month  = data.get('month')
    budget = data.get('budget', 0)
    if not year or not month:
        return jsonify({'error': 'Year and month required'}), 400
    conn = get_db()
    conn.execute('''
        INSERT INTO payroll_settings (year, month, budget)
        VALUES (?, ?, ?)
        ON CONFLICT(year, month) DO UPDATE SET budget = excluded.budget
    ''', (year, month, budget))
    conn.commit()
    return jsonify({'success': True, 'message': 'Budget updated'})

@payroll_bp.route('/<int:payroll_id>', methods=['DELETE'])
@token_required
def delete_payroll(current_user, payroll_id):
    if not _role_ok(current_user['role']):
        return jsonify({'error': 'Unauthorized'}), 403
        
    conn = get_db()
    # Check if exists
    payroll = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404
        
    conn.execute('DELETE FROM payroll WHERE id = ?', (payroll_id,))
    conn.commit()
    
    return jsonify({'message': 'Payroll record deleted successfully'})