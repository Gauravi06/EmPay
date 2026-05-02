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
    # Try login_id first
    user = conn.execute('SELECT * FROM users WHERE login_id = ?', (login_id,)).fetchone()
    
    # Backup: try email
    if not user:
        user = conn.execute('SELECT * FROM users WHERE email = ?', (login_id,)).fetchone()

    if user and check_password_hash(user['password_hash'], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': _safe_user(dict(user))
        })
        
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    # current_user is already sanitized by token_required, return it directly
    return jsonify({'user': current_user})

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    required_fields = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email': 'email',
        'password': 'password'
    }
    
    # Validate required fields (checking both snake and camel case)
    for snake, camel in required_fields.items():
        if not data.get(snake) and not data.get(camel):
            return jsonify({'error': f'{camel} is required'}), 400

    conn = get_db()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name') or data.get('firstName')
    last_name = data.get('last_name') or data.get('lastName')
    phone = data.get('phone')
    company_name = data.get('company_name') or data.get('companyName')
    department = data.get('department', 'General')
    location = data.get('location', 'Head Office')

    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        return jsonify({'error': 'User with this email already exists'}), 400

    # Auto-assign role: First user is admin, others are employee
    user_count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
    role = 'admin' if user_count == 0 else 'employee'

    # Generate a unique Login ID: EMP001, EMP002...
    # Keep incrementing until we find one that doesn't exist
    n = user_count + 1
    while True:
        candidate = f"EMP{str(n).zfill(3)}"
        if not conn.execute('SELECT id FROM users WHERE login_id = ?', (candidate,)).fetchone():
            break
        n += 1
    login_id = candidate
    
    password_hash = generate_password_hash(password)
    
    try:
        cursor = conn.execute('''
            INSERT INTO users (login_id, password_hash, first_name, last_name, email, phone, role, department, location, company_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            login_id, password_hash, first_name, last_name,
            email, phone, role, department, location, company_name
        ))
        conn.commit()
        
        user_id = cursor.lastrowid
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': _safe_user(dict(user))
        }), 201
    except sqlite3.IntegrityError as e:
        return jsonify({'error': f"Integrity error: {str(e)}"}), 400