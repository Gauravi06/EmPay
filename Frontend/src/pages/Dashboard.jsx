import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import EmployeeCard from '../components/EmployeeCard'
import { motion } from 'framer-motion'
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle
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

const Dashboard = () => {
  const { employees, user, markAttendance } = useAuthStore()
  const [checkedIn, setCheckedIn] = useState(false)
  
  const totalEmployees = employees.length
  const presentToday = employees.filter(emp => emp.status === 'present').length
  const onLeave = employees.filter(emp => emp.status === 'leave').length
  const absent = employees.filter(emp => emp.status === 'absent').length
  
  const attendanceData = [
    { name: 'Present', value: presentToday, color: '#10b981' },
    { name: 'On Leave', value: onLeave, color: '#3b82f6' },
    { name: 'Absent', value: absent, color: '#f59e0b' }
  ]
  
  const monthlyData = [
    { month: 'Jan', attendance: 22, payroll: 45000 },
    { month: 'Feb', attendance: 20, payroll: 45000 },
    { month: 'Mar', attendance: 23, payroll: 48000 },
    { month: 'Apr', attendance: 21, payroll: 48000 },
    { month: 'May', attendance: 22, payroll: 50000 },
    { month: 'Jun', attendance: 21, payroll: 50000 }
  ]
  
  const handleCheckIn = () => {
    const today = new Date().toISOString().split('T')[0]
    markAttendance(user.id, today, 'checkin')
    setCheckedIn(true)
    setTimeout(() => setCheckedIn(false), 2000)
  }
  
  const employeesWithoutBank = employees.filter(emp => !emp.bankDetails)
  const employeesWithoutManager = employees.filter(emp => !emp.manager)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>
        
        {/* Check In Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={handleCheckIn}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Clock className="w-5 h-5" />
            Check In
          </button>
          {checkedIn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 mt-2"
            >
              Successfully checked in!
            </motion.p>
          )}
        </motion.div>
        
        {/* Warning Cards */}
        {(employeesWithoutBank.length > 0 || employeesWithoutManager.length > 0) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeesWithoutBank.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Warning</h3>
                  <p className="text-sm text-yellow-700">
                    {employeesWithoutBank.length} employee(s) without bank account details
                  </p>
                </div>
              </div>
            )}
            {employeesWithoutManager.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Warning</h3>
                  <p className="text-sm text-yellow-700">
                    {employeesWithoutManager.length} employee(s) without assigned manager
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{totalEmployees}</p>
              </div>
              <Users className="w-10 h-10 text-primary-500" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{presentToday}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-500" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">On Leave</p>
                <p className="text-2xl font-bold text-blue-600">{onLeave}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Monthly Payroll</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ₹{(totalEmployees * 50000).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-indigo-500" />
            </div>
          </motion.div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#3b82f6" name="Attendance Days" />
                <Line yAxisId="right" type="monotone" dataKey="payroll" stroke="#10b981" name="Payroll (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Employees */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Employees</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.slice(0, 3).map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard