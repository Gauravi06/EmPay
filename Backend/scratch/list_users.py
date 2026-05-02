import sqlite3
conn = sqlite3.connect('empay.db')
cursor = conn.cursor()
cursor.execute("SELECT login_id, email, role FROM users")
rows = cursor.fetchall()
for row in rows:
    print(f"ID: {row[0]}, Email: {row[1]}, Role: {row[2]}")
conn.close()
