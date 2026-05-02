from flask import Blueprint, request, jsonify
import json
from database import get_db
from utils import token_required, _safe_user, _to_camel

employees_bp = Blueprint('employees', __name__)

ADMIN   = 'admin'
HR      = 'hr_officer'
PAYROLL = 'payroll_officer'
EMP     = 'employee'


@employees_bp.route('', methods=['GET'])
@token_required
def get_employees(current_user):
    """
    ALL roles can view the employee directory.
    - Admin / HR: see full list with all fields
    - Employee / Payroll Officer: see list but salary fields are stripped
    """
    conn  = get_db()
    role  = current_user['role']
    users = conn.execute('SELECT * FROM users').fetchall()

    safe = []
    for u in users:
        d = _safe_user(dict(u))
        # Strip salary from non-admin/payroll roles
        if role not in [ADMIN, PAYROLL]:
            d.pop('salary', None)
            d.pop('salaryComponents', None)
            d.pop('bankDetails', None)
            d.pop('uan', None)
        safe.append(d)

    return jsonify({'employees': safe})


@employees_bp.route('/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(current_user, employee_id):
    """All roles can view an individual employee record."""
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'Employee not found'}), 404

    d    = _safe_user(dict(user))
    role = current_user['role']
    # Strip salary/financial fields from Employee viewing another person
    if role == EMP and current_user['id'] != employee_id:
        d.pop('salary', None)
        d.pop('salaryComponents', None)
        d.pop('bankDetails', None)
        d.pop('uan', None)

    return jsonify(d)


@employees_bp.route('', methods=['POST'])
@token_required
def create_employee(current_user):
    """
    Admin: can create any role.
    HR Officer: can create employees (not admin).
    Payroll / Employee: cannot create.
    """
    role = current_user['role']
    if role not in [ADMIN, HR]:
        return jsonify({'error': 'Access denied — only Admin or HR can create employees'}), 403

    from werkzeug.security import generate_password_hash
    data  = request.json
    conn  = get_db()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        return jsonify({'error': 'Email already exists'}), 400

    # HR cannot create admin accounts
    desired_role = data.get('role', EMP)
    if role == HR and desired_role == ADMIN:
        return jsonify({'error': 'HR Officer cannot create Admin accounts'}), 403

    user_count   = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    login_id     = f"EMP{str(user_count + 1).zfill(3)}"
    temp_password = data.get('password', 'Welcome@123')
    password_hash = generate_password_hash(temp_password)

    cursor = conn.execute('''
        INSERT INTO users (login_id, password_hash, first_name, last_name, email, phone,
                           role, department, location, company_name, salary, joining_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        login_id, password_hash,
        data.get('firstName', data.get('first_name', '')),
        data.get('lastName',  data.get('last_name',  '')),
        email,
        data.get('phone', ''),
        desired_role,
        data.get('department', 'General'),
        data.get('location',   'Head Office'),
        data.get('companyName', data.get('company_name', '')),
        data.get('salary', 50000) if role == ADMIN else 50000,  # HR can't set salary
        data.get('joiningDate', data.get('joining_date', ''))
    ))
    conn.commit()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (cursor.lastrowid,)).fetchone()
    return jsonify({
        'message': 'Employee created',
        'employee': _safe_user(dict(user)),
        'loginId': login_id,
        'tempPassword': temp_password
    }), 201


@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@token_required
def update_employee(current_user, employee_id):
    """
    Admin  : full update (all fields including role, salary).
    HR     : update profile fields only (no salary, no role).
    Payroll: can update salary-related fields for any employee.
    Employee: can only update own limited personal fields.
    """
    role = current_user['role']

    # Employees can only edit themselves; others can edit anyone
    if role == EMP and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized — you can only edit your own profile'}), 403

    # Payroll officer can only update salary fields
    if role == PAYROLL and current_user['id'] != employee_id:
        # Only salary-related fields allowed for payroll officer on other employees
        data = request.json
        allowed = ['salary', 'salary_components', 'uan', 'bank_details']
        conn    = get_db()
        updates, params = [], []
        for field in allowed:
            camel = _to_camel(field)
            if camel in data or field in data:
                val = data.get(camel, data.get(field))
                if isinstance(val, (dict, list)):
                    val = json.dumps(val)
                updates.append(f"{field} = ?")
                params.append(val)
        if not updates:
            return jsonify({'error': 'No valid salary fields provided'}), 400
        params.append(employee_id)
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
        updated = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
        return jsonify(_safe_user(dict(updated)))

    data = request.json

    # Field sets by role
    hr_fields = [
        'first_name', 'last_name', 'email', 'phone', 'department',
        'location', 'manager_id', 'profile_picture', 'company_name',
        'personal_email', 'gender', 'marital_status', 'residing_address',
        'nationality', 'about', 'certifications', 'grade', 'joining_date', 'status'
    ]
    admin_only_fields = ['role', 'salary', 'salary_components', 'uan', 'bank_details', 'time_off_used']
    employee_fields   = ['phone', 'personal_email', 'residing_address', 'about', 'profile_picture', 'bank_details']

    if role == ADMIN:
        allowed_fields = hr_fields + admin_only_fields
    elif role == HR:
        allowed_fields = hr_fields
    else:
        allowed_fields = employee_fields

    conn = get_db()
    updates, params = [], []
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
    """Only Admin can delete employees."""
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin access required'}), 403
    conn = get_db()
    conn.execute('DELETE FROM users WHERE id = ?', (employee_id,))
    conn.commit()
    return jsonify({'message': 'Employee deleted'})


@employees_bp.route('/<int:employee_id>/role', methods=['PUT'])
@token_required
def update_role(current_user, employee_id):
    """Only Admin can change user roles (Settings → Manage Roles)."""
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin access required'}), 403
    data     = request.json
    new_role = data.get('role')
    if new_role not in ['admin', 'hr_officer', 'payroll_officer', 'employee']:
        return jsonify({'error': 'Invalid role'}), 400
    conn = get_db()
    conn.execute('UPDATE users SET role = ? WHERE id = ?', (new_role, employee_id))
    conn.commit()
    return jsonify({'message': f'Role updated to {new_role}'})


@employees_bp.route('/<int:employee_id>/reset-password', methods=['POST'])
@token_required
def reset_password(current_user, employee_id):
    """Admin can reset any password; employees reset their own."""
    if current_user['role'] != ADMIN and current_user['id'] != employee_id:
        return jsonify({'error': 'Unauthorized'}), 403
    from werkzeug.security import generate_password_hash
    data = request.json or {}
    new_password = data.get('password', 'Welcome@123')
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?',
                 (generate_password_hash(new_password), employee_id))
    conn.commit()
    
    # Send email notification
    from utils import send_email
    try:
        send_email(
            user['email'],
            "Password Reset Notification",
            f"Hello {user['first_name']},\n\nYour EmPay account password has been reset by an administrator. Your temporary password is: {new_password}\n\nPlease log in and change your password immediately."
        )
    except Exception as e:
        print(f"Mail error: {e}")
        
    return jsonify({'message': 'Password reset', 'tempPassword': new_password})
