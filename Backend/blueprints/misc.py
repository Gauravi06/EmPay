from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required, admin_required

misc_bp = Blueprint('misc', __name__)

@misc_bp.route('/reports/summary', methods=['GET'])
@token_required
@admin_required
def get_summary_report(current_user):
    conn = get_db()
    total_employees = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    present_today = conn.execute('SELECT COUNT(*) FROM attendance WHERE date = date("now") AND status = "present"').fetchone()[0]
    pending_leaves = conn.execute('SELECT COUNT(*) FROM time_off WHERE status = "pending"').fetchone()[0]
    
    dept_rows = conn.execute(
        'SELECT department, COUNT(*) as count FROM users GROUP BY department'
    ).fetchall()
    department_stats = [{'name': r['department'], 'count': r['count']} for r in dept_rows]

    return jsonify({
        'totalEmployees': total_employees,
        'presentToday': present_today,
        'pendingLeaves': pending_leaves,
        'departmentStats': department_stats
    })

@misc_bp.route('/documents', methods=['GET'])
@token_required
def get_documents(current_user):
    conn = get_db()
    docs = conn.execute('SELECT * FROM documents WHERE user_id = ?', (current_user['id'],)).fetchall()
    return jsonify({'documents': [dict(d) for d in docs]})

@misc_bp.route('/documents', methods=['POST'])
@token_required
def upload_document(current_user):
    data = request.json
    name = data.get('name')
    doc_type = data.get('type')
    url = data.get('url')
    
    if not all([name, doc_type, url]):
        return jsonify({'error': 'Missing fields'}), 400
        
    conn = get_db()
    conn.execute('INSERT INTO documents (user_id, name, type, url) VALUES (?, ?, ?, ?)',
                (current_user['id'], name, doc_type, url))
    conn.commit()
    return jsonify({'message': 'Document uploaded'})