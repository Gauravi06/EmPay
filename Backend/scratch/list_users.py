import sqlite3

def list_users():
    conn = sqlite3.connect('a:/EmpPay/EmPay/Backend/empay.db')
    conn.row_factory = sqlite3.Row
    users = conn.execute("SELECT login_id, email, role, first_name, last_name FROM users").fetchall()
    for u in users:
        print(f"[{u['role'].upper()}] ID: {u['login_id']} | Email: {u['email']} | Name: {u['first_name']} {u['last_name']}")
    conn.close()

if __name__ == "__main__":
    list_users()
