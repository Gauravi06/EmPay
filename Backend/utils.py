import jwt
import datetime
import json
from functools import wraps
from flask import request, jsonify

SECRET_KEY = 'empay-secret-key-123'

def _to_camel(snake):
    components = snake.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def _safe_user(u):
    if not u: return None
    safe_raw = {k: v for k, v in u.items() if k not in ('password_hash', 'temp_password')}
    safe = {}
    for k, v in safe_raw.items():
        camel_key = _to_camel(k)
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