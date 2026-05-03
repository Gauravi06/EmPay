import React, { useState, useRef, useEffect } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, TrendingUp, Users, Calendar, Download, Eye,
  BarChart3, PieChart as PieChartIcon, Printer, Search,
  DollarSign, Briefcase, MapPin, Hash, User, Building,
  ChevronDown, ChevronUp, Sparkles, Target, Zap
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const PIE_COLORS = ['#7C3AED', '#38BDF8', '#FB923C', '#10B981', '#F43F5E', '#F59E0B']
const cardStyle = { background: '#fff', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #EBEBF5' }

const Reports = () => {
  const { user, fetchEmployees, fetchAllPayrolls, fetchReportsSummary, hasPermission } = useAuthStore()
  const [employees, setEmployees] = useState([])
  const [payrolls, setPayrolls] = useState([])
  const [summary, setSummary] = useState({ monthlyBudget: 0 })
  const [reportType, setReportType] = useState('salary')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const printRef = useRef()

  useEffect(() => {
    if (user) {
      Promise.all([fetchEmployees(), fetchAllPayrolls(), fetchReportsSummary()])
        .then(([emps, pays, summ]) => {
          setEmployees(emps || [])
          setPayrolls(pays || [])
          setSummary(summ || { monthlyBudget: 0 })
        })
        .catch((e) => { console.error('Reports load error:', e) })
    }
  }, [user?.id, fetchEmployees, fetchAllPayrolls, fetchReportsSummary])

  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER

  if (!isAdminOrPayroll) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif", alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '48px', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText size={40} style={{ color: '#F43F5E' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginBottom: 8, letterSpacing: '-1px' }}>Access Restricted</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 300, margin: '0 auto' }}>Only administrators and payroll officers can access analytical reports.</div>
        </div>
      </div>
    )
  }

  // Build attendance data from real payroll records
  const attendanceData = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = new Date().getMonth() - 5 + i
    const d = new Date(new Date().getFullYear(), monthIdx, 1)
    const month = d.toLocaleString('default', { month: 'short' })
    const yr = d.getFullYear(), mo = d.getMonth() + 1
    const monthPayrolls = payrolls.filter(p => p.year === yr && p.month === mo)
    const present = monthPayrolls.reduce((s, p) => s + (p.days_present || 0), 0)
    const absent = monthPayrolls.reduce((s, p) => s + ((p.working_days || 22) - (p.days_present || 0)), 0)
    const leave = 0
    return { month, present: present || 0, absent: absent || 0, leave }
  })

  const departmentStats = [
    { name: 'Engineering', employees: 12, attendance: 92, turnover: 5 },
    { name: 'Sales', employees: 8, attendance: 88, turnover: 8 },
    { name: 'HR', employees: 5, attendance: 95, turnover: 0 },
    { name: 'Finance', employees: 6, attendance: 90, turnover: 3 }
  ]

  const getEmployeePayrollData = () => {
    if (!selectedEmployee) return null

    const employeePayrolls = payrolls.filter(p => p.user_id === selectedEmployee.id && p.year === selectedYear)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const payroll = employeePayrolls.find(p => p.month === i + 1)
      return {
        month: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
        basic: payroll?.basic_salary || 0,
        hra: payroll?.house_rent_allowance || 0,
        pf: payroll?.pf_employee || 0,
        net: payroll?.net_pay || 0
      }
    })

    const yearlyTotals = monthlyData.reduce((acc, month) => {
      acc.basic += month.basic
      acc.hra += month.hra
      acc.pf += month.pf
      acc.net += month.net
      return acc
    }, { basic: 0, hra: 0, pf: 0, net: 0 })

    const currentMonthPayroll = employeePayrolls.find(p => p.month === new Date().getMonth() + 1)

    return {
      monthlyData,
      yearlyTotals,
      currentMonthPayroll
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Report - ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        body{font-family:'Inter', sans-serif;margin:60px;color:#1e293b}
        .header{text-align:center;margin-bottom:40px;border-bottom:2px solid #7c3aed;padding-bottom:20px}
        h1{color:#7c3aed;font-weight:900;margin:0;font-size:32px;letter-spacing:-1px}
        .info-grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin:30px 0;background:#f8fafc;padding:25px;border-radius:15px}
        .label{font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase}
        .value{font-weight:700;color:#0f172a;font-size:15px;margin-top:4px}
        table{width:100%;border-collapse:collapse;margin:30px 0}
        th,td{padding:12px;text-align:left;border-bottom:1px solid #f1f5f9}
        th{background:#f1f5f9;font-weight:800;color:#64748b;font-size:11px}
        .right{text-align:right}
        .total-row{background:#fffbeb;font-weight:900;color:#0f172a}
        .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:60px;border-top:1px solid #f1f5f9;padding-top:20px}
        @media print{button{display:none}}
      </style></head><body>${printContent}
      <button onclick="window.print()" style="padding:12px 24px;background:#7c3aed;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:bold;margin:20px auto;display:block">Print Analysis</button>
      </body></html>`)
    printWindow.document.close()
  }

  const payrollData = getEmployeePayrollData()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, transition: 'margin-left 0.3s' }}>
        <Header />
        <main style={{ padding: '96px 32px 40px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1.5px' }}>
                Reports & Analytics
              </motion.h1>
              <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: 16, fontWeight: 500 }}>Advanced organizational data visualization</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
               <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#7C3AED' }}><Zap size={20}/></div>
               <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: '#10B981' }}><Target size={20}/></div>
            </div>
          </div>

          {/* Report Type Selector — Premium Tabs */}
          <div style={{ ...cardStyle, marginBottom: 32, display: 'flex', gap: 12, padding: '12px' }}>
            {[
              { id: 'salary', label: 'Salary Statement', icon: DollarSign, color: '#7C3AED' },
              { id: 'attendance', label: 'Attendance', icon: Calendar, color: '#10B981' },
              { id: 'payroll', label: 'Payroll', icon: TrendingUp, color: '#3B82F6' },
              { id: 'department', label: 'Department', icon: BarChart3, color: '#F59E0B' }
            ].map((type) => (
              <motion.button key={type.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => setReportType(type.id)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  border: 'none', background: reportType === type.id ? type.color : 'transparent',
                  color: reportType === type.id ? '#fff' : '#64748B',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <type.icon size={18} />
                {type.label}
              </motion.button>
            ))}
          </div>

          {/* Report Sections */}
          <AnimatePresence mode="wait">
            
            {/* 1. Salary Statement Report */}
            {reportType === 'salary' && (
              <motion.div key="salary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ ...cardStyle, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}><FileText size={20}/></div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Salary Statement Analysis</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Employee</label>
                      <select value={selectedEmployee?.id || ''}
                        onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)))}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none' }}>
                        <option value="">Select an employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.loginId})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fiscal Year</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none' }}>
                        {[2024, 2025, 2026].map(y => (<option key={y} value={y}>{y}</option>))}
                      </select>
                    </div>
                  </div>
                  {selectedEmployee && payrollData && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={handlePrint}
                        style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 16px rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Printer size={16} /> Print Full Analysis
                      </button>
                    </div>
                  )}
                </div>

                {selectedEmployee && payrollData ? (
                  <div ref={printRef} style={cardStyle}>
                    {/* Branded Header */}
                    <div style={{ textAlign: 'center', paddingBottom: 24, borderBottom: '2px solid #F1F5F9', marginBottom: 32 }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED', letterSpacing: '-1.5px' }}>EmPay</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#475569', marginTop: 6 }}>Annual Salary Statement Report</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginTop: 4 }}>Period: January — December {selectedYear}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32, padding: 32, background: '#F8FAFC', borderRadius: 24, border: '1px solid #EBEBF5' }}>
                      <ReportInfo label="Member Name" val={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} />
                      <ReportInfo label="Employee Code" val={selectedEmployee.loginId} />
                      <ReportInfo label="Designation" val={selectedEmployee.role?.replace('_', ' ') || 'Employee'} />
                      <ReportInfo label="Department" val={selectedEmployee.department || 'General'} />
                      <ReportInfo label="Joining Date" val={selectedEmployee.joiningDate} />
                      <ReportInfo label="Fiscal Cycle" val={`${selectedYear}`} />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9' }}>
                          <th style={{ padding: 16, textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Salary Components</th>
                          <th style={{ padding: 16, textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Current Monthly (₹)</th>
                          <th style={{ padding: 16, textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Yearly Cumulative (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <SectionLabel label="Earnings" color="#10B981" />
                        <ReportRow name="Basic Salary" m={payrollData.currentMonthPayroll?.basic_salary} y={payrollData.yearlyTotals.basic} />
                        <ReportRow name="House Rent Allowance" m={payrollData.currentMonthPayroll?.house_rent_allowance} y={payrollData.yearlyTotals.hra} />
                        <ReportRow name="Standard Allowance" m={payrollData.currentMonthPayroll?.standard_allowance} y={(payrollData.currentMonthPayroll?.standard_allowance || 0) * 12} />
                        <ReportRow name="Performance Bonus" m={payrollData.currentMonthPayroll?.performance_bonus} y={(payrollData.currentMonthPayroll?.performance_bonus || 0) * 12} />
                        
                        <SectionLabel label="Deductions" color="#F43F5E" />
                        <ReportRow name="PF (Employee)" m={payrollData.currentMonthPayroll?.pf_employee} y={payrollData.yearlyTotals.pf} isDed />
                        <ReportRow name="Professional Tax" m={payrollData.currentMonthPayroll?.professional_tax} y={(payrollData.currentMonthPayroll?.professional_tax || 0) * 12} isDed />
                        <ReportRow name="TDS Deduction" m={payrollData.currentMonthPayroll?.tds} y={(payrollData.currentMonthPayroll?.tds || 0) * 12} isDed />
                        
                        <tr style={{ background: '#FFFBEB', borderTop: '2px solid #FDE68A' }}>
                          <td style={{ padding: 20, fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Fiscal Net Pay</td>
                          <td style={{ padding: 20, fontSize: 16, fontWeight: 900, color: '#7C3AED', textAlign: 'right' }}>₹{(payrollData.currentMonthPayroll?.net_pay || 0).toLocaleString()}</td>
                          <td style={{ padding: 20, fontSize: 16, fontWeight: 900, color: '#7C3AED', textAlign: 'right' }}>₹{payrollData.yearlyTotals.net.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#94A3B8', paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                      <p>Computer generated analysis. No physical signature required.</p>
                      <p>© 2024 EmPay Intelligence. Generated: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, padding: 80, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Search size={40} style={{ color: '#D1D5DB' }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#64748B' }}>Ready for Selection</div>
                    <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 8 }}>Select an employee above to generate their detailed fiscal year report.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. Attendance Trends */}
            {reportType === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div style={{ ...cardStyle, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Attendance Dynamics</div>
                      <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>Global monthly attendance tracking</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[{ l: 'Present', c: '#10B981' }, { l: 'Absent', c: '#F59E0B' }, { l: 'Leave', c: '#7C3AED' }].map(x => (
                        <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: x.c, textTransform: 'uppercase' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c }} />{x.l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={attendanceData}>
                      <defs>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }} />
                      <Area type="monotone" dataKey="present" stroke="#10B981" strokeWidth={3} fill="url(#pGrad)" />
                      <Area type="monotone" dataKey="absent" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
                      <Area type="monotone" dataKey="leave" stroke="#7C3AED" strokeWidth={2} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={cardStyle}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', marginBottom: 20, letterSpacing: '-0.3px' }}>Current Workforce Pulse</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {employees.map((emp) => {
                      const sc = emp.status === 'present' ? '#10B981' : emp.status === 'absent' ? '#F59E0B' : '#3B82F6'
                      return (
                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #F1F5F9' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc, boxShadow: `0 0 0 4px ${sc}15` }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>{emp.firstName}</div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{emp.status || 'Offline'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Payroll Report */}
            {reportType === 'payroll' && (
              <motion.div key="payroll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>Budgetary Distribution</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, fontWeight: 500 }}>Month-wise presentation of salary cycle</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData} barSize={24}>
                      <defs>
                        <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#C4B5FD" /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }} />
                      <Bar dataKey="present" fill="url(#bGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(() => {
                    const currMonth = new Date().getMonth() + 1, currYear = new Date().getFullYear()
                    const monthlyTotal = payrolls.filter(p => p.year === currYear && p.month === currMonth).reduce((s,p) => s+(p.gross_wage||0), 0)
                    const avgSalary = employees.length > 0 ? Math.round(monthlyTotal / employees.length) : 0
                    const remaining = (summary.monthlyBudget || 0) - monthlyTotal
                    return (<>
                      <SummaryCard label="Total Force" val={employees.length} icon={<Users/>} color="#7C3AED" />
                      <SummaryCard label="Monthly Payroll" val={`₹${monthlyTotal.toLocaleString('en-IN',{maximumFractionDigits:0})}`} icon={<DollarSign/>} color="#10B981" />
                      <SummaryCard label="Budget Remaining" val={`₹${Math.max(0, remaining).toLocaleString('en-IN',{maximumFractionDigits:0})}`} icon={<TrendingUp/>} color={remaining < 0 ? "#F43F5E" : "#3B82F6"} />
                    </>)
                  })()}
                </div>
              </motion.div>
            )}

            {/* 4. Department Analytics */}
            {reportType === 'department' && (
              <motion.div key="department" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>Department Performance</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, fontWeight: 500 }}>Cross-department headcount & attendance mix</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={departmentStats} barGap={12}>
                      <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }} />
                      <Bar dataKey="employees" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="attendance" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {departmentStats.map((dept) => (
                    <div key={dept.name} style={{ ...cardStyle, padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: '#1E293B' }}>{dept.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#7C3AED', background: '#F5F3FF', padding: '4px 10px', borderRadius: 8 }}>{dept.employees} Teams</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${dept.attendance}%` }} transition={{ duration: 1 }}
                          style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 10 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                        <span style={{ color: '#10B981' }}>{dept.attendance}% Pres.</span>
                        <span style={{ color: dept.turnover > 5 ? '#F43F5E' : '#94A3B8' }}>{dept.turnover}% Turnover</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

const ReportInfo = ({ label, val }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{val}</div>
  </div>
)

const SectionLabel = ({ label, color }) => (
  <tr style={{ background: '#F8FAFC' }}>
    <td colSpan="3" style={{ padding: '10px 16px', fontSize: 11, fontWeight: 900, color: color, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{label}</td>
  </tr>
)

const ReportRow = ({ name, m, y, isDed }) => (
  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#334155' }}>{name}</td>
    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: isDed ? '#F43F5E' : '#10B981', textAlign: 'right' }}>₹{(m || 0).toLocaleString()}</td>
    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: isDed ? '#F43F5E' : '#10B981', textAlign: 'right' }}>₹{(y || 0).toLocaleString()}</td>
  </tr>
)

const SummaryCard = ({ label, val, icon, color }) => (
  <motion.div whileHover={{ scale: 1.02 }} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.8px' }}>{val}</div>
    </div>
  </motion.div>
)

export default Reports