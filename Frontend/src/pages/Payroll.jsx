import React, { useState } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Download, Eye, 
  Printer, AlertCircle, Users, Briefcase, FileText, Plus,
  ChevronLeft, ChevronRight, X, CheckCircle, Clock, Coffee,
  Search, Filter, CreditCard, Building, MapPin, Hash, User,
  Save
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Payroll = () => {
  const { user, employees, payrolls, generatePayroll, getAllPayrolls, updatePayrollStatus, getPayslip, getWarnings, getEmployerCosts, hasPermission } = useAuthStore()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [showPayslip, setShowPayslip] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER
  const canGeneratePayroll = hasPermission(MODULES.PAYROLL, PERMISSIONS.CREATE)
  
  const allPayrolls = isAdminOrPayroll ? getAllPayrolls() : payrolls.filter(p => p.employeeId === user?.id)
  
  const filteredPayrolls = allPayrolls.filter(p => {
    if (searchTerm && !p.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })
  
  const warnings = getWarnings()
  const employerCosts = getEmployerCosts()
  
  const generateNewPayroll = () => {
    const targetEmployee = selectedEmployee || user
    if (!targetEmployee) return
    
    const existing = payrolls.find(p => 
      p.employeeId === targetEmployee.id && 
      p.year === selectedYear && 
      p.month === selectedMonth
    )
    
    if (existing) {
      toast.error(`Payroll already exists for ${format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}`)
      return
    }
    
    const newPayroll = generatePayroll(targetEmployee.id, selectedYear, selectedMonth)
    if (newPayroll) {
      toast.success(`Payroll generated for ${targetEmployee.firstName} ${targetEmployee.lastName}`)
    }
  }
  
  const handlePrintPayslip = (payroll) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${payroll.employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .payslip-title { font-size: 20px; margin: 20px 0; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
            .info-item { border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
            .info-label { font-weight: 600; color: #6b7280; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            .table th { background-color: #f3f4f6; }
            .total-row { font-weight: bold; background-color: #fef3c7; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
            @media print {
              body { margin: 0; padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Employee Management System</div>
            <div class="payslip-title">Salary Slip for ${payroll.period}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Employee Name:</span> ${payroll.employeeName}</div>
            <div class="info-item"><span class="info-label">Employee Code:</span> ${payroll.employeeCode}</div>
            <div class="info-item"><span class="info-label">UAN:</span> ${payroll.uan || 'N/A'}</div>
            <div class="info-item"><span class="info-label">Department:</span> ${payroll.department || 'General'}</div>
            <div class="info-item"><span class="info-label">Location:</span> ${payroll.location || 'Head Office'}</div>
            <div class="info-item"><span class="info-label">Period:</span> ${payroll.period}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Worked Days:</span> ${payroll.workedDays} / ${payroll.totalDays} days</div>
            <div class="info-item"><span class="info-label">Present Days:</span> ${payroll.attendance} days</div>
            <div class="info-item"><span class="info-label">Paid Time Off:</span> ${payroll.paidTimeOff} days</div>
            <div class="info-item"><span class="info-label">Sick Leave:</span> ${payroll.sickLeave} days</div>
            <div class="info-item"><span class="info-label">Unpaid Leave:</span> ${payroll.unpaidLeave} days</div>
          </div>
          
          <table class="table">
            <thead>
              <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
              <tr><th>Component</th><th>Amount</th><th>Component</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td>₹${payroll.basicSalary?.toFixed(2) || 0}</td>
                <td>PF Employee</td>
                <td>₹${payroll.pfEmployee?.toFixed(2) || 0}</td>
               </tr>
              <tr>
                <td>House Rent Allowance</td>
                <td>₹${payroll.houseRentAllowance?.toFixed(2) || 0}</td>
                <td>Professional Tax</td>
                <td>₹${payroll.professionalTax?.toFixed(2) || 0}</td>
               </tr>
              <tr>
                <td>Standard Allowance</td>
                <td>₹${payroll.standardAllowance?.toFixed(2) || 0}</td>
                <td>TDS Deduction</td>
                <td>₹${payroll.tds?.toFixed(2) || 0}</td>
               </tr>
              <tr>
                <td>Performance Bonus</td>
                <td>₹${payroll.performanceBonus?.toFixed(2) || 0}</td>
                <td></td>
                <td></td>
               </tr>
              <tr>
                <td>Leave Travel Allowance</td>
                <td>₹${payroll.leaveTravelAllowance?.toFixed(2) || 0}</td>
                <td></td>
                <td></td>
               </tr>
              <tr class="total-row">
                <td><strong>Gross Earnings</strong></td>
                <td><strong>₹${payroll.grossWage?.toFixed(2) || 0}</strong></td>
                <td><strong>Total Deductions</strong></td>
                <td><strong>₹${payroll.totalDeductions?.toFixed(2) || 0}</strong></td>
               </tr>
            </tbody>
          </table>
          
          <div style={{textAlign: 'right', marginTop: '20px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px'}}>
            <h3>Net Payable: ₹${payroll.netPay?.toFixed(2) || 0}</h3>
            <p>(Gross Earnings - Total Deductions)</p>
          </div>
          
          <div class="footer">
            <p>This is a computer generated payslip. No signature required.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          
          <button onclick="window.print()" style={{marginTop: '20px', padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Print Payslip</button>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
  
  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const monthPayrolls = allPayrolls.filter(p => p.year === selectedYear && p.month === i + 1)
    return {
      month: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
      gross: monthPayrolls.reduce((sum, p) => sum + (p.grossWage || 0), 0),
      net: monthPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0),
      deductions: monthPayrolls.reduce((sum, p) => sum + (p.totalDeductions || 0), 0)
    }
  })
  
  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || 'General'
    if (!acc[dept]) acc[dept] = 0
    acc[dept]++
    return acc
  }, {})
  
  const pieData = Object.entries(departmentData).map(([name, value], index) => ({
    name,
    value,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][index % 6]
  }))
  
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
              <p className="text-gray-600">Manage employee salaries, generate payslips, and track costs</p>
            </div>
            {canGeneratePayroll && (
              <button
                onClick={generateNewPayroll}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Generate Payroll
              </button>
            )}
          </div>
          
          {/* Warnings */}
          {(warnings.withoutBank > 0 || warnings.withoutManager > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {warnings.withoutBank > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Warning</h3>
                    <p className="text-sm text-yellow-700">{warnings.withoutBank} Employee(s) without Bank Account</p>
                  </div>
                </div>
              )}
              {warnings.withoutManager > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Warning</h3>
                    <p className="text-sm text-yellow-700">{warnings.withoutManager} Employee(s) without Manager</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
                </div>
                <Users className="w-10 h-10 text-primary-500" />
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Monthly Gross Wage</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{monthlyChartData[new Date().getMonth()]?.gross?.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Employer Cost (Annual)</p>
                  <p className="text-2xl font-bold text-purple-600">₹{employerCosts.annual.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Payroll Processed</p>
                  <p className="text-2xl font-bold text-indigo-600">{allPayrolls.length}</p>
                </div>
                <FileText className="w-10 h-10 text-indigo-500" />
              </div>
            </motion.div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Monthly Payroll Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="gross" stroke="#3b82f6" name="Gross Wage" />
                  <Line type="monotone" dataKey="net" stroke="#10b981" name="Net Pay" />
                  <Line type="monotone" dataKey="deductions" stroke="#ef4444" name="Deductions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Department Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
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
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              {isAdminOrPayroll && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Employee</label>
                  <select
                    value={selectedEmployee?.id || ''}
                    onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)))}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-48"
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Payroll List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Worked Days</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Basic Wage</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Gross Wage</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Deductions</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Net Pay</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{payroll.employeeName}</p>
                          <p className="text-xs text-gray-500">{payroll.employeeCode}</p>
                        </div>
                       </td>
                      <td className="px-4 py-3 text-gray-600">{payroll.period}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{payroll.workedDays}/{payroll.totalDays}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{payroll.basicSalary?.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">₹{payroll.grossWage?.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-red-600">₹{payroll.totalDeductions?.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">₹{payroll.netPay?.toFixed(0)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payroll.status === 'approved' ? 'bg-green-100 text-green-800' :
                          payroll.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payroll.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPayroll(payroll)
                              setShowPayslip(true)
                            }}
                            className="p-1 text-primary-600 hover:text-primary-700"
                            title="View Payslip"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintPayslip(payroll)}
                            className="p-1 text-gray-600 hover:text-gray-700"
                            title="Print Payslip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      {/* Payslip Modal */}
      <AnimatePresence>
        {showPayslip && selectedPayroll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPayslip(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Payslip Details</h2>
                <button
                  onClick={() => setShowPayslip(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Company Header */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-primary-600">Employee Management System</h1>
                  <p className="text-gray-500">Salary Slip for {selectedPayroll.period}</p>
                </div>
                
                {/* Employee Information */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Employee Name</p>
                    <p className="font-medium">{selectedPayroll.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Employee Code</p>
                    <p className="font-medium">{selectedPayroll.employeeCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">UAN</p>
                    <p className="font-medium">{selectedPayroll.uan || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="font-medium">{selectedPayroll.department || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">{selectedPayroll.location || 'Head Office'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Period</p>
                    <p className="font-medium">{selectedPayroll.period}</p>
                  </div>
                </div>
                
                {/* Attendance Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">Worked Days</p>
                    <p className="text-xl font-bold text-green-600">{selectedPayroll.workedDays}/{selectedPayroll.totalDays}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">Present</p>
                    <p className="text-xl font-bold text-blue-600">{selectedPayroll.attendance}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-500">Paid Time Off</p>
                    <p className="text-xl font-bold text-purple-600">{selectedPayroll.paidTimeOff}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-500">Sick Leave</p>
                    <p className="text-xl font-bold text-orange-600">{selectedPayroll.sickLeave}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-500">Unpaid Leave</p>
                    <p className="text-xl font-bold text-red-600">{selectedPayroll.unpaidLeave}</p>
                  </div>
                </div>
                
                {/* Salary Details Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th colSpan="2" className="p-3 text-left font-semibold">Earnings</th>
                        <th colSpan="2" className="p-3 text-left font-semibold">Deductions</th>
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left text-sm">Component</th>
                        <th className="p-3 text-right text-sm">Amount</th>
                        <th className="p-3 text-left text-sm">Component</th>
                        <th className="p-3 text-right text-sm">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Basic Salary</td>
                        <td className="p-3 text-right">₹{selectedPayroll.basicSalary?.toFixed(2) || 0}</td>
                        <td className="p-3">PF Employee</td>
                        <td className="p-3 text-right">₹{selectedPayroll.pfEmployee?.toFixed(2) || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">House Rent Allowance</td>
                        <td className="p-3 text-right">₹{selectedPayroll.houseRentAllowance?.toFixed(2) || 0}</td>
                        <td className="p-3">Professional Tax</td>
                        <td className="p-3 text-right">₹{selectedPayroll.professionalTax?.toFixed(2) || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Standard Allowance</td>
                        <td className="p-3 text-right">₹{selectedPayroll.standardAllowance?.toFixed(2) || 0}</td>
                        <td className="p-3">TDS Deduction</td>
                        <td className="p-3 text-right">₹{selectedPayroll.tds?.toFixed(2) || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Performance Bonus</td>
                        <td className="p-3 text-right">₹{selectedPayroll.performanceBonus?.toFixed(2) || 0}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right"></td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Leave Travel Allowance</td>
                        <td className="p-3 text-right">₹{selectedPayroll.leaveTravelAllowance?.toFixed(2) || 0}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right"></td>
                      </tr>
                      <tr className="bg-yellow-50 font-bold">
                        <td className="p-3">Gross Earnings</td>
                        <td className="p-3 text-right">₹{selectedPayroll.grossWage?.toFixed(2) || 0}</td>
                        <td className="p-3">Total Deductions</td>
                        <td className="p-3 text-right">₹{selectedPayroll.totalDeductions?.toFixed(2) || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Net Payable */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg text-right">
                  <h3 className="text-lg font-bold text-green-800">Net Payable: ₹{selectedPayroll.netPay?.toFixed(2) || 0}</h3>
                  <p className="text-xs text-green-600">(Gross Earnings - Total Deductions)</p>
                </div>
                
                {/* Footer */}
                <div className="mt-6 text-center text-xs text-gray-400">
                  <p>This is a computer generated payslip. No signature required.</p>
                  <p>Generated on: {new Date().toLocaleString()}</p>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                <button
                  onClick={() => handlePrintPayslip(selectedPayroll)}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Payslip
                </button>
                <button
                  onClick={() => setShowPayslip(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
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