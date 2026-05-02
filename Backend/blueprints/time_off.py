from flask import Blueprint, request, jsonify
import json
from database import get_db
from utils import token_required, admin_required, _to_camel

time_off_bp = Blueprint('time_off', __name__)

@time_off_bp.route('', methods=['GET'])
@token_required
def get_time_off(current_user):
    conn = get_db()
    if current_user['role'] == 'admin':
        requests = conn.execute('SELECT * FROM time_off ORDER BY applied_at DESC').fetchall()
    else:
        requests = conn.execute('SELECT * FROM time_off WHERE user_id = ? ORDER BY applied_at DESC', 
                               (current_user['id'],)).fetchall()
    
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
    conn.commit()
    return jsonify({'message': 'Request submitted successfully'}), 201

@time_off_bp.route('/<int:request_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_time_off(current_user, request_id):
    data = request.json
    approved = data.get('approved') # True/False
    status = 'approved' if approved else 'rejected'

    conn = get_db()
    req = conn.execute('SELECT * FROM time_off WHERE id = ?', (request_id,)).fetchone()
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    conn.execute('UPDATE time_off SET status = ? WHERE id = ?', (status, request_id))
    
    # If approved, update user's time_off_used
    if status == 'approved':
        user = conn.execute('SELECT * FROM users WHERE id = ?', (req['user_id'],)).fetchone()
        used = json.loads(user['time_off_used'] or '{}')
        leave_type = req['type']
        used[leave_type] = used.get(leave_type, 0) + req['days']
        conn.execute('UPDATE users SET time_off_used = ? WHERE id = ?', (json.dumps(used), req['user_id']))
        
    conn.commit()
    return jsonify({'message': f'Request {status} successfully'})
