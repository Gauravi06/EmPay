from flask import Blueprint, request, jsonify
import jwt
import datetime
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from utils import _safe_user, SECRET_KEY, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    login_id = data.get('login_id') or data.get('loginId')
    password = data.get('password')
    
    if not login_id or not password:
        return jsonify({'error': 'Login ID and Password are required'}), 400
        
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE login_id = ?', (login_id,)).fetchone()
    if not user:
        user = conn.execute('SELECT * FROM users WHERE email = ?', (login_id,)).fetchone()

    if user and check_password_hash(user['password_hash'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({'token': token, 'user': _safe_user(dict(user))})
        
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'user': _safe_user(current_user)})

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.json
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    
    if not old_password or not new_password:
        return jsonify({'error': 'Old and new passwords required'}), 400
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],)).fetchone()
    
    if not check_password_hash(user['password_hash'], old_password):
        return jsonify({'error': 'Old password is incorrect'}), 400
    
    new_hash = generate_password_hash(new_password)
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, current_user['id']))
    conn.commit()
    return jsonify({'success': True, 'message': 'Password updated successfully'})

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    conn = get_db()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name') or data.get('firstName')
    last_name = data.get('last_name') or data.get('lastName')
    phone = data.get('phone')
    company_name = data.get('company_name') or data.get('companyName')
    department = data.get('department', 'General')
    location = data.get('location', 'Head Office')

    if not email or not password or not first_name:
        return jsonify({'error': 'Required fields missing'}), 400

    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        return jsonify({'error': 'User with this email already exists'}), 400

    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    role = 'admin' if user_count == 0 else 'employee'
    login_id = f"EMP{str(user_count + 1).zfill(3)}"
    password_hash = generate_password_hash(password)
    
    try:
        cursor = conn.execute('''
            INSERT INTO users (login_id, password_hash, first_name, last_name, email, phone, role, department, location, company_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (login_id, password_hash, first_name, last_name, email, phone, role, department, location, company_name))
        conn.commit()
        user_id = cursor.lastrowid
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({'message': 'User registered successfully', 'token': token, 'user': _safe_user(dict(user))}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({'error': f"Integrity error: {str(e)}"}), 400