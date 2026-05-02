from flask import Blueprint, request, jsonify
import json, datetime
from database import get_db
from utils import token_required, admin_required

time_off_bp = Blueprint('time_off', __name__)

@time_off_bp.route('', methods=['GET'])
@token_required
def get_time_off(current_user):
    conn = get_db()
    if current_user['role'] in ('admin', 'hr_officer'):
        requests = conn.execute('''
            SELECT t.*, u.first_name || ' ' || u.last_name as employee_name
            FROM time_off t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.applied_at DESC
        ''').fetchall()
    else:
        requests = conn.execute('''
            SELECT t.*, u.first_name || ' ' || u.last_name as employee_name
            FROM time_off t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.user_id = ?
            ORDER BY t.applied_at DESC
        ''', (current_user['id'],)).fetchall()
    
    return jsonify({'requests': [dict(r) for r in requests]})

@time_off_bp.route('', methods=['POST'])
@token_required
def request_time_off(current_user):
    data = request.json
    employee_id = data.get('employeeId', current_user['id'])
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    reason = data.get('reason')
    leave_type = data.get('type', 'paid')
    
    if not start_date or not end_date or not reason:
        return jsonify({'error': 'startDate, endDate and reason are required'}), 400
    
    # Calculate days
    s = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    e = datetime.datetime.strptime(end_date, '%Y-%m-%d')
    days = (e - s).days + 1

    conn = get_db()
    conn.execute('''
        INSERT INTO time_off (user_id, type, start_date, end_date, days, reason, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ''', (employee_id, leave_type, start_date, end_date, days, reason))
    conn.commit()
    return jsonify({'message': 'Request submitted successfully'}), 201

@time_off_bp.route('/<int:request_id>/approve', methods=['POST'])
@token_required
def approve_time_off(current_user, request_id):
    if current_user['role'] not in ('admin', 'hr_officer', 'payroll_officer'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    approved = data.get('approved')
    comments = data.get('comments', '')
    status = 'approved' if approved else 'rejected'

    conn = get_db()
    req = conn.execute('SELECT * FROM time_off WHERE id = ?', (request_id,)).fetchone()
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    conn.execute('''
        UPDATE time_off SET status = ?, comments = ?, approved_at = datetime('now')
        WHERE id = ?
    ''', (status, comments, request_id))
    
    if status == 'approved':
        user = conn.execute('SELECT * FROM users WHERE id = ?', (req['user_id'],)).fetchone()
        used = json.loads(user['time_off_used'] or '{}')
        leave_type = req['type']
        used[leave_type] = used.get(leave_type, 0) + req['days']
        conn.execute('UPDATE users SET time_off_used = ? WHERE id = ?', (json.dumps(used), req['user_id']))
        
    conn.commit()
    return jsonify({'message': f'Request {status} successfully'})

@time_off_bp.route('/<int:request_id>/lock', methods=['POST'])
@token_required
def lock_time_off(current_user, request_id):
    if current_user['role'] not in ('admin', 'hr_officer'):
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    lock = 1 if data.get('lock') else 0
    
    conn = get_db()
    conn.execute('UPDATE time_off SET locked = ? WHERE id = ?', (lock, request_id))
    conn.commit()
    return jsonify({'message': 'Time off lock status updated'})