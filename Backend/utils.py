import jwt
import datetime
import json
from functools import wraps
from flask import request, jsonify, current_app

SECRET_KEY = 'empay-secret-key-123' # Should be in config

def _to_camel(snake):
    """Convert snake_case to camelCase."""
    components = snake.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def _safe_user(u):
    """Strip password_hash and convert keys to camelCase."""
    if not u: return None
    
    # Base safe dict without password
    safe_raw = {k: v for k, v in u.items() if k not in ('password_hash', 'temp_password')}
    
    # Convert all keys to camelCase for frontend
    safe = {}
    for k, v in safe_raw.items():
        camel_key = _to_camel(k)
        # Parse JSON fields
        if k in ('bank_details', 'salary_components', 'time_off_used') and v and isinstance(v, str):
            try:
                safe[camel_key] = json.loads(v)
            except Exception:
                safe[camel_key] = v
        else:
            safe[camel_key] = v
            
    return safe

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            from database import get_db
            conn = get_db()
            user = conn.execute('SELECT * FROM users WHERE id = ?', (data['user_id'],)).fetchone()
            if not user:
                return jsonify({'error': 'User not found'}), 401
            current_user = _safe_user(dict(user))
        except Exception as e:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user['role'] not in roles:
                return jsonify({'error': 'Access denied'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

# --- EMAIL CONFIGURATION ---
# Set TEST_MODE = False to use your real Gmail
TEST_MODE = False 

if TEST_MODE:
    # Virtual Testing Inbox (Check at: https://ethereal.email/messages)
    SMTP_SERVER = "smtp.ethereal.email"
    SMTP_PORT = 587
    SMTP_USER = "randy.gibson72@ethereal.email"
    SMTP_PASS = "Fw7CDsYapz8eM6s9Hr"
else:
    # Real Gmail Mode
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USER = "swanu647@gmail.com"  # ✅ Your Gmail
    SMTP_PASS = "jvqe iqbo qqyu urvl"  # ✅ Your New App Password
# ---------------------------

def send_email(to_email, subject, body):
    """
    Sends a real email notification via SMTP.
    """
    import smtplib
    from email.mime.text import MIMEText
    
    # Always log to console for debugging
    print(f"\n[ATTEMPTING EMAIL] To: {to_email} | Subject: {subject}")
    
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        
        # Connect and send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            
        print(f"[SUCCESS] Email sent to {to_email}\n")
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        print(f"Check your SMTP_USER and SMTP_PASS in Backend/utils.py\n")

def add_notification(user_id, title, message, type='info'):
    """
    Creates a new notification record in the database.
    """
    from database import get_db
    try:
        conn = get_db()
        conn.execute('''
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, ?)
        ''', (user_id, title, message, type))
        conn.commit()
    except Exception as e:
        print(f"[ERROR] add_notification: {e}")
