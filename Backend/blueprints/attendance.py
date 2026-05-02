from flask import Blueprint, request, jsonify
import datetime
from database import get_db
from utils import token_required, admin_required

attendance_bp = Blueprint('attendance', __name__)

def calc_work_hours(check_in, check_out, break_minutes=60):
    if not check_in or not check_out:
        return 0
    try:
        fmt = '%H:%M'
        ci = datetime.datetime.strptime(check_in, fmt)
        co = datetime.datetime.strptime(check_out, fmt)
        diff = (co - ci).total_seconds() / 3600
        diff -= break_minutes / 60
        return max(0, round(diff, 2))
    except:
        return 0

@attendance_bp.route('', methods=['GET'])
@token_required
def get_attendance(current_user):
    employee_id = request.args.get('employee_id') or request.args.get('employeeId', current_user['id'])
    year = request.args.get('year')
    month = request.args.get('month')
    
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
    break_time = data.get('breakTime', 60)
    
    if not date:
        return jsonify({'error': 'Date is required'}), 400
    
    work_hours = calc_work_hours(check_in, check_out, break_time)
        
    conn = get_db()
    try:
        existing = conn.execute('SELECT id FROM attendance WHERE user_id = ? AND date = ?', 
                              (employee_id, date)).fetchone()
        
        if existing:
            conn.execute('''
                UPDATE attendance 
                SET check_in = COALESCE(?, check_in), 
                    check_out = COALESCE(?, check_out),
                    status = ?,
                    work_hours = ?
                WHERE id = ?
            ''', (check_in, check_out, status, work_hours, existing['id']))
        else:
            conn.execute('''
                INSERT INTO attendance (user_id, date, check_in, check_out, status, work_hours)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (employee_id, date, check_in, check_out, status, work_hours))
            
        conn.commit()
        return jsonify({'message': 'Attendance marked successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@attendance_bp.route('/today', methods=['GET'])
@token_required
def get_today_attendance(current_user):
    date = request.args.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
    conn = get_db()
    
    if current_user['role'] in ['admin', 'hr_officer']:
        records = conn.execute('''
            SELECT u.id, u.first_name, u.last_name, u.login_id, u.department,
                   a.check_in, a.check_out, a.status, a.work_hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date = ?
        ''', (date,)).fetchall()
        return jsonify({'attendance': [dict(r) for r in records]})
    else:
        record = conn.execute('SELECT * FROM attendance WHERE user_id = ? AND date = ?', 
                             (current_user['id'], date)).fetchone()
        return jsonify({'attendance': [dict(record)] if record else []})