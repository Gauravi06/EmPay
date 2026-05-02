import React, { useEffect, useState } from 'react'
import { useAuthStore, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { Users, DollarSign, Calendar, Clock, AlertCircle } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, markAttendance, getTodayAttendance, fetchEmployees, fetchReportsSummary, hasPermission } = useAuthStore()
  const [checkedIn, setCheckedIn] = useState(false)
  const [todayAtt, setTodayAtt] = useState([])
  const [summary, setSummary] = useState({ totalEmployees: 0, presentToday: 0, pendingLeaves: 0, totalPayroll: 0, monthlyPayroll: [], departmentDistribution: [] })
  const [loading, setLoading] = useState(true)

  const canViewReports = hasPermission('reports', 'view')

  useEffect(() => {
    const load = async () => {
      try {
        const att = await getTodayAttendance()
        setTodayAtt(att || [])
        if (canViewReports) {
          const s = await fetchReportsSummary()
          setSummary(s)
        } else {
          const emps = await fetchEmployees()
          setSummary(prev => ({ ...prev, totalEmployees: emps.length }))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const presentToday = todayAtt.filter(a => a.status === 'present').length
  const onLeave = todayAtt.filter(a => a.status === 'leave').length

  const attendanceData = [
    { name: 'Present', value: presentToday, color: '#10b981' },
    { name: 'On Leave', value: onLeave, color: '#3b82f6' },
    { name: 'Other', value: Math.max(0, (todayAtt.length - presentToday - onLeave)), color: '#f59e0b' }
  ].filter(d => d.value > 0)

  const handleCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toTimeString().slice(0, 5)
      await markAttendance(user.id, today, now, null, 0)
      setCheckedIn(true)
      toast.success('Checked in successfully!')
      setTimeout(() => setCheckedIn(false), 3000)
    } catch (e) {
      toast.error('Failed to check in')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name}!</p>
        </div>

        {/* Check In - only employees */}
        {user?.role === ROLES.EMPLOYEE && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <button
              onClick={handleCheckIn}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Check In for Today
            </button>
            {checkedIn && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 mt-2">
                ✅ Successfully checked in!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{summary.totalEmployees}</p>
              </div>
              <Users className="w-10 h-10 text-primary-500" />
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{summary.presentToday || presentToday}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-500" />
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Leaves</p>
                <p className="text-2xl font-bold text-blue-600">{summary.pendingLeaves || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Payroll Paid</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ₹{(summary.totalPayroll || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-indigo-500" />
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Today's Attendance</h3>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90} dataKey="value">
                    {attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-16">No attendance data yet today</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Monthly Payroll</h3>
            {summary.monthlyPayroll?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={summary.monthlyPayroll.slice(0, 6).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₹${v?.toLocaleString('en-IN')}`} />
                  <Bar dataKey="total_payroll" fill="#6366f1" name="Net Payroll" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-16">No payroll data yet</p>
            )}
          </div>
        </div>

        {/* Department Distribution */}
        {canViewReports && summary.departmentDistribution?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Employees by Department</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.departmentDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard