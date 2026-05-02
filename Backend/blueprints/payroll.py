from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required

payroll_bp = Blueprint('payroll', __name__)

ADMIN = 'admin'
PAYROLL = 'payroll_officer'

@payroll_bp.route('', methods=['GET'])
@token_required
def get_payroll(current_user):
    role = current_user['role']
    employee_id = request.args.get('employee_id', current_user['id'])
    year = request.args.get('year')
    month = request.args.get('month')

    # Admin and Payroll Officer can see all. Others only themselves.
    if role not in [ADMIN, PAYROLL] and int(employee_id) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db()
    query = 'SELECT * FROM payroll WHERE user_id = ?'
    params = [employee_id]

    if year:
        query += " AND year = ?"
        params.append(year)
    if month:
        query += " AND month = ?"
        params.append(month)

    query += " ORDER BY year DESC, month DESC"
    records = conn.execute(query, params).fetchall()
    return jsonify({'payrolls': [dict(r) for r in records]})

@payroll_bp.route('/all', methods=['GET'])
@token_required
def get_all_payroll(current_user):
    if current_user['role'] not in [ADMIN, PAYROLL]:
        return jsonify({'error': 'Access denied'}), 403

    conn = get_db()
    year = request.args.get('year')
    month = request.args.get('month')

    query = '''
        SELECT p.*, u.first_name, u.last_name, u.login_id, u.department
        FROM payroll p
        JOIN users u ON p.user_id = u.id
    '''
    params = []
    conditions = []
    if year:
        conditions.append("p.year = ?")
        params.append(year)
    if month:
        conditions.append("p.month = ?")
        params.append(month)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY p.year DESC, p.month DESC"

    records = conn.execute(query, params).fetchall()
    return jsonify({'payrolls': [dict(r) for r in records]})

@payroll_bp.route('/generate', methods=['POST'])
@token_required
def generate_payroll(current_user):
    if current_user['role'] not in [ADMIN, PAYROLL]:
        return jsonify({'error': 'Access denied'}), 403

    data = request.json
    employee_id = data.get('employeeId', data.get('employee_id'))
    month = data.get('month')
    year = data.get('year')

    if not all([employee_id, month, year]):
        return jsonify({'error': 'employeeId, month, and year are required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if already generated
    existing = conn.execute(
        'SELECT id FROM payroll WHERE user_id = ? AND month = ? AND year = ?',
        (employee_id, month, year)
    ).fetchone()
    if existing:
        return jsonify({'error': 'Payroll already generated for this period'}), 400

    basic_salary = user['salary'] or 50000
    pf = round(basic_salary * 0.12, 2)        # 12% PF
    professional_tax = 200                      # flat professional tax
    bonus = data.get('bonus', 0)
    deductions = round(pf + professional_tax, 2)
    net_salary = round(basic_salary + bonus - deductions, 2)

    cursor = conn.execute('''
        INSERT INTO payroll (user_id, month, year, basic_salary, bonus, deductions, net_salary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ''', (employee_id, month, year, basic_salary, bonus, deductions, net_salary))
    conn.commit()

    payroll_id = cursor.lastrowid
    record = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    return jsonify({'message': 'Payroll generated successfully', 'payroll': dict(record)}), 201

@payroll_bp.route('/<int:payroll_id>', methods=['PUT'])
@token_required
def update_payroll(current_user, payroll_id):
    if current_user['role'] not in [ADMIN, PAYROLL]:
        return jsonify({'error': 'Access denied'}), 403

    data = request.json
    conn = get_db()
    record = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not record:
        return jsonify({'error': 'Payroll record not found'}), 404

    basic_salary = data.get('basicSalary', record['basic_salary'])
    bonus = data.get('bonus', record['bonus'])
    deductions = data.get('deductions', record['deductions'])
    net_salary = round(basic_salary + bonus - deductions, 2)
    status = data.get('status', record['status'])

    conn.execute('''
        UPDATE payroll SET basic_salary = ?, bonus = ?, deductions = ?, net_salary = ?, status = ?
        WHERE id = ?
    ''', (basic_salary, bonus, deductions, net_salary, status, payroll_id))
    conn.commit()

    updated = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    return jsonify({'message': 'Payroll updated', 'payroll': dict(updated)})

@payroll_bp.route('/<int:payroll_id>/payslip', methods=['GET'])
@token_required
def get_payslip(current_user):
    # Everyone can get their own payslip. Admin/Payroll can get anyone's.
    conn = get_db()
    # Re-fetch payroll_id from URL
    from flask import request as req
    payroll_id = req.view_args.get('payroll_id')
    record = conn.execute('SELECT * FROM payroll WHERE id = ?', (payroll_id,)).fetchone()
    if not record:
        return jsonify({'error': 'Payroll not found'}), 404

    role = current_user['role']
    if role not in [ADMIN, PAYROLL] and current_user['id'] != record['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403

    user = conn.execute('SELECT * FROM users WHERE id = ?', (record['user_id'],)).fetchone()

    payslip = {
        'payrollId': record['id'],
        'employeeName': f"{user['first_name']} {user['last_name']}",
        'loginId': user['login_id'],
        'department': user['department'],
        'month': record['month'],
        'year': record['year'],
        'basicSalary': record['basic_salary'],
        'bonus': record['bonus'],
        'grossSalary': round(record['basic_salary'] + record['bonus'], 2),
        'pfDeduction': round(record['basic_salary'] * 0.12, 2),
        'professionalTax': 200,
        'totalDeductions': record['deductions'],
        'netSalary': record['net_salary'],
        'status': record['status'],
        'paymentDate': record['payment_date']
    }
    return jsonify({'payslip': payslip})