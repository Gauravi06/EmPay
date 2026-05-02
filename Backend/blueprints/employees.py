from flask import Blueprint, request, jsonify
import json
from database import get_db
from utils import token_required, admin_required, _safe_user, _to_camel

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('', methods=['GET'])
@token_required
def get_employees(current_user):
    conn = get_db()
    # If not admin, only show self (or let frontend handle filtering, but better to protect here)
    if current_user['role'] == 'admin':
        users = conn.execute('SELECT * FROM users').fetchall()
    else:
        users = [conn.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],)).fetchone()]
    
    return jsonify({'employees': [_safe_user(dict(u)) for u in users]})

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