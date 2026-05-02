import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  Calendar, Clock, CheckCircle, XCircle, Users, Search,
  ChevronLeft, ChevronRight, BarChart3, Coffee, TrendingUp
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'

const Attendance = () => {
  const {
    user, markAttendance, getMonthlyAttendance, getTodayAttendance,
    getAttendance, hasPermission, fetchEmployees
  } = useAuthStore()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [breakTime, setBreakTime] = useState(60)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('calendar')
  const [monthlyAttendance, setMonthlyAttendance] = useState([])
  const [allEmployeesAttendance, setAllEmployeesAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const isAdminOrHR = user?.role === ROLES.ADMIN || user?.role === ROLES.HR_OFFICER

  const loadAttendance = useCallback(async () => {
    setLoading(true)
    try {
      if (isAdminOrHR) {
        // Fetch all employees and their attendance
        const emps = await fetchEmployees()
        setEmployees(emps || [])
        // Fetch today's attendance for overview
        const todayData = await getTodayAttendance()
        setAllEmployeesAttendance(todayData || [])
        // Also fetch monthly for stats
        if (user?.id) {
          const data = await getMonthlyAttendance(user.id, currentYear, currentMonth)
          setMonthlyAttendance(data || [])
        }
      } else {
        const data = await getMonthlyAttendance(user.id, currentYear, currentMonth)
        setMonthlyAttendance(data || [])
      }
    } catch (e) {
      // Silently handle - user will see empty state
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth, user?.id, isAdminOrHR])

  useEffect(() => {
    if (user) loadAttendance()
  }, [loadAttendance])

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const todayRecord = monthlyAttendance.find(a => a.date === selectedDate)

  const handleCheckIn = async () => {
    if (!checkInTime) { toast.error('Please select check-in time'); return }
    try {
      await markAttendance(user.id, selectedDate, checkInTime, null, breakTime)
      toast.success(`Checked in at ${checkInTime}`)
      loadAttendance()
    } catch (e) {
      toast.error(e.message || 'Failed to check in')
    }
  }

  const handleCheckOut = async () => {
    if (!checkOutTime) { toast.error('Please select check-out time'); return }
    try {
      await markAttendance(user.id, selectedDate, todayRecord?.check_in || null, checkOutTime, breakTime)
      toast.success(`Checked out at ${checkOutTime}`)
      loadAttendance()
    } catch (e) {
      toast.error(e.message || 'Failed to check out')
    }
  }

  const getAttendanceStatus = (dateStr) => {
    const record = monthlyAttendance.find(a => a.date === dateStr)
    const day = new Date(dateStr + 'T00:00:00')
    if (record?.check_in && record?.check_out) return 'completed'
    if (record?.check_in) return 'partial'
    if (isWeekend(day)) return 'weekend'
    return 'absent'
  }

  const getStatusColor = (status) => ({
    completed: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    weekend: 'bg-gray-100 text-gray-500',
    absent: 'bg-red-100 text-red-800'
  }[status] || 'bg-red-100 text-red-800')

  const getStatusText = (status) => ({
    completed: 'Present', partial: 'Partial', weekend: 'Weekend', absent: 'Absent'
  }[status] || 'Absent')

  const totalWorkDays = daysInMonth.filter(d => !isWeekend(d)).length
  const presentDays = monthlyAttendance.filter(a => a.status === 'present' && a.check_in).length
  const totalWorkHours = monthlyAttendance.reduce((s, a) => s + (a.work_hours || 0), 0)
  const totalOvertime = monthlyAttendance.reduce((s, a) => s + (a.overtime || 0), 0)
  const attendancePercentage = totalWorkDays > 0 ? (presentDays / totalWorkDays * 100).toFixed(1) : 0

  const filteredEmployees = employees.filter(e =>
    !searchTerm ||
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.login_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
              <p className="text-gray-600">Track and manage employee attendance</p>
            </div>
            {isAdminOrHR && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  <Calendar className="w-4 h-4" /> Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  <Users className="w-4 h-4" /> Today's Overview
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-400 mt-1">out of {totalWorkDays} days</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Work Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{totalWorkHours.toFixed(1)}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Total this month</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Overtime</p>
                  <p className="text-2xl font-bold text-orange-600">{totalOvertime.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Extra hours</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Attendance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{attendancePercentage}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${attendancePercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Month Selector */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 2, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              Loading attendance data...
            </div>
          ) : (
            <>
              {/* Admin/HR — Today's Overview (list mode) */}
              {isAdminOrHR && viewMode === 'list' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Today's Attendance — {format(new Date(), 'MMMM d, yyyy')}</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name or login ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Check In</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Check Out</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Work Hours</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredEmployees.map(emp => {
                          const rec = allEmployeesAttendance.find(a => a.id === emp.id)
                          const status = rec?.check_in ? (rec.check_out ? 'Present' : 'Checked In') : 'Absent'
                          return (
                            <tr key={emp.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-800 text-sm">{emp.first_name} {emp.last_name}</p>
                                <p className="text-xs text-gray-500">{emp.login_id}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                              <td className="px-4 py-3 text-center text-sm">{rec?.check_in || '—'}</td>
                              <td className="px-4 py-3 text-center text-sm">{rec?.check_out || '—'}</td>
                              <td className="px-4 py-3 text-center text-sm">{rec?.work_hours ? `${Number(rec.work_hours).toFixed(1)} hrs` : '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status === 'Present' ? 'bg-green-100 text-green-700' :
                                    status === 'Checked In' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                  }`}>{status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredEmployees.length === 0 && (
                      <p className="text-center text-gray-400 py-8">No employees found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin/HR — Calendar view showing monthly grid */}
              {isAdminOrHR && viewMode === 'calendar' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">{d}</div>
                    ))}
                    {/* Empty cells for first week offset */}
                    {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-white p-3 min-h-[80px]" />
                    ))}
                    {daysInMonth.map((day, idx) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const weekend = isWeekend(day)
                      const presentCount = allEmployeesAttendance.filter(a => a.check_in).length
                      const isToday = dateStr === todayStr
                      return (
                        <div key={idx} className={`bg-white p-2 min-h-[80px] ${weekend ? 'bg-gray-50' : ''} ${isToday ? 'ring-2 ring-inset ring-indigo-400' : ''}`}>
                          <span className={`text-sm font-medium ${weekend ? 'text-gray-400' : 'text-gray-700'} ${isToday ? 'text-indigo-600' : ''}`}>
                            {format(day, 'd')}
                          </span>
                          {isToday && !weekend && (
                            <div className="mt-1">
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                {presentCount} present
                              </span>
                            </div>
                          )}
                          {weekend && <div className="text-xs text-gray-400 mt-1">Weekend</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Employee View */}
              {!isAdminOrHR && (
                <>
                  {/* Employee Calendar */}
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="grid grid-cols-7 gap-px bg-gray-200">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">{d}</div>
                      ))}
                      {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white p-3 min-h-[80px]" />
                      ))}
                      {daysInMonth.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const status = getAttendanceStatus(dateStr)
                        const rec = monthlyAttendance.find(a => a.date === dateStr)
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`bg-white p-2 min-h-[90px] cursor-pointer hover:bg-gray-50 transition-colors ${selectedDate === dateStr ? 'ring-2 ring-inset ring-indigo-500' : ''
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-sm ${isWeekend(day) ? 'text-gray-400' : 'text-gray-700'}`}>
                                {format(day, 'd')}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </div>
                            {rec?.check_in && (
                              <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                                <div>IN: {rec.check_in}</div>
                                {rec.check_out && <div>OUT: {rec.check_out}</div>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Check In/Out Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Attendance — {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                          <input
                            type="time"
                            value={checkInTime}
                            onChange={e => setCheckInTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            disabled={!!todayRecord?.check_in}
                          />
                          <button
                            onClick={handleCheckIn}
                            disabled={!!todayRecord?.check_in}
                            className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            Check In
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
                          <input
                            type="time"
                            value={checkOutTime}
                            onChange={e => setCheckOutTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            disabled={!todayRecord?.check_in || !!todayRecord?.check_out}
                          />
                          <button
                            onClick={handleCheckOut}
                            disabled={!todayRecord?.check_in || !!todayRecord?.check_out}
                            className="mt-2 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Check Out
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Break Time (minutes)</label>
                        <input
                          type="number"
                          value={breakTime}
                          onChange={e => setBreakTime(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      {todayRecord && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-gray-500">Check In:</span> <span className="font-medium">{todayRecord.check_in || '—'}</span></div>
                            <div><span className="text-gray-500">Check Out:</span> <span className="font-medium">{todayRecord.check_out || '—'}</span></div>
                            <div><span className="text-gray-500">Work Hours:</span> <span className="font-medium">{Number(todayRecord.work_hours || 0).toFixed(1)} hrs</span></div>
                            <div><span className="text-gray-500">Overtime:</span> <span className="font-medium">{Number(todayRecord.overtime || 0).toFixed(1)} hrs</span></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Coffee className="w-5 h-5" /> Monthly Summary
                      </h3>
                      <div className="space-y-3">
                        {[
                          ['Total Working Days', totalWorkDays, 'text-gray-800'],
                          ['Days Present', presentDays, 'text-green-600'],
                          ['Days Absent', totalWorkDays - presentDays, 'text-red-600'],
                          ['Total Work Hours', `${totalWorkHours.toFixed(1)} hrs`, 'text-blue-600'],
                          ['Overtime Hours', `${totalOvertime.toFixed(1)} hrs`, 'text-orange-600'],
                        ].map(([label, value, color]) => (
                          <div key={label} className="flex justify-between py-2 border-b">
                            <span className="text-gray-600 text-sm">{label}</span>
                            <span className={`font-medium text-sm ${color}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default Attendance