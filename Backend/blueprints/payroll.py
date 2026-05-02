from flask import Blueprint, request, jsonify
from database import get_db
from utils import token_required, admin_required

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('', methods=['GET'])
@token_required
def get_payroll(current_user):
    employee_id = request.args.get('employee_id', current_user['id'])
    year = request.args.get('year')
    month = request.args.get('month')
    
    if current_user['role'] != 'admin' and int(employee_id) != current_user['id']:
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db()
    query = 'SELECT * FROM payroll WHERE user_id = ?'
    params = [employee_id]
    
    if year:
        query += " AND year = ?"
        params.append(year)
    if month:
        query += " AND month = ?"
        params.append(month)
        
    records = conn.execute(query, params).fetchall()
    return jsonify({'payrolls': [dict(r) for r in records]})

@payroll_bp.route('/generate', methods=['POST'])
@token_required
@admin_required
def generate_payroll(current_user):
    data = request.json
    employee_id = data.get('employee_id')
    month = data.get('month')
    year = data.get('year')
    
    if not all([employee_id, month, year]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (employee_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Simple generation logic
    salary = user['salary'] or 50000
    deductions = salary * 0.12 # PF etc
    net = salary - deductions
    
    conn.execute('''
        INSERT INTO payroll (user_id, month, year, basic_salary, deductions, net_salary, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ''', (employee_id, month, year, salary, deductions, net))
    conn.commit()
    return jsonify({'message': 'Payroll generated successfully'})

@payroll_bp.route('/<int:payroll_id>/status', methods=['PUT'])
@token_required
@admin_required
def update_payroll_status(current_user, payroll_id):
    data = request.json
    status = data.get('status')
    if not status:
        return jsonify({'error': 'Status is required'}), 400
        
    conn = get_db()
    conn.execute('UPDATE payroll SET status = ? WHERE id = ?', (status, payroll_id))
    conn.commit()
    return jsonify({'message': 'Payroll status updated'})
