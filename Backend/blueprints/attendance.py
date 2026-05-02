from flask import Blueprint, request, jsonify
import datetime
from database import get_db
from utils import token_required, admin_required

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('', methods=['GET'])
@token_required
def get_attendance(current_user):
    employee_id = request.args.get('employee_id', current_user['id'])
    year = request.args.get('year')
    month = request.args.get('month')
    
    # If not admin, can only see own attendance
    if current_user['role'] != 'admin' and int(employee_id) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db()
    query = 'SELECT * FROM attendance WHERE user_id = ?'
    params = [employee_id]
    
    if year and month:
        query += " AND date LIKE ?"
        params.append(f"{year}-{str(month).zfill(2)}%")
        
    records = conn.execute(query, params).fetchall()
    return jsonify({'attendance': [dict(r) for r in records]})

@attendance_bp.route('', methods=['POST'])
@token_required
def mark_attendance(current_user):
    data = request.json
    employee_id = data.get('employeeId', current_user['id'])
    date = data.get('date')
    check_in = data.get('checkIn')
    check_out = data.get('checkOut')
    status = data.get('status', 'present')
    
    if not date:
        return jsonify({'error': 'Date is required'}), 400
        
    conn = get_db()
    try:
        # Check if exists
        existing = conn.execute('SELECT id FROM attendance WHERE user_id = ? AND date = ?', 
                              (employee_id, date)).fetchone()
        
        if existing:
            conn.execute('''
                UPDATE attendance 
                SET check_in = COALESCE(?, check_in), 
                    check_out = COALESCE(?, check_out),
                    status = ?
                WHERE id = ?
            ''', (check_in, check_out, status, existing['id']))
        else:
            conn.execute('''
                INSERT INTO attendance (user_id, date, check_in, check_out, status)
                VALUES (?, ?, ?, ?, ?)
            ''', (employee_id, date, check_in, check_out, status))
            
        conn.commit()
        return jsonify({'message': 'Attendance marked successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/check-in', methods=['POST'])
@token_required
def check_in(current_user):
    data = request.json
    date = data.get('date')
    time = data.get('time')
    
    if not date or not time:
        return jsonify({'error': 'Date and time are required'}), 400
        
    conn = get_db()
    try:
        conn.execute('''
            INSERT INTO attendance (user_id, date, check_in, status)
            VALUES (?, ?, ?, 'present')
        ''', (current_user['id'], date, time))
        conn.commit()
        return jsonify({'message': 'Checked in successfully'})
    except Exception as e:
        # Try update if already exists
        conn.execute('''
            UPDATE attendance SET check_in = ? WHERE user_id = ? AND date = ?
        ''', (time, current_user['id'], date))
        conn.commit()
        return jsonify({'message': 'Check-in updated'})

@attendance_bp.route('/check-out', methods=['POST'])
@token_required
def check_out(current_user):
    data = request.json
    date = data.get('date')
    time = data.get('time')
    
    if not date or not time:
        return jsonify({'error': 'Date and time are required'}), 400
        
    conn = get_db()
    conn.execute('''
        UPDATE attendance SET check_out = ? WHERE user_id = ? AND date = ?
    ''', (time, current_user['id'], date))
    conn.commit()
    return jsonify({'message': 'Checked out successfully'})

@attendance_bp.route('/today', methods=['GET'])
@token_required
def get_today_attendance(current_user):
    date = request.args.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
    conn = get_db()
    
    if current_user['role'] in ['admin', 'hr_officer']:
        # Return all employees' status for today
        records = conn.execute('''
            SELECT u.id, u.first_name, u.last_name, u.login_id, u.department,
                   a.check_in, a.check_out, a.status, a.work_hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date = ?
        ''', (date,)).fetchall()
        return jsonify({'attendance': [dict(r) for r in records]})
    else:
        # Return just current user's record
        record = conn.execute('SELECT * FROM attendance WHERE user_id = ? AND date = ?', 
                             (current_user['id'], date)).fetchone()
        # To keep consistency with frontend expecting an array or a specific structure
        # In authStore it expects data.attendance
        return jsonify({'attendance': [dict(record)] if record else []})
