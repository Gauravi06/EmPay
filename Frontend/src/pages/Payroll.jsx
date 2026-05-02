import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Calendar, Eye, Printer,
  AlertCircle, Users, FileText, Plus, X, Search, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toFixed(2)
const fmtInt = (n) => Number(n || 0).toFixed(0)

const PIE_COLORS = ['#7C3AED', '#38BDF8', '#FB923C', '#10B981', '#F43F5E', '#F59E0B']
const cardStyle = { background: '#fff', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #EBEBF5' }
const btnPrimary = { padding: '12px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 16px rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }
const statusColors = { paid: '#10B981', approved: '#3B82F6', pending: '#F59E0B', draft: '#9CA3AF' }

const StatCard = ({ title, value, icon, badge, badgeColor }) => (
  <motion.div whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }} transition={{ type: "spring", stiffness: 300 }}
    style={{ ...cardStyle, flex: 1, minWidth: 260 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: badgeColor + '15', color: badgeColor, border: `1px solid ${badgeColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{badge}</span>
    </div>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
  </motion.div>
)

const Payroll = () => {
  const {
    user, fetchEmployees, fetchPayrolls, generatePayroll,
    updatePayrollStatus, hasPermission
  } = useAuthStore()

  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [showPayslip, setShowPayslip] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER
  const canGeneratePayroll = hasPermission(MODULES.PAYROLL, PERMISSIONS.CREATE)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pList, eList] = await Promise.all([
        fetchPayrolls(),
        fetchEmployees()
      ])
      setPayrolls(pList || [])
      setEmployees(eList || [])
    } catch (e) {
      toast.error('Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }, [fetchPayrolls, fetchEmployees])

  useEffect(() => { if (user) loadData() }, [loadData, user])

  const filteredPayrolls = payrolls.filter(p => {
    if (searchTerm && !p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (selectedEmployee && p.user_id !== selectedEmployee.id) return false
    return true
  })

  const handleGeneratePayroll = async () => {
    const targetEmployee = selectedEmployee
    if (!targetEmployee) { toast.error('Please select an employee first'); return }

    const existing = payrolls.find(p =>
      p.user_id === targetEmployee.id &&
      p.year === selectedYear &&
      p.month === selectedMonth
    )
    if (existing) {
      const mn = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })
      toast.error(`Payroll already exists for ${mn} ${selectedYear}`)
      return
    }

    setGenerating(true)
    try {
      await generatePayroll(targetEmployee.id, selectedYear, selectedMonth)
      toast.success(`Payroll generated for ${targetEmployee.first_name}`)
      loadData()
    } catch (e) {
      toast.error(e.message || 'Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  const handlePrintPayslip = (p) => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Payslip - ${p.employee_name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        body{font-family:'Inter', sans-serif;margin:60px;color:#1e293b;line-height:1.5}
        .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #7c3aed;padding-bottom:20px}
        h1{color:#7c3aed;font-weight:900;margin:0;font-size:32px;letter-spacing:-1px}
        .period{color:#64748b;font-weight:600;margin-top:5px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:30px 0;background:#f8fafc;padding:25px;border-radius:15px}
        .info-item{display:flex;flex-direction:column}
        .label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em}
        .value{font-weight:700;color:#0f172a;font-size:15px;margin-top:4px}
        table{width:100%;border-collapse:collapse;margin:30px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:10px;overflow:hidden}
        th,td{padding:15px;text-align:left;border-bottom:1px solid #f1f5f9}
        th{background:#f1f5f9;font-weight:800;color:#64748b;font-size:11px;text-transform:uppercase}
        .right{text-align:right}
        .total-row{background:#fffbeb;font-weight:800}
        .net-pay-box{margin-top:40px;padding:30px;background:linear-gradient(135deg, #7c3aed, #6d28d9);color:white;border-radius:20px;text-align:right}
        .net-label{font-size:12px;font-weight:700;opacity:0.8;text-transform:uppercase}
        .net-value{font-size:36px;font-weight:900;margin-top:5px}
        .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:60px;border-top:1px solid #f1f5f9;padding-top:20px}
        @media print{button{display:none} body{margin:20px}}
      </style></head><body>
      <div class="header">
        <h1>EmPay</h1>
        <div class="period">Salary Slip: ${p.period}</div>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="label">Employee</span><span class="value">${p.employee_name}</span></div>
        <div class="info-item"><span class="label">Emp Code</span><span class="value">${p.employee_code}</span></div>
        <div class="info-item"><span class="label">Department</span><span class="value">${p.department || 'General'}</span></div>
        <div class="info-item"><span class="label">Location</span><span class="value">${p.location || 'Head Office'}</span></div>
        <div class="info-item"><span class="label">UAN No</span><span class="value">${p.uan || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Days Worked</span><span class="value">${p.days_present}/${p.working_days}</span></div>
      </div>
      <table>
        <thead>
          <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
          <tr><th>Component</th><th class="right">Amount</th><th>Component</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>
          <tr><td>Basic Salary</td><td class="right">₹${fmt(p.basic_salary)}</td><td>PF Employee</td><td class="right">₹${fmt(p.pf_employee)}</td></tr>
          <tr><td>HRA</td><td class="right">₹${fmt(p.house_rent_allowance)}</td><td>Professional Tax</td><td class="right">₹${fmt(p.professional_tax)}</td></tr>
          <tr><td>Standard Allowance</td><td class="right">₹${fmt(p.standard_allowance)}</td><td>TDS</td><td class="right">₹${fmt(p.tds)}</td></tr>
          <tr><td>Performance Bonus</td><td class="right">₹${fmt(p.performance_bonus)}</td><td></td><td></td></tr>
          <tr><td>LTA</td><td class="right">₹${fmt(p.leave_travel_allowance)}</td><td></td><td></td></tr>
          <tr class="total-row"><td>Gross Total</td><td class="right">₹${fmt(p.gross_wage)}</td><td>Total Deductions</td><td class="right">₹${fmt(p.total_deductions)}</td></tr>
        </tbody>
      </table>
      <div class="net-pay-box">
        <div class="net-label">Net Payable Amount</div>
        <div class="net-value">₹${fmt(p.net_pay)}</div>
        <div style="font-size:12px;opacity:0.7;margin-top:5px">(Gross Earnings - Total Deductions)</div>
      </div>
      <div class="footer">
        <p>This is a computer generated document and does not require a physical signature.</p>
        <p>© 2024 EmPay HRMS. All rights reserved.</p>
      </div>
      <br><button onclick="window.print()" style="padding:12px 24px;background:#7c3aed;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;display:block;margin:0 auto">Print Payslip</button>
      </body></html>`)
    win.document.close()
  }

  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const mp = payrolls.filter(p => p.year === selectedYear && p.month === i + 1)
    return {
      month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
      gross: mp.reduce((s, p) => s + (p.gross_wage || 0), 0),
      net: mp.reduce((s, p) => s + (p.net_pay || 0), 0),
      deductions: mp.reduce((s, p) => s + (p.total_deductions || 0), 0)
    }
  })

  const deptMap = employees.reduce((acc, e) => {
    const d = e.department || 'General'
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(deptMap).map(([name, value], i) => ({
    name, value, color: PIE_COLORS[i % PIE_COLORS.length]
  }))

  const currentMonthGross = monthlyChartData[new Date().getMonth()]?.gross || 0
  const thisMonthCount = payrolls.filter(p => p.year === selectedYear && p.month === selectedMonth).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, transition: 'margin-left 0.3s' }}>
        <Header />
        <main style={{ padding: '96px 32px 40px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: 36, fontVariationSettings: '"wght" 900', color: '#0F172A', margin: 0, letterSpacing: '-1.5px' }}>
                Payroll Management
              </motion.h1>
              <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: 16, fontWeight: 500 }}>Process salaries and visualize payroll distribution</p>
            </div>
            {canGeneratePayroll && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleGeneratePayroll} disabled={generating}
                style={{ ...btnPrimary, opacity: generating ? 0.7 : 1 }}>
                {generating ? <Sparkles size={16} className="animate-spin" /> : <Plus size={16} />}
                {generating ? 'Processing...' : 'Generate Payroll'}
              </motion.button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            <StatCard title="Team Strength" value={employees.length} icon="👥" badge="Active" badgeColor="#10B981" />
            <StatCard title="Monthly Budget" value={`₹${(currentMonthGross / 1000).toFixed(1)}k`} icon="💰" badge="Gross" badgeColor="#3B82F6" />
            <StatCard title="Records Vault" value={payrolls.length} icon="📄" badge="Total" badgeColor="#7C3AED" />
            <StatCard title="Monthly Cycle" value={thisMonthCount} icon="📅" badge={thisMonthCount > 0 ? 'Cycle Active' : 'Waiting'} badgeColor={thisMonthCount > 0 ? '#10B981' : '#F59E0B'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 32 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, transparent 80%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Financial Pulse</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>Historical payroll trends for {selectedYear}</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ l: 'Gross', c: '#7C3AED' }, { l: 'Net', c: '#10B981' }, { l: 'Deductions', c: '#F43F5E' }].map(x => (
                    <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: x.c, textTransform: 'uppercase' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity={0.2} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0} /></linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ stroke: '#EBEBF5', strokeWidth: 2 }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }} />
                  <Area type="monotone" dataKey="gross" stroke="#7C3AED" strokeWidth={3} fill="url(#grossGrad)" name="Gross" />
                  <Area type="monotone" dataKey="net" stroke="#10B981" strokeWidth={2} fill="url(#netGrad)" name="Net Pay" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={cardStyle}>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 4 }}>Talent Mix</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20, fontWeight: 500 }}>Dept-wise headcount distribution</div>
              <div style={{ position: 'relative', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={85} dataKey="value" stroke="none">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>{employees.length}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Experts</div>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1E293B' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 24, padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
              <FilterSelect label="Cycle Year" value={selectedYear} options={[2024, 2025, 2026]} onChange={v => setSelectedYear(parseInt(v))} />
              <FilterSelect label="Payroll Month" value={selectedMonth} options={Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: new Date(2024, i).toLocaleString('default', { month: 'long' }) }))} onChange={v => setSelectedMonth(parseInt(v))} />
              {isAdminOrPayroll && (
                <div style={{ flex: 1, minWidth: 240 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Employee</label>
                  <select value={selectedEmployee?.id || ''}
                    onChange={e => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)) || null)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237C3AED%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                    <option value="">Select an employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ flex: 1.5, minWidth: 260 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filter Records</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#7C3AED' }} />
                  <input type="text" placeholder="Search by name, code or period..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 600, color: '#1E293B', outline: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>Payroll Vault</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', background: '#F5F3FF', padding: '6px 14px', borderRadius: 12 }}>{filteredPayrolls.length} Active Records</span>
            </div>
            {loading ? (
              <div style={{ padding: 64, textAlign: 'center', color: '#94A3B8', fontSize: 14, fontWeight: 700 }}>Synchronizing data...</div>
            ) : filteredPayrolls.length === 0 ? (
              <div style={{ padding: 80, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <FileText size={40} style={{ color: '#D1D5DB' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>No Payroll Records</div>
                <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>Ready to start the cycle? Select an employee above.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      {['Team Member', 'Period', 'Basic', 'Gross', 'Deductions', 'Net Pay', 'Status', 'Actions'].map((h, i) => (
                        <th key={h} style={{ textAlign: i === 0 || i === 1 ? 'left' : i >= 6 ? 'center' : 'right', fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 28px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrolls.map((p, i) => {
                      const sc = statusColors[p.status] || statusColors.draft
                      return (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                          key={p.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 28px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>
                                {(p.employee_name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{p.employee_name}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{p.employee_code}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{p.period}</td>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 800, color: '#475569', textAlign: 'right' }}>₹{fmtInt(p.basic_salary)}</td>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 900, color: '#10B981', textAlign: 'right' }}>₹{fmtInt(p.gross_wage)}</td>
                          <td style={{ padding: '16px 28px', fontSize: 14, fontWeight: 800, color: '#F43F5E', textAlign: 'right' }}>₹{fmtInt(p.total_deductions)}</td>
                          <td style={{ padding: '16px 28px', fontSize: 16, fontWeight: 900, color: '#7C3AED', textAlign: 'right' }}>₹{fmtInt(p.net_pay)}</td>
                          <td style={{ padding: '16px 28px', textAlign: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: sc, background: sc + '12', padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', border: `1px solid ${sc}25` }}>
                              {p.status || 'Draft'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 28px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                              <ActionBtn onClick={() => { setSelectedPayroll(p); setShowPayslip(true) }} icon={<Eye size={16} />} color="#7C3AED" bg="#F5F3FF" />
                              <ActionBtn onClick={() => handlePrintPayslip(p)} icon={<Printer size={16} />} color="#64748B" bg="#F8FAFC" />
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showPayslip && selectedPayroll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
            onClick={() => setShowPayslip(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              style={{ background: '#fff', borderRadius: 32, boxShadow: '0 40px 100px rgba(0,0,0,0.25)', maxWidth: 880, width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}
              onClick={e => e.stopPropagation()}>
              
              <div style={{ padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(124,58,237,0.3)' }}>
                      <Sparkles color="#fff" size={28} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Salary Statement</h2>
                      <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14, fontWeight: 600 }}>Period: {selectedPayroll.period}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayslip(false)} style={{ width: 44, height: 44, borderRadius: 16, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 40, padding: 32, background: '#F8FAFC', borderRadius: 24, border: '1px solid #EBEBF5' }}>
                  <InfoItem label="Member Name" val={selectedPayroll.employee_name} />
                  <InfoItem label="Employee Code" val={selectedPayroll.employee_code} />
                  <InfoItem label="Department" val={selectedPayroll.department || 'General'} />
                  <InfoItem label="Location" val={selectedPayroll.location || 'Head Office'} />
                  <InfoItem label="UAN Number" val={selectedPayroll.uan || 'N/A'} />
                  <InfoItem label="Days Count" val={`${selectedPayroll.days_present}/${selectedPayroll.working_days}`} />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#7C3AED', fontSize: 13, fontWeight: 900 }}>EARNINGS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#7C3AED', fontSize: 13, fontWeight: 900 }}>AMOUNT</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#F43F5E', fontSize: 13, fontWeight: 900 }}>DEDUCTIONS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#F43F5E', fontSize: 13, fontWeight: 900 }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Basic Salary', selectedPayroll.basic_salary, 'PF Employee', selectedPayroll.pf_employee],
                      ['House Rent Allowance', selectedPayroll.house_rent_allowance, 'Professional Tax', selectedPayroll.professional_tax],
                      ['Standard Allowance', selectedPayroll.standard_allowance, 'Income Tax (TDS)', selectedPayroll.tds],
                      ['Performance Bonus', selectedPayroll.performance_bonus, '', null],
                      ['Travel Allowance', selectedPayroll.leave_travel_allowance, '', null],
                    ].map(([e1, v1, e2, v2], i) => (
                      <tr key={i}>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{e1}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#10B981', textAlign: 'right' }}>₹{fmt(v1)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{e2}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#F43F5E', textAlign: 'right' }}>{v2 !== null ? `₹${fmt(v2)}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F8FAFC', borderTop: '2px solid #EBEBF5' }}>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900 }}>Gross Total</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900, color: '#10B981', textAlign: 'right' }}>₹{fmt(selectedPayroll.gross_wage)}</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900 }}>Total Deductions</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900, color: '#F43F5E', textAlign: 'right' }}>₹{fmt(selectedPayroll.total_deductions)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ padding: 32, background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', borderRadius: 24, textAlign: 'right', boxShadow: '0 20px 40px rgba(124,58,237,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Net Payable Amount</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginTop: 8 }}>₹{fmt(selectedPayroll.net_pay)}</div>
                </div>

                <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                  <button onClick={() => handlePrintPayslip(selectedPayroll)} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', height: 56, fontSize: 16 }}>
                    <Printer size={20} /> Print Statement
                  </button>
                  <button onClick={() => setShowPayslip(false)} style={{ flex: 1, height: 56, borderRadius: 14, border: '2px solid #F1F5F9', background: '#fff', color: '#64748B', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FilterSelect = ({ label, value, options, onChange }) => (
  <div style={{ minWidth: 140 }}>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}>
      {options.map(opt => typeof opt === 'object' ? <option key={opt.v} value={opt.v}>{opt.l}</option> : <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
)

const ActionBtn = ({ onClick, icon, color, bg }) => (
  <button onClick={onClick} style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: bg, color: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
    {icon}
  </button>
)

const InfoItem = ({ label, val }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{val}</div>
  </div>
)

export default Payroll