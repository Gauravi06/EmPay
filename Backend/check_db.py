
import sqlite3
import datetime

conn = sqlite3.connect('empay.db')
conn.row_factory = sqlite3.Row
now = datetime.datetime.now()
month = now.month
year = now.year

print(f"Current Date: {now.strftime('%Y-%m-%d')}")
print(f"Checking for month: {month}, year: {year}")

# Check payroll counts
rows = conn.execute("SELECT month, year, COUNT(*), SUM(net_salary) FROM payroll GROUP BY month, year").fetchall()
print("\nPayroll Table Summary:")
for r in rows:
    print(dict(r))

# Check specific current month
curr = conn.execute("SELECT COUNT(*), SUM(net_salary) FROM payroll WHERE month = ? AND year = ?", (month, year)).fetchone()
print(f"\nCurrent Month ({month}/{year}) Payroll:")
print(dict(curr))

conn.close()
