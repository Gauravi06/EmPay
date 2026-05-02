import React, { useState, useEffect } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, CheckCircle, XCircle, Users, Search, 
  ChevronLeft, ChevronRight, Filter, BarChart3, 
  Coffee, TrendingUp, TrendingDown, Eye 
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'

const Attendance = () => {
  const { user, employees, markAttendance, getMonthlyAttendance, getAllAttendanceForMonth, hasPermission } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [breakTime, setBreakTime] = useState(60)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'
  
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  
  const isAdminOrHR = user?.role === ROLES.ADMIN || user?.role === ROLES.HR_OFFICER
  const canEditAttendance = hasPermission(MODULES.ATTENDANCE, PERMISSIONS.EDIT)
  
  const monthlyAttendance = isAdminOrHR 
    ? getAllAttendanceForMonth(currentYear, currentMonth)
    : getMonthlyAttendance(user?.id, currentYear, currentMonth)
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })
  
  const todayAttendance = monthlyAttendance.find(att => att.date === selectedDate)
  const todayRecord = todayAttendance
  
  const handleCheckIn = () => {
    if (!checkInTime) {
      toast.error('Please select check-in time')
      return
    }
    markAttendance(user.id, selectedDate, checkInTime, null, breakTime)
    toast.success(`Checked in at ${checkInTime}`)
  }
  
  const handleCheckOut = () => {
    if (!checkOutTime) {
      toast.error('Please select check-out time')
      return
    }
    markAttendance(user.id, selectedDate, null, checkOutTime, breakTime)
    toast.success(`Checked out at ${checkOutTime}`)
  }
  
  const getAttendanceStatus = (date, attendance) => {
    const record = attendance?.find(a => a.date === date)
    if (record?.checkIn && record?.checkOut) return 'completed'
    if (record?.checkIn) return 'partial'
    if (isWeekend(date)) return 'weekend'
    return 'absent'
  }
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'weekend': return 'bg-gray-100 text-gray-500'
      default: return 'bg-red-100 text-red-800'
    }
  }
  
  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Present'
      case 'partial': return 'Partial'
      case 'weekend': return 'Weekend'
      default: return 'Absent'
    }
  }
  
  const totalWorkDays = daysInMonth.filter(day => !isWeekend(day)).length
  const presentDays = monthlyAttendance.filter(a => a.status === 'present' && a.checkIn).length
  const totalWorkHours = monthlyAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0)
  const totalOvertime = monthlyAttendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
  const attendancePercentage = totalWorkDays > 0 ? (presentDays / totalWorkDays * 100).toFixed(1) : 0
  
  const filteredAttendance = isAdminOrHR && searchTerm
    ? monthlyAttendance.filter(att => 
        att.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        att.employeeLoginId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : monthlyAttendance
  
  const groupedByEmployee = filteredAttendance.reduce((acc, att) => {
    if (!acc[att.employeeId]) {
      acc[att.employeeId] = {
        employeeId: att.employeeId,
        employeeName: att.employeeName,
        employeeLoginId: att.employeeLoginId,
        attendance: []
      }
    }
    acc[att.employeeId].attendance.push(att)
    return acc
  }, {})
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
              <p className="text-gray-600">Track and manage employee attendance</p>
            </div>
            {isAdminOrHR && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  List View
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
              <p className="text-xs text-gray-400 mt-1">Extra hours worked</p>
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
                <div 
                  className="bg-purple-600 h-1.5 rounded-full transition-all" 
                  style={{ width: `${attendancePercentage}%` }}
                ></div>
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
              <h2 className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentYear, currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {viewMode === 'calendar' && !isAdminOrHR && (
            /* Employee Calendar View */
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
                {daysInMonth.map((day, index) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const status = getAttendanceStatus(dateStr, monthlyAttendance)
                  const attendanceRecord = monthlyAttendance.find(a => a.date === dateStr)
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`bg-white p-3 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedDate === dateStr ? 'ring-2 ring-primary-500 ring-inset' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm ${isWeekend(day) ? 'text-gray-400' : 'text-gray-700'}`}>
                          {format(day, 'd')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                      {attendanceRecord?.checkIn && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div>IN: {attendanceRecord.checkIn}</div>
                          {attendanceRecord.checkOut && <div>OUT: {attendanceRecord.checkOut}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {viewMode === 'calendar' && isAdminOrHR && (
            /* Admin/HR Calendar View - Show all employees */
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name or login ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee</th>
                      {daysInMonth.slice(0, 15).map(day => (
                        <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-600">
                          {format(day, 'd')}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.values(groupedByEmployee).map((emp) => {
                      const employeeTotalPresent = emp.attendance.filter(a => a.status === 'present' && a.checkIn).length
                      return (
                        <tr key={emp.employeeId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{emp.employeeName}</p>
                              <p className="text-xs text-gray-500">{emp.employeeLoginId}</p>
                            </div>
                          </td>
                          {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd')
                            const attendance = emp.attendance.find(a => a.date === dateStr)
                            const hasCheckIn = attendance?.checkIn
                            return (
                              <td key={dateStr} className="px-2 py-3 text-center">
                                {hasCheckIn ? (
                                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </div>
                                ) : isWeekend(day) ? (
                                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-xs text-gray-400">W</span>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium text-sm">{employeeTotalPresent}</span>
                            <span className="text-xs text-gray-400">/{totalWorkDays}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Check In/Out Section for Employees */}
          {!isAdminOrHR && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Today's Attendance - {format(new Date(selectedDate), 'MMMM d, yyyy')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={todayRecord?.checkIn}
                    />
                    <button
                      onClick={handleCheckIn}
                      disabled={todayRecord?.checkIn}
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
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!todayRecord?.checkIn || todayRecord?.checkOut}
                    />
                    <button
                      onClick={handleCheckOut}
                      disabled={!todayRecord?.checkIn || todayRecord?.checkOut}
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
                    onChange={(e) => setBreakTime(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                {todayRecord && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Today's Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Check In:</span>
                        <span className="ml-2 font-medium">{todayRecord.checkIn || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Check Out:</span>
                        <span className="ml-2 font-medium">{todayRecord.checkOut || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Work Hours:</span>
                        <span className="ml-2 font-medium">{todayRecord.workHours?.toFixed(1) || '0'} hrs</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Overtime:</span>
                        <span className="ml-2 font-medium">{todayRecord.overtime?.toFixed(1) || '0'} hrs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Monthly Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Working Days</span>
                    <span className="font-medium">{totalWorkDays}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Days Present</span>
                    <span className="font-medium text-green-600">{presentDays}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Days Absent</span>
                    <span className="font-medium text-red-600">{totalWorkDays - presentDays}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Work Hours</span>
                    <span className="font-medium text-blue-600">{totalWorkHours.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Overtime Hours</span>
                    <span className="font-medium text-orange-600">{totalOvertime.toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Attendance