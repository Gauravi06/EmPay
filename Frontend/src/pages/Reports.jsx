import React, { useState, useRef } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { 
  FileText, TrendingUp, Users, Calendar, Download, Eye, 
  BarChart3, PieChart as PieChartIcon, Printer, Search,
  DollarSign, Briefcase, MapPin, Hash, User, Building,
  ChevronDown, ChevronUp
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const Reports = () => {
  const { user, employees, payrolls, hasPermission, ROLES } = useAuthStore()
  const [reportType, setReportType] = useState('salary')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showSalaryReport, setShowSalaryReport] = useState(false)
  const printRef = useRef()
  
  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER
  
  if (!isAdminOrPayroll) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  
  const attendanceData = [
    { month: 'Jan', present: 22, absent: 2, leave: 1 },
    { month: 'Feb', present: 20, absent: 3, leave: 2 },
    { month: 'Mar', present: 23, absent: 1, leave: 1 },
    { month: 'Apr', present: 21, absent: 2, leave: 2 },
    { month: 'May', present: 22, absent: 1, leave: 2 },
    { month: 'Jun', present: 21, absent: 2, leave: 2 }
  ]
  
  const departmentStats = [
    { name: 'Engineering', employees: 12, attendance: 92, turnover: 5 },
    { name: 'Sales', employees: 8, attendance: 88, turnover: 8 },
    { name: 'HR', employees: 5, attendance: 95, turnover: 0 },
    { name: 'Finance', employees: 6, attendance: 90, turnover: 3 }
  ]
  
  const getEmployeePayrollData = () => {
    if (!selectedEmployee) return null
    
    const employeePayrolls = payrolls.filter(p => p.employeeId === selectedEmployee.id && p.year === selectedYear)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const payroll = employeePayrolls.find(p => p.month === i + 1)
      return {
        month: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
        basic: payroll?.basicSalary || 0,
        hra: payroll?.houseRentAllowance || 0,
        pf: payroll?.pfEmployee || 0,
        net: payroll?.netPay || 0
      }
    })
    
    const yearlyTotals = monthlyData.reduce((acc, month) => {
      acc.basic += month.basic
      acc.hra += month.hra
      acc.pf += month.pf
      acc.net += month.net
      return acc
    }, { basic: 0, hra: 0, pf: 0, net: 0 })
    
    // Get latest payroll for current month
    const currentMonthPayroll = employeePayrolls.find(p => p.month === new Date().getMonth() + 1)
    
    return {
      monthlyData,
      yearlyTotals,
      currentMonthPayroll
    }
  }
  
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const originalContent = document.body.innerHTML
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Salary Statement Report - ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .report-title {
              font-size: 18px;
              margin-top: 10px;
              color: #4b5563;
            }
            .employee-info {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .table th {
              background-color: #f3f4f6;
              border: 1px solid #e5e7eb;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            .table td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: right;
            }
            .table td:first-child {
              text-align: left;
            }
            .total-row {
              background-color: #fef3c7;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
  
  const payrollData = getEmployeePayrollData()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
              <p className="text-gray-600">View comprehensive reports and insights</p>
            </div>
          </div>
          
          {/* Report Type Selector */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'salary', label: 'Salary Statement Report', icon: DollarSign },
                { id: 'attendance', label: 'Attendance Report', icon: Calendar },
                { id: 'payroll', label: 'Payroll Report', icon: TrendingUp },
                { id: 'department', label: 'Department Report', icon: BarChart3 }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    reportType === type.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Salary Statement Report */}
          {reportType === 'salary' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Selection Panel */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Salary Statement Report
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <select
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.loginId})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {selectedEmployee && payrollData && (
                  <div className="flex justify-end">
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </button>
                  </div>
                )}
              </div>
              
              {/* Report Content - Printable Area */}
              {selectedEmployee && payrollData && (
                <div ref={printRef}>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="text-center py-8 border-b">
                      <h1 className="text-2xl font-bold text-primary-600">Employee Management System</h1>
                      <p className="text-lg text-gray-600 mt-2">Salary Statement Report</p>
                      <p className="text-sm text-gray-500">{selectedYear}</p>
                    </div>
                    
                    {/* Employee Information */}
                    <div className="p-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Employee Name</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Employee Code</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.loginId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Designation</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.role?.replace('_', ' ') || 'Employee'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.department || 'General'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date of Joining</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.joiningDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Salary Effective From</p>
                          <p className="font-semibold text-gray-800">{selectedEmployee.joiningDate}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Salary Statement Table */}
                    <div className="p-6">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-3 text-left border">Salary Components</th>
                            <th className="p-3 text-right border">Monthly Amount (₹)</th>
                            <th className="p-3 text-right border">Yearly Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-gray-50">
                            <td colSpan="3" className="p-2 font-semibold border">Earnings</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">Basic Salary</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.basicSalary?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{payrollData.yearlyTotals.basic.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">House Rent Allowance (HRA)</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.houseRentAllowance?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{payrollData.yearlyTotals.hra.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">Standard Allowance</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.standardAllowance?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{(payrollData.currentMonthPayroll?.standardAllowance || 0) * 12}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">Performance Bonus</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.performanceBonus?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{(payrollData.currentMonthPayroll?.performanceBonus || 0) * 12}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">Leave Travel Allowance</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.leaveTravelAllowance?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{(payrollData.currentMonthPayroll?.leaveTravelAllowance || 0) * 12}</td>
                          </tr>
                          
                          <tr className="bg-gray-50">
                            <td colSpan="3" className="p-2 font-semibold border">Deductions</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">PF (Employee Contribution)</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.pfEmployee?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{payrollData.yearlyTotals.pf.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">Professional Tax</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.professionalTax?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{(payrollData.currentMonthPayroll?.professionalTax || 0) * 12}</td>
                          </tr>
                          <tr>
                            <td className="p-3 border">TDS Deduction</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.tds?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{(payrollData.currentMonthPayroll?.tds || 0) * 12}</td>
                          </tr>
                          
                          <tr className="total-row bg-yellow-50 font-bold">
                            <td className="p-3 border">Net Salary</td>
                            <td className="p-3 text-right border">₹{payrollData.currentMonthPayroll?.netPay?.toFixed(2) || 0}</td>
                            <td className="p-3 text-right border">₹{payrollData.yearlyTotals.net.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Monthly Breakdown */}
                    <div className="p-6 border-t">
                      <h4 className="font-semibold text-gray-800 mb-4">Monthly Salary Breakdown - {selectedYear}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 border text-left">Month</th>
                              <th className="p-2 border text-right">Basic</th>
                              <th className="p-2 border text-right">HRA</th>
                              <th className="p-2 border text-right">PF</th>
                              <th className="p-2 border text-right">Net Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payrollData.monthlyData.map((month, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="p-2 border">{month.month}</td>
                                <td className="p-2 border text-right">₹{month.basic.toFixed(2)}</td>
                                <td className="p-2 border text-right">₹{month.hra.toFixed(2)}</td>
                                <td className="p-2 border text-right">₹{month.pf.toFixed(2)}</td>
                                <td className="p-2 border text-right font-medium">₹{month.net.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 font-bold">
                              <td className="p-2 border">Total</td>
                              <td className="p-2 border text-right">₹{payrollData.yearlyTotals.basic.toFixed(2)}</td>
                              <td className="p-2 border text-right">₹{payrollData.yearlyTotals.hra.toFixed(2)}</td>
                              <td className="p-2 border text-right">₹{payrollData.yearlyTotals.pf.toFixed(2)}</td>
                              <td className="p-2 border text-right">₹{payrollData.yearlyTotals.net.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="text-center py-6 text-xs text-gray-400 border-t">
                      <p>This is a computer generated report. No signature required.</p>
                      <p>Generated on: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedEmployee && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Select an Employee</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose an employee and year to generate the salary statement report
                  </p>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Attendance Report */}
          {reportType === 'attendance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Attendance Trends</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="#f59e0b" name="Absent" />
                    <Line type="monotone" dataKey="leave" stroke="#3b82f6" name="Leave" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Current Employee Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{emp.firstName} {emp.lastName}</p>
                        <p className="text-sm text-gray-500">{emp.loginId}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        emp.status === 'present' ? 'bg-green-500' :
                        emp.status === 'absent' ? 'bg-yellow-500' :
                        emp.status === 'leave' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Payroll Report */}
          {reportType === 'payroll' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-800 mb-4">Payroll Summary</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" name="Present Days" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Total Employees</span>
                      <span className="font-semibold">{employees.length}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Monthly Payroll</span>
                      <span className="font-semibold">₹{(employees.length * 50000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Average Salary</span>
                      <span className="font-semibold">₹50,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Department Report */}
          {reportType === 'department' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-800 mb-4">Department Analytics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="employees" fill="#3b82f6" name="Employees" />
                      <Bar dataKey="attendance" fill="#10b981" name="Attendance %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="space-y-3">
                    {departmentStats.map((dept) => (
                      <div key={dept.name} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-sm text-gray-600">{dept.employees} employees</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${dept.attendance}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <span>Attendance: {dept.attendance}%</span>
                          <span>Turnover: {dept.turnover}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Reports