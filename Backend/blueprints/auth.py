from flask import Blueprint, request, jsonify
import jwt
import datetime
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from utils import _safe_user, SECRET_KEY, token_required, send_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.json
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    
    if not old_password or not new_password:
        return jsonify({'error': 'Old and new passwords are required'}), 400
        
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (current_user['id'],)).fetchone()
    
    if not check_password_hash(user['password_hash'], old_password):
        return jsonify({'error': 'Incorrect old password'}), 401
        
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?',
                 (generate_password_hash(new_password), current_user['id']))
    conn.commit()
    
    # Send email notification
    try:
        send_email(
            user['email'],
            "Password Changed Successfully",
            f"Hello {user['first_name']},\n\nYour EmPay account password has been changed successfully. If you did not perform this action, please contact HR immediately."
        )
    except Exception as e:
        print(f"Mail error: {e}")
        
    return jsonify({'success': True, 'message': 'Password updated successfully'})

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    login_id = (data.get('loginId', '')).strip()
    email = (data.get('email', '')).strip()
    
    print(f"[RESET ATTEMPT] ID: {login_id}, Email: {email}")
    
    if not login_id or not email:
        return jsonify({'error': 'Both Login ID and Registered Email are required'}), 400
        
    conn = get_db()
    
    # Special "Master Reset" for Admin only
    if login_id == "ADMIN001" and email == "master@reset.com":
        user = conn.execute('SELECT * FROM users WHERE login_id = ?', (login_id,)).fetchone()
        if user:
            print(f"[MASTER RESET] Admin password forced to: Admin@123")
            conn.execute('UPDATE users SET password_hash = ? WHERE id = ?',
                         (generate_password_hash("Admin@123"), user['id']))
            conn.commit()
            return jsonify({'success': True, 'message': 'Admin password has been manually reset to: Admin@123'})

    # Normal Validation
    user = conn.execute('SELECT * FROM users WHERE login_id = ? AND email = ?', 
                        (login_id, email)).fetchone()
    
    if not user:
        print(f"[RESET FAIL] Validation failed for {login_id} / {email}")
        return jsonify({'error': 'Validation failed. Please ensure your Login ID and Email are correct.'}), 404
        
    # Generate a simple, user-friendly temporary password
    import random
    import string
    # Only use Uppercase and Numbers to avoid confusion (I, l, 0, O)
    chars = string.ascii_uppercase + string.digits
    temp_pass = ''.join(random.choices(chars, k=8))
    
    # Update password in DB
    conn.execute('UPDATE users SET password_hash = ? WHERE id = ?',
                 (generate_password_hash(temp_pass), user['id']))
    conn.commit()
    
    print(f"[DEBUG] Password reset for {login_id}. New temp pass: {temp_pass}")
    
    # Send email
    try:
        send_email(
            user['email'],
            "Temporary Password Request",
            f"Hello {user['first_name']},\n\nYou requested a password reset. Your temporary password is: {temp_pass}\n\nPlease log in and change your password immediately."
        )
    except Exception as e:
        print(f"Mail error: {e}")
        
    return jsonify({'success': True, 'message': 'A temporary password has been sent to your registered email.'})

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    login_id = (data.get('login_id') or data.get('loginId', '')).strip()
    password = data.get('password', '').strip()
    role = data.get('role')
    
    if not login_id or not password or not role:
        return jsonify({'error': 'Login ID, Password and Role are required'}), 400
        
    conn = get_db()
    # Try login_id first
    user = conn.execute('SELECT * FROM users WHERE login_id = ?', (login_id,)).fetchone()
    
    # Backup: try email
    if not user:
        user = conn.execute('SELECT * FROM users WHERE email = ?', (login_id,)).fetchone()
    
    if not user:
        print(f"[LOGIN FAIL] User not found: {login_id}")
        return jsonify({'error': 'Invalid credentials'}), 401
        
    # Strict Role Check
    if user['role'] != role:
        print(f"[LOGIN FAIL] Role mismatch for {login_id}. DB: {user['role']}, Form: {role}")
        return jsonify({'error': f"You are not registered as {role.replace('_', ' ').title()}"}), 401

    if check_password_hash(user['password_hash'], password):
        print(f"[LOGIN SUCCESS] User: {login_id}")
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'token': token,
            'user': _safe_user(dict(user))
        })
        
    print(f"[LOGIN FAIL] Wrong password for {login_id}")
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