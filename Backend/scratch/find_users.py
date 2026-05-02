import sqlite3
conn = sqlite3.connect('empay.db')
conn.row_factory = sqlite3.Row

def find_user(role):
    u = conn.execute("SELECT login_id, email FROM users WHERE role=? LIMIT 1", (role,)).fetchone()
    if u:
        return {"login_id": u['login_id'], "email": u['email']}
    return None

print("Employee:", find_user('employee'))
print("HR:", find_user('hr_officer'))
conn.close()
