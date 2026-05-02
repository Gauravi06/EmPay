from flask import Blueprint, request, jsonify
import json
from database import get_db
from utils import token_required, admin_required, _safe_user, _to_camel
from werkzeug.security import generate_password_hash

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('', methods=['GET'])
@token_required
def get_employees(current_user):
    conn = get_db()
    if current_user['role'] == 'admin':
        users = conn.execute('SELECT * FROM users').fetchall()
    else:
        users = [conn.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],)).fetchone()]
    return jsonify({'employees': [_safe_user(dict(u)) for u in users if u]})

@employees_bp.route('', methods=['POST'])
@token_required
def add_employee(current_user):
    if current_user['role'] not in ('admin', 'hr_officer'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    from werkzeug.security import generate_password_hash
    import random, string
    
    data = request.json
    conn = get_db()
    
    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    login_id = f"EMP{str(user_count + 1).zfill(3)}"
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    password_hash = generate_password_hash(temp_password)
    
    first_name = data.get('firstName') or data.get('first_name', '')
    last_name = data.get('lastName') or data.get('last_name', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    department = data.get('department', 'General')
    role = data.get('role', 'employee')
    salary = data.get('salary', 50000)
    location = data.get('location', 'Head Office')
    company_name = data.get('companyName') or data.get('company_name', '')
    
    try:
        cursor = conn.execute('''
            INSERT INTO users (login_id, password_hash, temp_password, first_name, last_name, email, phone, role, department, location, company_name, salary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (login_id, password_hash, temp_password, first_name, last_name, email, phone, role, department, location, company_name, salary))
        conn.commit()
        user_id = cursor.lastrowid
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        result = _safe_user(dict(user))
        result['tempPassword'] = temp_password
        return jsonify({'employee': result, 'message': f'Employee added. Temp password: {temp_password}'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@employees_bp.route('/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(current_user, employee_id):
    if current_user['role'] != 'admin' and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized'}), 403
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'Employee not found'}), 404
    return jsonify(_safe_user(dict(user)))

@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@token_required
def update_employee(current_user, employee_id):
    if current_user['role'] != 'admin' and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    allowed_fields = ['first_name', 'last_name', 'email', 'phone', 'department',
                      'location', 'uan', 'salary', 'role', 'status',
                      'bank_details', 'manager_id', 'profile_picture', 'company_name',
                      'salary_components', 'time_off_used', 'personal_email', 'gender',
                      'marital_status', 'residing_address', 'nationality', 'about', 'certifications', 'grade']

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

@employees_bp.route('/<int:employee_id>/role', methods=['PUT'])
@token_required
@admin_required
def update_employee_role(current_user, employee_id):
    data = request.json
    role = data.get('role')
    if not role:
        return jsonify({'error': 'Role is required'}), 400
    conn = get_db()
    conn.execute('UPDATE users SET role = ? WHERE id = ?', (role, employee_id))
    conn.commit()
    return jsonify({'success': True, 'message': 'Role updated'})

@employees_bp.route('/<int:employee_id>/reset-password', methods=['POST'])
@token_required
@admin_required
def reset_employee_password(current_user, employee_id):
    import random, string
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    password_hash = generate_password_hash(temp_password)
    conn = get_db()
    conn.execute('UPDATE users SET password_hash = ?, temp_password = ? WHERE id = ?',
                (password_hash, temp_password, employee_id))
    conn.commit()
    return jsonify({'success': True, 'tempPassword': temp_password})