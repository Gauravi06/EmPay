from flask import Flask, jsonify
from flask_cors import CORS
import os

from database import init_db
from blueprints.auth import auth_bp
from blueprints.employees import employees_bp
from blueprints.attendance import attendance_bp
from blueprints.time_off import time_off_bp
from blueprints.payroll import payroll_bp
from blueprints.misc import misc_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.config['SECRET_KEY'] = 'empay-secret-key-123'
    app.config['DATABASE'] = 'empay.db'

    init_db(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(employees_bp, url_prefix='/api/employees')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(time_off_bp, url_prefix='/api/time-off')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    app.register_blueprint(misc_bp, url_prefix='/api')

    @app.route('/')
    def index():
        return jsonify({
            'name': 'EmPay API',
            'version': '2.0.0',
            'status': 'Running',
            'modules': ['auth', 'employees', 'attendance', 'payroll', 'time_off', 'reports']
        })

    return app

app = create_app()

if __name__ == '__main__':
    print("EmPay Backend v2.0 starting...")
    app.run(debug=True, port=5000)