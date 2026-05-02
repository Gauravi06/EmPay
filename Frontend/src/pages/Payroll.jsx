import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Calendar, Eye, Printer,
  AlertCircle, Users, FileText, Plus, X, Search
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toFixed(2)
const fmtInt = (n) => Number(n || 0).toFixed(0)

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
  }, [])

  useEffect(() => { if (user) loadData() }, [loadData])

  // Filter payrolls
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
      toast.success(`Payroll generated for ${targetEmployee.first_name} ${targetEmployee.last_name}`)
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
        body{font-family:Arial,sans-serif;margin:40px}
        h1{color:#2563eb;text-align:center}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
        .item{border-bottom:1px solid #e5e7eb;padding:6px 0;font-size:14px}
        .label{font-weight:600;color:#6b7280}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th,td{border:1px solid #e5e7eb;padding:10px;text-align:left}
        th{background:#f3f4f6}
        .total{font-weight:bold;background:#fef3c7}
        .net{text-align:right;margin-top:20px;padding:15px;background:#f0fdf4;border-radius:8px}
        .footer{text-align:center;font-size:12px;color:#9ca3af;margin-top:40px}
        @media print{button{display:none}}
      </style></head><body>
      <h1>EmPay - Salary Slip</h1>
      <p style="text-align:center;color:#6b7280">Period: ${p.period}</p>
      <div class="grid">
        <div class="item"><span class="label">Employee:</span> ${p.employee_name}</div>
        <div class="item"><span class="label">Code:</span> ${p.employee_code}</div>
        <div class="item"><span class="label">UAN:</span> ${p.uan || 'N/A'}</div>
        <div class="item"><span class="label">Department:</span> ${p.department || 'General'}</div>
        <div class="item"><span class="label">Location:</span> ${p.location || 'Head Office'}</div>
        <div class="item"><span class="label">Worked Days:</span> ${p.worked_days}/${p.total_days}</div>
      </div>
      <table>
        <thead>
          <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
          <tr><th>Component</th><th>Amount</th><th>Component</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr><td>Basic Salary</td><td>₹${fmt(p.basic_salary)}</td><td>PF Employee</td><td>₹${fmt(p.pf_employee)}</td></tr>
          <tr><td>HRA</td><td>₹${fmt(p.house_rent_allowance)}</td><td>Professional Tax</td><td>₹${fmt(p.professional_tax)}</td></tr>
          <tr><td>Standard Allowance</td><td>₹${fmt(p.standard_allowance)}</td><td>TDS</td><td>₹${fmt(p.tds)}</td></tr>
          <tr><td>Performance Bonus</td><td>₹${fmt(p.performance_bonus)}</td><td></td><td></td></tr>
          <tr><td>LTA</td><td>₹${fmt(p.leave_travel_allowance)}</td><td></td><td></td></tr>
          <tr class="total"><td><b>Gross</b></td><td><b>₹${fmt(p.gross_wage)}</b></td><td><b>Total Deductions</b></td><td><b>₹${fmt(p.total_deductions)}</b></td></tr>
        </tbody>
      </table>
      <div class="net"><h3>Net Payable: ₹${fmt(p.net_pay)}</h3><p>(Gross - Total Deductions)</p></div>
      <div class="footer"><p>Computer generated payslip. No signature required.</p><p>Generated: ${new Date().toLocaleString()}</p></div>
      <br><button onclick="window.print()" style="padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:5px;cursor:pointer">Print</button>
      </body></html>`)
    win.document.close()
  }

  // Chart data from payrolls
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
    name, value, color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6]
  }))

  const currentMonthGross = monthlyChartData[new Date().getMonth()]?.gross || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
              <p className="text-gray-600">Manage employee salaries and generate payslips</p>
            </div>
            {canGeneratePayroll && (
              <button onClick={handleGeneratePayroll} disabled={generating}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate Payroll'}
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
              </div>
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Monthly Gross Wage</p>
                <p className="text-2xl font-bold text-green-600">₹{currentMonthGross.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-400" />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Payrolls Processed</p>
                <p className="text-2xl font-bold text-indigo-600">{payrolls.length}</p>
              </div>
              <FileText className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {payrolls.filter(p => p.year === selectedYear && p.month === selectedMonth).length}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Monthly Payroll Trends</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="gross" stroke="#3b82f6" name="Gross" />
                  <Line type="monotone" dataKey="net" stroke="#10b981" name="Net Pay" />
                  <Line type="monotone" dataKey="deductions" stroke="#ef4444" name="Deductions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Department Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              {isAdminOrPayroll && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Employee (for generate)</label>
                  <select value={selectedEmployee?.id || ''}
                    onChange={e => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)) || null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-48">
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" placeholder="Search by employee name..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading payroll data...</div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No payroll records</h3>
                <p className="text-sm text-gray-400 mt-1">Select an employee and generate payroll to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Worked Days</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Basic</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Gross</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Deductions</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Net Pay</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPayrolls.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{p.employee_name}</p>
                          <p className="text-xs text-gray-500">{p.employee_code}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.period}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{p.worked_days}/{p.total_days}</td>
                        <td className="px-4 py-3 text-right text-gray-600">₹{fmtInt(p.basic_salary)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">₹{fmtInt(p.gross_wage)}</td>
                        <td className="px-4 py-3 text-right text-red-600">₹{fmtInt(p.total_deductions)}</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-bold">₹{fmtInt(p.net_pay)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-800' :
                              p.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setSelectedPayroll(p); setShowPayslip(true) }}
                              className="p-1 text-indigo-600 hover:text-indigo-800" title="View Payslip">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handlePrintPayslip(p)}
                              className="p-1 text-gray-600 hover:text-gray-800" title="Print Payslip">
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payslip Modal */}
      <AnimatePresence>
        {showPayslip && selectedPayroll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPayslip(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Payslip — {selectedPayroll.period}</h2>
                <button onClick={() => setShowPayslip(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-indigo-600">EmPay</h1>
                  <p className="text-gray-500">Salary Slip for {selectedPayroll.period}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg text-sm">
                  {[
                    ['Employee Name', selectedPayroll.employee_name],
                    ['Employee Code', selectedPayroll.employee_code],
                    ['UAN', selectedPayroll.uan || 'N/A'],
                    ['Department', selectedPayroll.department || 'General'],
                    ['Location', selectedPayroll.location || 'Head Office'],
                    ['Period', selectedPayroll.period],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-medium">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                  {[
                    ['Worked Days', `${selectedPayroll.worked_days}/${selectedPayroll.total_days}`, 'green'],
                    ['Present', selectedPayroll.attendance, 'blue'],
                    ['Paid Time Off', selectedPayroll.paid_time_off, 'purple'],
                    ['Sick Leave', selectedPayroll.sick_leave, 'orange'],
                    ['Unpaid Leave', selectedPayroll.unpaid_leave, 'red'],
                  ].map(([label, val, color]) => (
                    <div key={label} className={`text-center p-3 bg-${color}-50 rounded-lg`}>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className={`text-xl font-bold text-${color}-600`}>{val}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th colSpan="2" className="p-3 text-left font-semibold">Earnings</th>
                        <th colSpan="2" className="p-3 text-left font-semibold">Deductions</th>
                      </tr>
                      <tr className="bg-gray-50 text-sm">
                        <th className="p-3 text-left">Component</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-left">Component</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Basic Salary', selectedPayroll.basic_salary, 'PF Employee', selectedPayroll.pf_employee],
                        ['HRA', selectedPayroll.house_rent_allowance, 'Professional Tax', selectedPayroll.professional_tax],
                        ['Standard Allowance', selectedPayroll.standard_allowance, 'TDS', selectedPayroll.tds],
                        ['Performance Bonus', selectedPayroll.performance_bonus, '', null],
                        ['LTA', selectedPayroll.leave_travel_allowance, '', null],
                      ].map(([e1, v1, e2, v2], i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">{e1}</td>
                          <td className="p-3 text-right">₹{fmt(v1)}</td>
                          <td className="p-3">{e2}</td>
                          <td className="p-3 text-right">{v2 !== null ? `₹${fmt(v2)}` : ''}</td>
                        </tr>
                      ))}
                      <tr className="bg-yellow-50 font-bold">
                        <td className="p-3">Gross Earnings</td>
                        <td className="p-3 text-right">₹{fmt(selectedPayroll.gross_wage)}</td>
                        <td className="p-3">Total Deductions</td>
                        <td className="p-3 text-right">₹{fmt(selectedPayroll.total_deductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg text-right">
                  <h3 className="text-lg font-bold text-green-800">Net Payable: ₹{fmt(selectedPayroll.net_pay)}</h3>
                  <p className="text-xs text-green-600">(Gross Earnings − Total Deductions)</p>
                </div>

                <div className="mt-6 text-center text-xs text-gray-400">
                  <p>Computer generated payslip. No signature required.</p>
                  <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                <button onClick={() => handlePrintPayslip(selectedPayroll)}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Payslip
                </button>
                <button onClick={() => setShowPayslip(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Payroll