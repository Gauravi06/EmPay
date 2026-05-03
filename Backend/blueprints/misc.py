from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required

misc_bp = Blueprint('misc', __name__)

ADMIN   = 'admin'
HR      = 'hr_officer'
PAYROLL = 'payroll_officer'


# ── Reports ──────────────────────────────────────────────────────────────────

@misc_bp.route('/reports/summary', methods=['GET'])
@token_required
def get_summary_report(current_user):
    """Summary stats for Dashboard. All roles with reports.view permission can call this."""
    conn = get_db()

    total_employees = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]

    present_today = conn.execute(
        'SELECT COUNT(*) FROM attendance WHERE date = date("now") AND status = "present"'
    ).fetchone()[0]

    pending_leaves = conn.execute(
        'SELECT COUNT(*) FROM time_off WHERE status = "pending"'
    ).fetchone()[0]

    # ── Total payroll ever paid (historical cumulative) ───────────────────────
    total_payroll_row = conn.execute(
        'SELECT COALESCE(SUM(net_salary), 0) FROM payroll WHERE status = "paid"'
    ).fetchone()
    total_payroll = total_payroll_row[0] if total_payroll_row else 0

    # ── Monthly Payroll Cost: current month's payroll spend ───────────────────
    # This is used for the 4th stat card on the Dashboard ("Monthly Payroll Cost")
    monthly_payroll_cost_row = conn.execute('''
        SELECT COALESCE(SUM(net_salary), 0)
        FROM payroll
        WHERE year  = CAST(strftime('%Y', 'now') AS INTEGER)
          AND month = CAST(strftime('%m', 'now') AS INTEGER)
    ''').fetchone()
    monthly_payroll_cost = monthly_payroll_cost_row[0] if monthly_payroll_cost_row else 0

    # Monthly payroll aggregation (last 12 months)
    monthly_rows = conn.execute('''
        SELECT
            year || '-' || printf('%02d', month) AS month,
            COALESCE(SUM(net_salary), 0) AS total_payroll
        FROM payroll
        GROUP BY year, month
        ORDER BY year DESC, month DESC
        LIMIT 12
    ''').fetchall()
    monthly_payroll = [dict(r) for r in monthly_rows]

    # Real department distribution
    dept_rows = conn.execute('''
        SELECT department AS name, COUNT(*) AS count
        FROM users
        WHERE department IS NOT NULL AND department != ''
        GROUP BY department
        ORDER BY count DESC
    ''').fetchall()
    department_distribution = [dict(r) for r in dept_rows]

    # Attendance trend: last 7 days
    att_trend = conn.execute('''
        SELECT date AS name,
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN status = 'absent'  THEN 1 ELSE 0 END) AS absent,
               SUM(CASE WHEN status = 'leave'   THEN 1 ELSE 0 END) AS on_leave
        FROM attendance
        WHERE date >= date('now', '-7 days')
        GROUP BY date
        ORDER BY date ASC
    ''').fetchall()
    attendance_trend = [dict(r) for r in att_trend]

    return jsonify({
        'totalEmployees':         total_employees,
        'presentToday':           present_today,
        'pendingLeaves':          pending_leaves,
        'totalPayroll':           total_payroll,
        'monthlyPayrollCost':     monthly_payroll_cost,   # ✅ new field for Dashboard card
        'monthlyPayroll':         monthly_payroll,
        'departmentDistribution': department_distribution,
        'attendanceTrend':        attendance_trend,
    })


# ── Settings / User Management (Admin only) ──────────────────────────────────

@misc_bp.route('/settings/users', methods=['GET'])
@token_required
def get_settings_users(current_user):
    """Admin only: list all users for role management in Settings."""
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    conn  = get_db()
    users = conn.execute(
        'SELECT id, login_id, first_name, last_name, email, role, department, status FROM users'
    ).fetchall()
    return jsonify({'users': [dict(u) for u in users]})


@misc_bp.route('/settings/users/<int:user_id>/role', methods=['PUT'])
@token_required
def settings_update_role(current_user, user_id):
    """Admin only: update a user's role from the Settings page."""
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin access required'}), 403

    data     = request.json
    new_role = data.get('role')
    if new_role not in ['admin', 'hr_officer', 'payroll_officer', 'employee']:
        return jsonify({'error': 'Invalid role'}), 400

    conn = get_db()
    conn.execute('UPDATE users SET role = ? WHERE id = ?', (new_role, user_id))
    conn.commit()
    return jsonify({'message': f'Role updated to {new_role}'})


# ── Documents ─────────────────────────────────────────────────────────────────

@misc_bp.route('/documents', methods=['GET'])
@token_required
def get_documents(current_user):
    conn = get_db()
    docs = conn.execute(
        'SELECT * FROM documents WHERE user_id = ?', (current_user['id'],)
    ).fetchall()
    return jsonify({'documents': [dict(d) for d in docs]})


@misc_bp.route('/documents', methods=['POST'])
@token_required
def upload_document(current_user):
    data     = request.json
    name     = data.get('name')
    doc_type = data.get('type')
    url      = data.get('url')

    if not all([name, doc_type, url]):
        return jsonify({'error': 'name, type, and url are required'}), 400

    conn = get_db()
    conn.execute(
        'INSERT INTO documents (user_id, name, type, url) VALUES (?, ?, ?, ?)',
        (current_user['id'], name, doc_type, url)
    )
    conn.commit()
    return jsonify({'message': 'Document uploaded'})

# ── Announcements ─────────────────────────────────────────────────────────────

@misc_bp.route('/announcements', methods=['GET'])
@token_required
def get_announcements(current_user):
    conn = get_db()
    rows = conn.execute('''
        SELECT a.*, u.first_name || ' ' || u.last_name AS author
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
    ''').fetchall()
    return jsonify({'announcements': [dict(r) for r in rows]})


@misc_bp.route('/announcements', methods=['POST'])
@token_required
def create_announcement(current_user):
    if current_user['role'] != ADMIN:
        return jsonify({'error': 'Admin only'}), 403
    data  = request.json
    title = data.get('title', '').strip()
    body  = data.get('body', '').strip()
    if not title or not body:
        return jsonify({'error': 'title and body required'}), 400
    conn  = get_db()
    conn.execute(
        'INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)',
        (title, body, current_user['id'])
    )
    conn.commit()
    return jsonify({'message': 'Announcement posted'})

# ── Notifications ─────────────────────────────────────────────────────────────

@misc_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    conn = get_db()
    # Admins/HR/Payroll see all activity, Employees see their own
    if current_user['role'] in [ADMIN, HR, PAYROLL]:
        rows = conn.execute('''
            SELECT n.*, u.first_name || ' ' || u.last_name AS user_name
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
            LIMIT 50
        ''').fetchall()
    else:
        rows = conn.execute('''
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ''', (current_user['id'],)).fetchall()
    
    return jsonify({'notifications': [dict(r) for r in rows]})

@misc_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_read(current_user, notif_id):
    conn = get_db()
    conn.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', (notif_id,))
    conn.commit()
    return jsonify({'success': True})

@misc_bp.route('/notifications/read-all', methods=['PUT'])
@token_required
def mark_all_read(current_user):
    conn = get_db()
    conn.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', (current_user['id'],))
    conn.commit()
    return jsonify({'success': True})