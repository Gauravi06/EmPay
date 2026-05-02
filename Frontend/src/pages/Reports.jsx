import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { FileText, TrendingUp, Users, Calendar, Download, Eye, BarChart3, PieChart as PieChartIcon } from 'lucide-react'
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

const Reports = () => {
  const { employees } = useAuthStore()
  const [reportType, setReportType] = useState('attendance')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  
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
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-500'
      case 'absent': return 'bg-yellow-500'
      case 'leave': return 'bg-blue-500'
      default: return 'bg-red-500'
    }
  }
  
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
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
          
          {/* Report Type Selector */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'attendance', label: 'Attendance Report', icon: Calendar },
                { id: 'payroll', label: 'Payroll Report', icon: TrendingUp },
                { id: 'employees', label: 'Employee Report', icon: Users },
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
          
          {/* Date Range Picker */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          {/* Report Content */}
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
                      <div className={`status-dot ${getStatusColor(emp.status)}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
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
          
          {reportType === 'employees' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-800 mb-4">Employee Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Login ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joining Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{emp.firstName} {emp.lastName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.loginId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.joiningDate}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emp.status === 'present' ? 'bg-green-100 text-green-800' :
                            emp.status === 'absent' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          
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