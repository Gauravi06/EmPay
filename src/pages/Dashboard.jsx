import React, { useEffect, useState } from 'react'
import { useAuthStore, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import EmployeeCard from '../components/EmployeeCard'
import { motion } from 'framer-motion'
import { Users, DollarSign, Calendar, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const {
    user, markAttendance, getTodayAttendance,
    fetchEmployees, fetchReportsSummary, hasPermission
  } = useAuthStore()

  const [employees, setEmployees] = useState([])
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState(null)
  const [todayAtt, setTodayAtt] = useState([])
  const [summary, setSummary] = useState({
    totalEmployees: 0, presentToday: 0, pendingLeaves: 0,
    totalPayroll: 0, monthlyPayroll: [], departmentDistribution: []
  })
  const [loading, setLoading] = useState(true)

  const canViewReports = hasPermission('reports', 'view')

  useEffect(() => {
    const load = async () => {
      try {
        const att = await getTodayAttendance()
        setTodayAtt(att || [])

        const emps = await fetchEmployees()
        setEmployees(emps || [])

        if (canViewReports) {
          const s = await fetchReportsSummary()
          setSummary(s)
        } else {
          setSummary(prev => ({ ...prev, totalEmployees: (emps || []).length }))
        }

        // Check if current user already checked in today
        const myRecord = (att || []).find(a => a.id === user?.id)
        if (myRecord?.check_in) {
          setCheckedIn(true)
          setCheckInTime(myRecord.check_in)
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
    { name: 'Other', value: Math.max(0, todayAtt.length - presentToday - onLeave), color: '#f59e0b' }
  ].filter(d => d.value > 0)

  const handleCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toTimeString().slice(0, 5)
      await markAttendance(user.id, today, now, null, 0)
      setCheckedIn(true)
      setCheckInTime(now)
      toast.success('Checked in successfully!')
    } catch (e) {
      toast.error('Failed to check in')
    }
  }

  const handleCheckOut = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toTimeString().slice(0, 5)
      await markAttendance(user.id, today, checkInTime, now, 0)
      toast.success('Checked out successfully!')
      setCheckedIn(false)
      setCheckInTime(null)
    } catch (e) {
      toast.error('Failed to check out')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 p-6">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name}!</p>
        </div>

        {/* Check In / Check Out — employees only */}
        {user?.role === ROLES.EMPLOYEE && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-4"
          >
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow: '0 4px 14px rgba(109,40,217,0.35)' }}
              >
                <Clock className="w-5 h-5" />
                Check In
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                  <span className="text-sm text-green-700 font-medium">Checked in since {checkInTime}</span>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}
                >
                  <Clock className="w-5 h-5" />
                  Check Out
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Employees', value: summary.totalEmployees, icon: Users, color: '#7C3AED', bg: '#EDE9FE' },
            { label: 'Present Today', value: summary.presentToday || presentToday, icon: Calendar, color: '#10b981', bg: '#d1fae5' },
            { label: 'Pending Leaves', value: summary.pendingLeaves || 0, icon: Clock, color: '#3b82f6', bg: '#dbeafe' },
            {
              label: 'Total Payroll Paid',
              value: `₹${(summary.totalPayroll || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
              icon: DollarSign, color: '#6366f1', bg: '#e0e7ff'
            },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Employee Cards Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Employees</h2>
            <span className="text-sm text-gray-500">{employees.length} total</span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="#3b82f6" width="12" height="12">
                <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
              </svg>
              <span>On Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span>Absent</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {employees.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No employees found</p>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Today's Attendance</h3>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={85} dataKey="value">
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
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary.monthlyPayroll.slice(0, 6).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={v => `₹${v?.toLocaleString('en-IN')}`} />
                  <Bar dataKey="total_payroll" fill="#7C3AED" name="Net Payroll" radius={[4, 4, 0, 0]} />
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
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
