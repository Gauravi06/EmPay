from flask import Blueprint, request, jsonify
import json
from database import get_db
from utils import token_required, _safe_user, _to_camel

employees_bp = Blueprint('employees', __name__)

ADMIN = 'admin'
HR = 'hr_officer'
PAYROLL = 'payroll_officer'
EMPLOYEE = 'employee'

@employees_bp.route('', methods=['GET'])
@token_required
def get_employees(current_user):
    conn = get_db()
    role = current_user['role']
    # Admin and HR can see all employees
    if role in [ADMIN, HR]:
        users = conn.execute('SELECT * FROM users').fetchall()
    else:
        # Employee and Payroll Officer see only themselves
        users = [conn.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],)).fetchone()]
    return jsonify({'employees': [_safe_user(dict(u)) for u in users if u]})

@employees_bp.route('/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(current_user, employee_id):
    role = current_user['role']
    # Admin, HR can view anyone. Others only themselves.
    if role not in [ADMIN, HR] and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'Employee not found'}), 404
    return jsonify(_safe_user(dict(user)))

@employees_bp.route('', methods=['POST'])
@token_required
def create_employee(current_user):
    # Only Admin and HR can create employees
    if current_user['role'] not in [ADMIN, HR]:
        return jsonify({'error': 'Access denied'}), 403

    from werkzeug.security import generate_password_hash
    data = request.json
    conn = get_db()

    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        return jsonify({'error': 'Email already exists'}), 400

    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    login_id = f"EMP{str(user_count + 1).zfill(3)}"
    temp_password = data.get('password', 'Welcome@123')
    password_hash = generate_password_hash(temp_password)

    cursor = conn.execute('''
        INSERT INTO users (login_id, password_hash, first_name, last_name, email, phone,
                           role, department, location, company_name, salary, joining_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        login_id, password_hash,
        data.get('firstName', data.get('first_name', '')),
        data.get('lastName', data.get('last_name', '')),
        email,
        data.get('phone', ''),
        data.get('role', EMPLOYEE),
        data.get('department', 'General'),
        data.get('location', 'Head Office'),
        data.get('companyName', data.get('company_name', '')),
        data.get('salary', 50000),
        data.get('joiningDate', data.get('joining_date', ''))
    ))
    conn.commit()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify({'message': 'Employee created', 'employee': _safe_user(dict(user)), 'loginId': login_id, 'tempPassword': temp_password}), 201

@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@token_required
def update_employee(current_user, employee_id):
    role = current_user['role']
    # Admin: full update. HR: profile fields only. Employee/Payroll: own profile only, limited fields.
    if role not in [ADMIN, HR] and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json

    # Fields HR and Admin can edit
    hr_fields = ['first_name', 'last_name', 'email', 'phone', 'department',
                 'location', 'manager_id', 'profile_picture', 'company_name',
                 'personal_email', 'gender', 'marital_status', 'residing_address',
                 'nationality', 'about', 'certifications', 'grade', 'joining_date', 'status']

    # Only admin can change these
    admin_only_fields = ['role', 'salary', 'salary_components', 'uan', 'bank_details', 'time_off_used']

    if role == ADMIN:
        allowed_fields = hr_fields + admin_only_fields
    elif role == HR:
        allowed_fields = hr_fields
    else:
        # Employee can only edit their own basic info
        allowed_fields = ['phone', 'personal_email', 'residing_address', 'about', 'profile_picture', 'bank_details']

    conn = get_db()
    updates = []
    params = []
    for field in allowed_fields:
        camel = _to_camel(field)
        if camel in data or field in data:
            val = data.get(camel, data.get(field))
            if isinstance(val, (dict, list)):
                val = json.dumps(val)
            updates.append(f"{field} = ?")
            params.append(val)

    if not updates:
        return jsonify({'error': 'No valid fields provided'}), 400

    params.append(employee_id)
    conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()

    updated = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    return jsonify(_safe_user(dict(updated)))

@employees_bp.route('/<int:employee_id>', methods=['DELETE'])
@token_required
def delete_employee(current_user, employee_id):
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin access required'}), 403
    conn = get_db()
    conn.execute('DELETE FROM users WHERE id = ?', (employee_id,))
    conn.commit()
    return jsonify({'message': 'Employee deleted'})