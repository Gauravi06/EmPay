from flask import Blueprint, request, jsonify
import json
from database import get_db
from database import get_db
from utils import token_required, _to_camel, add_notification

time_off_bp = Blueprint('time_off', __name__)

ADMIN = 'admin'
HR = 'hr_officer'
PAYROLL = 'payroll_officer'

@time_off_bp.route('', methods=['GET'])
@token_required
def get_time_off(current_user):
    conn = get_db()
    role = current_user['role']
    # Admin, HR, Payroll can see all requests
    if role in [ADMIN, HR, PAYROLL]:
        requests = conn.execute('''
            SELECT t.*, u.first_name, u.last_name, u.login_id
            FROM time_off t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.applied_at DESC
        ''').fetchall()
    else:
        requests = conn.execute(
            'SELECT * FROM time_off WHERE user_id = ? ORDER BY applied_at DESC',
            (current_user['id'],)
        ).fetchall()
    return jsonify({'requests': [dict(r) for r in requests]})

@time_off_bp.route('', methods=['POST'])
@token_required
def request_time_off(current_user):
    data = request.json
    required = ['type', 'startDate', 'endDate', 'days', 'reason']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    conn = get_db()
    conn.execute('''
        INSERT INTO time_off (user_id, type, start_date, end_date, days, reason)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (current_user['id'], data['type'], data['startDate'], data['endDate'], data['days'], data['reason']))
    
    # Notify Admin/HR
    add_notification(
        current_user['id'], 
        "Leave Request Submitted", 
        f"{current_user['firstName']} {current_user['lastName']} requested {data['days']} days of {data['type']}.",
        "info"
    )

    conn.commit()
    return jsonify({'message': 'Request submitted successfully'}), 201

@time_off_bp.route('/<int:request_id>/approve', methods=['POST'])
@token_required
def approve_time_off(current_user, request_id):
    # Admin and Payroll Officer can approve/reject
    if current_user['role'] not in [ADMIN, PAYROLL]:
        return jsonify({'error': 'Access denied'}), 403

    data = request.json
    approved = data.get('approved')
    status = 'approved' if approved else 'rejected'

    conn = get_db()
    req = conn.execute('SELECT * FROM time_off WHERE id = ?', (request_id,)).fetchone()
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    conn.execute('UPDATE time_off SET status = ? WHERE id = ?', (status, request_id))

    if status == 'approved':
        user = conn.execute('SELECT * FROM users WHERE id = ?', (req['user_id'],)).fetchone()
        used = json.loads(user['time_off_used'] or '{}')
        leave_type = req['type']
        used[leave_type] = used.get(leave_type, 0) + req['days']
        conn.execute('UPDATE users SET time_off_used = ? WHERE id = ?', (json.dumps(used), req['user_id']))

    conn.commit()

    # Notify User
    add_notification(
        req['user_id'],
        f"Leave Request {status.title()}",
        f"Your {req['type']} leave request for {req['start_date']} has been {status}.",
        "success" if status == 'approved' else "warning"
    )

    return jsonify({'message': f'Request {status} successfully'})

@time_off_bp.route('/allocate', methods=['POST'])
@token_required
def allocate_leave(current_user):
    # Only Admin and HR can allocate leaves
    if current_user['role'] not in [ADMIN, HR]:
        return jsonify({'error': 'Access denied'}), 403

    data = request.json
    employee_id = data.get('employeeId')
    leave_type = data.get('leaveType')
    days = data.get('days')

    if not all([employee_id, leave_type, days]):
        return jsonify({'error': 'employeeId, leaveType, and days are required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'Employee not found'}), 404

    used = json.loads(user['time_off_used'] or '{}')
    # Use negative values to represent allocated balance (or store separately)
    # Here we store allocated as a separate key pattern: "allocated_<type>"
    alloc_key = f"allocated_{leave_type}"
    used[alloc_key] = used.get(alloc_key, 0) + int(days)
    conn.execute('UPDATE users SET time_off_used = ? WHERE id = ?', (json.dumps(used), employee_id))
    conn.commit()
    return jsonify({'message': f'Allocated {days} days of {leave_type} to employee'})