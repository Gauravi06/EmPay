import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Search, Plus, Download,
  Clock, CheckCircle2, XCircle, CalendarDays, TrendingUp,
  Users, UserCheck, Timer, AlertCircle, LogIn, LogOut, Plane,
  History, X
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isWeekend, addMonths, subMonths, addDays, subDays, isToday
} from 'date-fns'
import toast from 'react-hot-toast'

/* ─── helpers ─── */
const fmtHours = (h) => {
  if (!h) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs}h ${mins > 0 ? mins + 'm' : '00m'}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* Work hours: 09:00 – 18:00 */
const WORK_START = { h: 9, m: 0 }
const WORK_END = { h: 18, m: 0 }

const toMinutes = (h, m) => h * 60 + m
const WORK_START_MIN = toMinutes(WORK_START.h, WORK_START.m)
const WORK_END_MIN = toMinutes(WORK_END.h, WORK_END.m)

/** Returns current time in minutes from midnight */
const nowMinutes = () => {
  const n = new Date()
  return toMinutes(n.getHours(), n.getMinutes())
}

/* ─── Status dot ─── */
const StatusDot = ({ status }) => {
  if (status === 'present') return <span className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 inline-block" title="Present" />
  if (status === 'leave') return <Plane className="w-3.5 h-3.5 text-blue-500" title="On Leave" />
  return <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-100 inline-block" title="Absent" />
}

/* ─── Avatar ─── */
const Avatar = ({ first, last, size = 'md' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-primary-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {first?.[0]}{last?.[0]}
    </div>
  )
}

/* ─── Employee Status Card (Admin/HR grid view) ─── */
const EmployeeStatusCard = ({ emp, rec, adminDate, onViewHistory }) => {
  const resolveStatus = () => {
    if (!rec) return 'absent'
    const d = new Date((rec.date || format(adminDate, 'yyyy-MM-dd')) + 'T00:00:00')
    if (isWeekend(d)) return 'weekend'
    if (rec.status === 'leave') return 'leave'
    if (rec.check_in) return 'present'
    return 'absent'
  }
  const status = resolveStatus()
  const workHrs = rec?.work_hours || 0

  const borderColor = {
    present: 'border-green-200 bg-green-50/40',
    absent: 'border-gray-200 bg-white',
    leave: 'border-blue-200 bg-blue-50/40',
    weekend: 'border-gray-100 bg-gray-50',
  }[status] || 'border-gray-200 bg-white'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${borderColor} p-4 flex flex-col items-center gap-3 relative group hover:shadow-md transition-all duration-200`}
    >
      <div className="absolute top-3 right-3">
        <StatusDot status={status} />
      </div>

      <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="lg" />

      <div className="text-center">
        <p className="text-sm font-bold text-gray-800 leading-tight">
          {emp.firstName || emp.first_name} {emp.lastName || emp.last_name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{emp.department || emp.loginId || emp.login_id}</p>
      </div>

      <div className="w-full space-y-1 text-xs">
        <div className="flex justify-between text-gray-500">
          <span>Check In</span>
          <span className="font-semibold text-gray-700">{rec?.check_in || '—'}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Check Out</span>
          <span className="font-semibold text-gray-700">
            {rec?.check_out
              ? rec.check_out
              : rec?.check_in
                ? <span className="text-blue-500 font-semibold">In progress</span>
                : '—'}
          </span>
        </div>
        {workHrs > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-gray-400 mb-1">
              <span>Hours</span>
              <span className="font-semibold text-gray-600">{fmtHours(workHrs)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-blue-500 rounded-full"
                style={{ width: `${Math.min((workHrs / 9) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* View history button */}
      <button
        onClick={() => onViewHistory(emp)}
        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
      >
        <History className="w-3.5 h-3.5" /> View History
      </button>
    </motion.div>
  )
}

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', val: 'text-blue-700' },
    green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', val: 'text-green-700' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', val: 'text-amber-700' },
    red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', val: 'text-red-700' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', val: 'text-purple-700' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`${c.bg} bg-opacity-70 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className={`${c.icon} p-2.5 rounded-lg flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-xl font-bold ${c.val}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    Present: 'bg-green-100 text-green-700 border-green-200',
    Late: 'bg-amber-100 text-amber-700 border-amber-200',
    Absent: 'bg-red-100 text-red-700 border-red-200',
    'On Leave': 'bg-blue-100 text-blue-700 border-blue-200',
    Weekend: 'bg-gray-100 text-gray-500 border-gray-200',
    'In Progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${map[status] || map.Absent}`}>
      {status}
    </span>
  )
}

/* ─── Progress ring ─── */
const RingProgress = ({ pct, size = 56, stroke = 5, color = '#2563eb' }) => {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  )
}

/* ─── Time window banner ─── */
const TimeWindowBanner = ({ now }) => {
  const mins = toMinutes(now.getHours(), now.getMinutes())
  const beforeWork = mins < WORK_START_MIN
  const afterWork = mins >= WORK_END_MIN

  if (!beforeWork && !afterWork) return null

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
      ${beforeWork ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      <Clock className="w-4 h-4 flex-shrink-0" />
      {beforeWork
        ? `Check-in opens at 9:00 AM · Office hours: 9:00 AM – 6:00 PM`
        : `Office hours ended at 6:00 PM · See you tomorrow!`}
    </div>
  )
}

/* ─── Check In/Out Panel (Employee) ─── */
const CheckInOutPanel = ({ onCheckIn, onCheckOut, todayRecord, loading }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const mins = toMinutes(now.getHours(), now.getMinutes())
  const withinHours = mins >= WORK_START_MIN && mins < WORK_END_MIN

  const isCheckedIn = !!todayRecord?.check_in
  const isCheckedOut = !!todayRecord?.check_out
  const isInProgress = isCheckedIn && !isCheckedOut

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col items-center gap-4">
      {/* Live clock */}
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-800 tabular-nums tracking-tight">
          {format(now, 'HH:mm:ss')}
        </p>
        <p className="text-xs text-gray-400 mt-1">{format(now, 'EEEE, d MMMM yyyy')}</p>
        <p className="text-xs text-gray-300 mt-0.5">Office hours: 09:00 – 18:00</p>
      </div>

      {/* Status indicator */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
        ${isCheckedOut ? 'bg-gray-100 text-gray-600' :
          isInProgress ? 'bg-green-50 text-green-700' :
            'bg-amber-50 text-amber-700'}`}>
        <span className={`w-2 h-2 rounded-full ${isCheckedOut ? 'bg-gray-400' : isInProgress ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
        {isCheckedOut ? 'Completed for today' : isInProgress ? 'Currently checked in' : 'Not checked in'}
      </div>

      {/* Check in/out times display */}
      {isCheckedIn && (
        <div className="w-full grid grid-cols-2 gap-3 text-center">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium">Check In</p>
            <p className="text-lg font-bold text-green-700 mt-0.5">{todayRecord.check_in}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium">Check Out</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{todayRecord.check_out || '—'}</p>
          </div>
        </div>
      )}

      {/* Time window notice */}
      {!withinHours && !isCheckedOut && (
        <div className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium
          ${mins < WORK_START_MIN ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          {mins < WORK_START_MIN ? 'Check-in available from 9:00 AM' : 'Office hours ended at 6:00 PM'}
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full flex gap-3">
        {!isCheckedIn && (
          <button
            onClick={onCheckIn}
            disabled={loading || !withinHours}
            title={!withinHours ? (mins < WORK_START_MIN ? 'Check-in opens at 9:00 AM' : 'Office hours have ended') : 'Check in'}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            Check In
          </button>
        )}
        {isInProgress && (
          <button
            onClick={onCheckOut}
            disabled={loading || !withinHours}
            title={!withinHours ? 'Office hours have ended — auto checkout will apply' : 'Check out'}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            Check Out
          </button>
        )}
        {isCheckedOut && (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Done for today
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Manual Entry Modal ─── */
const ManualEntryModal = ({ onClose, onSave, userId, employees, isAdminOrHR }) => {
  const [form, setForm] = useState({
    employee_id: userId || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    check_in: '',
    check_out: '',
    break_time: 60,
  })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary-600 to-blue-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <CalendarDays className="w-5 h-5" />
              <h2 className="text-base font-bold">Manual Attendance Entry</h2>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>

          <div className="p-6 space-y-4">
            {isAdminOrHR && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Employee</label>
                <select value={form.employee_id} onChange={e => setF('employee_id', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName || e.first_name} {e.lastName || e.last_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Check In <span className="text-gray-400 font-normal">(09:00–18:00)</span></label>
                <input type="time" value={form.check_in} min="09:00" max="18:00" onChange={e => setF('check_in', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Check Out <span className="text-gray-400 font-normal">(max 18:00)</span></label>
                <input type="time" value={form.check_out} min={form.check_in || '09:00'} max="18:00" onChange={e => setF('check_out', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Break Time (minutes)</label>
              <input type="number" value={form.break_time} onChange={e => setF('break_time', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Discard
            </button>
            <button onClick={() => {
              if (!form.check_in) { toast.error('Check-in time required'); return }
              const [ciH, ciM] = form.check_in.split(':').map(Number)
              const ciMins = toMinutes(ciH, ciM)
              if (ciMins < WORK_START_MIN || ciMins >= WORK_END_MIN) {
                toast.error('Check-in must be between 09:00 and 18:00')
                return
              }
              if (form.check_out) {
                const [coH, coM] = form.check_out.split(':').map(Number)
                const coMins = toMinutes(coH, coM)
                if (coMins > WORK_END_MIN) { toast.error('Check-out cannot be after 18:00'); return }
                if (coMins <= ciMins) { toast.error('Check-out must be after check-in'); return }
              }
              onSave(form)
            }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 shadow-sm">
              Save Entry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/* ─── HR Employee History Modal ─── */
const EmployeeHistoryModal = ({ emp, onClose, getMonthlyAttendance }) => {
  const [month, setMonth] = useState(new Date())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!emp?.id) return
    setLoading(true)
    try {
      const data = await getMonthlyAttendance(emp.id, month.getFullYear(), month.getMonth() + 1)
      setRecords(data || [])
    } catch { setRecords([]) }
    finally { setLoading(false) }
  }, [emp?.id, month])

  useEffect(() => { loadHistory() }, [loadHistory])

  const resolveStatus = (rec) => {
    if (!rec) return 'Absent'
    const d = new Date(rec.date + 'T00:00:00')
    if (isWeekend(d)) return 'Weekend'
    if (rec.status === 'leave') return 'On Leave'
    if (rec.check_in && rec.check_out) {
      const [h, m] = rec.check_in.split(':').map(Number)
      return toMinutes(h, m) > toMinutes(9, 5) ? 'Late' : 'Present'
    }
    if (rec.check_in) return 'In Progress'
    return 'Absent'
  }

  const presentDays = records.filter(r => r.check_in && !isWeekend(new Date(r.date + 'T00:00:00'))).length
  const totalHours = records.reduce((s, r) => s + (r.work_hours || 0), 0)
  const lateDays = records.filter(r => {
    if (!r.check_in) return false
    const [h, m] = r.check_in.split(':').map(Number)
    return toMinutes(h, m) > toMinutes(9, 5)
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
            <div>
              <h2 className="text-base font-bold text-white">{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</h2>
              <p className="text-xs text-white/70">{emp.department || emp.loginId || emp.login_id} · Attendance History</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-6 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0 flex-wrap gap-y-2">
          <div className="flex items-center gap-1.5 text-sm">
            <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1 rounded hover:bg-gray-200 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-semibold text-gray-700 min-w-[110px] text-center">{format(month, 'MMMM yyyy')}</span>
            <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-gray-200 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <span className="text-xs text-gray-500"><span className="font-bold text-green-600">{presentDays}</span> days present</span>
          <span className="text-xs text-gray-500"><span className="font-bold text-amber-600">{lateDays}</span> late</span>
          <span className="text-xs text-gray-500"><span className="font-bold text-primary-600">{fmtHours(totalHours)}</span> total hours</span>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '120px' : '70px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No attendance records for this month</p>
                  </td>
                </tr>
              ) : (
                [...records]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map(rec => {
                    const d = new Date(rec.date + 'T00:00:00')
                    const workHrs = rec.work_hours || 0
                    const extraHrs = Math.max(0, workHrs - 9)
                    const status = resolveStatus(rec)
                    const today = isToday(d)
                    const weekend = isWeekend(d)
                    return (
                      <tr key={rec.id || rec.date}
                        className={`transition-colors ${today ? 'bg-primary-50/40' : weekend ? 'bg-gray-50/50' : 'hover:bg-blue-50/20'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {today && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{format(d, 'dd MMM yyyy')}</p>
                              <p className="text-xs text-gray-400">{format(d, 'EEEE')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {rec.check_in
                            ? <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{rec.check_in}
                            </span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {rec.check_out
                            ? <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />{rec.check_out}
                            </span>
                            : rec.check_in
                              ? <span className="flex items-center gap-1 text-blue-500 text-xs font-semibold"><Timer className="w-3 h-3" /> Pending</span>
                              : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700 font-medium">{fmtHours(workHrs)}</span>
                          {workHrs > 0 && (
                            <div className="mt-1 h-1 w-14 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                                style={{ width: `${Math.min((workHrs / 9) * 100, 100)}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm">
                          {extraHrs > 0
                            ? <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                              <TrendingUp className="w-3 h-3" />+{fmtHours(extraHrs)}
                            </span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={status} /></td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const Attendance = () => {
  const {
    user, markAttendance, checkIn, checkOut, autoCheckOut,
    getMonthlyAttendance, getTodayAttendance, fetchEmployees
  } = useAuthStore()

  const isAdminOrHR = user?.role === ROLES.ADMIN || user?.role === ROLES.HR_OFFICER
  const isPayroll = user?.role === ROLES.PAYROLL_OFFICER

  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [adminDate, setAdminDate] = useState(new Date())
  const [allAttendance, setAllAttendance] = useState([])
  const [empMonth, setEmpMonth] = useState(new Date())
  const [monthlyAttendance, setMonthlyAttendance] = useState([])
  const [viewMode, setViewMode] = useState('cards')
  const [actionLoading, setActionLoading] = useState(false)
  const [historyEmp, setHistoryEmp] = useState(null) // HR history modal

  const empYear = empMonth.getFullYear()
  const empMonthNum = empMonth.getMonth() + 1

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isAdminOrHR || isPayroll) {
        const emps = await fetchEmployees()
        setEmployees(emps || [])
        const todayData = await getTodayAttendance()
        setAllAttendance(todayData || [])
      }
      if (user?.id) {
        const data = await getMonthlyAttendance(user.id, empYear, empMonthNum)
        setMonthlyAttendance(data || [])
      }
    } catch { }
    finally { setLoading(false) }
  }, [empYear, empMonthNum, user?.id, isAdminOrHR, isPayroll])

  useEffect(() => { if (user) load() }, [load])

  // Auto check-out at 18:00 sharp
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      const n = new Date()
      if (n.getHours() === 18 && n.getMinutes() === 0 && n.getSeconds() < 60) {
        autoCheckOut().then(() => load()).catch(() => { })
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [user])

  // Today's record for employee check-in panel
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayRecord = monthlyAttendance.find(r => r.date === todayStr)

  /* ── Check In handler — enforces 09:00–18:00 ── */
  const handleCheckIn = async () => {
    const mins = nowMinutes()
    if (mins < WORK_START_MIN) {
      toast.error('Check-in is only available from 9:00 AM')
      return
    }
    if (mins >= WORK_END_MIN) {
      toast.error('Office hours have ended (6:00 PM). Cannot check in.')
      return
    }
    if (todayRecord?.check_in) {
      toast.error('You have already checked in today')
      return
    }
    setActionLoading(true)
    try {
      const now = format(new Date(), 'HH:mm')
      await checkIn(todayStr, now)
      toast.success(`Checked in at ${now}`)
      load()
    } catch (e) { toast.error(e.message || 'Failed to check in') }
    finally { setActionLoading(false) }
  }

  /* ── Check Out handler — enforces within 09:00–18:00 and must be checked in ── */
  const handleCheckOut = async () => {
    if (!todayRecord?.check_in) {
      toast.error('You have not checked in yet')
      return
    }
    if (todayRecord?.check_out) {
      toast.error('You have already checked out today')
      return
    }
    const mins = nowMinutes()
    if (mins >= WORK_END_MIN) {
      toast.error('Office hours ended at 6:00 PM. Auto check-out has been applied.')
      return
    }
    if (mins < WORK_START_MIN) {
      toast.error('Cannot check out before office hours begin')
      return
    }
    setActionLoading(true)
    try {
      const now = format(new Date(), 'HH:mm')
      await checkOut(todayStr, now)
      toast.success(`Checked out at ${now}`)
      load()
    } catch (e) { toast.error(e.message || 'Failed to check out') }
    finally { setActionLoading(false) }
  }

  const handleManualSave = async (form) => {
    try {
      const empId = (isAdminOrHR || isPayroll) ? form.employee_id : user.id
      await markAttendance(empId, form.date, form.check_in, form.check_out || null, form.break_time)
      toast.success('Attendance saved')
      setShowManual(false)
      load()
    } catch (e) { toast.error(e.message || 'Failed to save') }
  }

  /* ─── derived stats ─── */
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(empMonth), end: endOfMonth(empMonth) })
  const totalWorkDays = daysInMonth.filter(d => !isWeekend(d)).length
  const presentDays = monthlyAttendance.filter(a => {
    if (!a.check_in) return false
    return !isWeekend(new Date(a.date + 'T00:00:00'))
  }).length
  const leaveCount = monthlyAttendance.filter(a => a.status === 'leave').length
  const lateDays = monthlyAttendance.filter(a => {
    if (!a.check_in) return false
    if (isWeekend(new Date(a.date + 'T00:00:00'))) return false
    const [h, m] = a.check_in.split(':').map(Number)
    return toMinutes(h, m) > toMinutes(9, 5)
  }).length
  const attendanceRate = totalWorkDays > 0 ? Math.round(presentDays / totalWorkDays * 100) : 0
  const totalHours = monthlyAttendance.reduce((s, a) => s + (a.work_hours || 0), 0)
  const presentCount = allAttendance.filter(a => a.check_in).length
  const absentCount = employees.length - presentCount

  const filteredEmployees = employees.filter(e =>
    !searchTerm ||
    `${e.firstName || e.first_name} ${e.lastName || e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.loginId || e.login_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resolveStatus = (rec) => {
    if (!rec) return 'Absent'
    const d = new Date(rec.date + 'T00:00:00')
    if (isWeekend(d)) return 'Weekend'
    if (rec.status === 'leave') return 'On Leave'
    if (rec.check_in && rec.check_out) {
      const [h, m] = rec.check_in.split(':').map(Number)
      return toMinutes(h, m) > toMinutes(9, 5) ? 'Late' : 'Present'
    }
    if (rec.check_in) return 'In Progress'
    return 'Absent'
  }

  const onTimeCount = allAttendance.filter(a => {
    if (!a.check_in) return false
    const [h, m] = a.check_in.split(':').map(Number)
    return toMinutes(h, m) <= toMinutes(9, 5)
  }).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar />
      <Header />

      {/* HR Employee History Modal */}
      {historyEmp && (
        <EmployeeHistoryModal
          emp={historyEmp}
          onClose={() => setHistoryEmp(null)}
          getMonthlyAttendance={getMonthlyAttendance}
        />
      )}

      <main className="pt-16 min-h-screen" style={{ marginLeft: 220 }}>
        {/* ── Top bar ── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Attendance</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdminOrHR
                ? `Today · ${format(new Date(), 'EEEE, d MMMM yyyy')} · Office hours: 09:00 – 18:00`
                : `${format(empMonth, 'MMMM yyyy')} overview`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            {(isAdminOrHR) && (
              <button
                onClick={() => setShowManual(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-500 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" /> Manual Entry
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* ════════════════════════
                ADMIN / HR VIEW
            ════════════════════════ */}
            {isAdminOrHR && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Employees" value={employees.length} color="blue" />
                  <StatCard icon={UserCheck} label="Present Today" value={presentCount} color="green"
                    sub={`${employees.length > 0 ? Math.round(presentCount / employees.length * 100) : 0}% attendance`} />
                  <StatCard icon={XCircle} label="Absent Today" value={absentCount} color="red" />
                  <StatCard icon={TrendingUp} label="On Time"
                    value={`${presentCount > 0 ? Math.round(onTimeCount / presentCount * 100) : 0}%`}
                    color="purple" sub="of present employees" />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 inline-block" /> Present</span>
                  <span className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5 text-blue-500" /> On Leave</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-100 inline-block" /> Absent</span>
                  <span className="flex items-center gap-1.5 ml-2 text-gray-400 italic">Click "View History" on any card to see monthly records</span>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-wrap gap-y-2">
                    {/* Date nav */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAdminDate(d => subDays(d, 1))}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <input type="date" value={format(adminDate, 'yyyy-MM-dd')}
                        onChange={e => e.target.value && setAdminDate(new Date(e.target.value + 'T00:00:00'))}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary-500/20" />
                      <button onClick={() => setAdminDate(d => addDays(d, 1))}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg border
                      ${isToday(adminDate) ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {isToday(adminDate) ? 'Today · ' : ''}{format(adminDate, 'EEEE, d MMM')}
                    </span>

                    {/* View toggle */}
                    <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 bg-gray-50">
                      {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
                        <button key={v} onClick={() => setViewMode(v)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all
                            ${viewMode === v ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          {l}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1" />

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" placeholder="Search employee…" value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-gray-50 w-52 outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                  </div>

                  {/* ── CARDS view ── */}
                  {viewMode === 'cards' && (
                    <div className="p-5">
                      {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 h-64 animate-pulse" />
                          ))}
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-16">
                          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No employees found</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredEmployees.map((emp, i) => {
                            const rec = allAttendance.find(a => a.id === emp.id || a.employee_id === emp.id)
                            return (
                              <motion.div
                                key={emp.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                              >
                                <EmployeeStatusCard
                                  emp={emp}
                                  rec={rec}
                                  adminDate={adminDate}
                                  onViewHistory={setHistoryEmp}
                                />
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TABLE view ── */}
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Extra Hours', 'Status', ''].map(h => (
                              <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {loading ? (
                            [...Array(5)].map((_, i) => (
                              <tr key={i}>
                                {[...Array(7)].map((_, j) => (
                                  <td key={j} className="px-5 py-4">
                                    <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '70px' }} />
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : filteredEmployees.map(emp => {
                            const rec = allAttendance.find(a => a.id === emp.id || a.employee_id === emp.id)
                            const workHrs = rec?.work_hours || 0
                            const extraHrs = Math.max(0, workHrs - 9)
                            const status = resolveStatus(rec ? { ...rec, date: format(adminDate, 'yyyy-MM-dd') } : null)
                            return (
                              <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</p>
                                      <p className="text-xs text-gray-400">{emp.department || emp.loginId || emp.login_id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  {rec?.check_in
                                    ? <span className="flex items-center gap-1.5 text-sm text-gray-700"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{rec.check_in}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-5 py-4">
                                  {rec?.check_out
                                    ? <span className="flex items-center gap-1.5 text-sm text-gray-700"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />{rec.check_out}</span>
                                    : rec?.check_in
                                      ? <span className="flex items-center gap-1 text-blue-500 text-xs font-semibold"><Timer className="w-3 h-3" /> In progress</span>
                                      : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-5 py-4 text-sm text-gray-700 font-medium">
                                  {rec?.check_in ? fmtHours(workHrs) : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-5 py-4 text-sm">
                                  {extraHrs > 0
                                    ? <span className="flex items-center gap-1 text-green-600 font-semibold"><TrendingUp className="w-3.5 h-3.5" />{fmtHours(extraHrs)}</span>
                                    : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-5 py-4"><StatusBadge status={status} /></td>
                                <td className="px-5 py-4">
                                  <button
                                    onClick={() => setHistoryEmp(emp)}
                                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    <History className="w-3.5 h-3.5" /> History
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!loading && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6">
                      <span className="text-xs text-gray-500">Present: <span className="font-bold text-green-600">{presentCount}</span></span>
                      <span className="text-xs text-gray-500">Absent: <span className="font-bold text-red-500">{absentCount}</span></span>
                      <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-700">{filteredEmployees.length}</span></span>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
                            style={{ width: `${employees.length > 0 ? (presentCount / employees.length) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {employees.length > 0 ? Math.round(presentCount / employees.length * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ════════════════════════
                PAYROLL OFFICER VIEW (read-only)
            ════════════════════════ */}
            {isPayroll && !isAdminOrHR && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Employees" value={employees.length} color="blue" />
                  <StatCard icon={UserCheck} label="Present Today" value={presentCount} color="green" />
                  <StatCard icon={XCircle} label="Absent Today" value={absentCount} color="red" />
                  <StatCard icon={TrendingUp} label="On Time"
                    value={`${presentCount > 0 ? Math.round(onTimeCount / presentCount * 100) : 0}%`} color="purple" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-700">Today's Attendance — {format(new Date(), 'EEEE, d MMMM yyyy')}</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" placeholder="Search…" value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-sm bg-gray-50 w-48 outline-none" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Status'].map(h => (
                            <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredEmployees.map(emp => {
                          const rec = allAttendance.find(a => a.id === emp.id || a.employee_id === emp.id)
                          const status = resolveStatus(rec ? { ...rec, date: format(new Date(), 'yyyy-MM-dd') } : null)
                          return (
                            <tr key={emp.id} className="hover:bg-blue-50/20 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
                                  <p className="text-sm font-semibold text-gray-800">{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</p>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700">{rec?.check_in || <span className="text-gray-300">—</span>}</td>
                              <td className="px-5 py-4 text-sm text-gray-700">
                                {rec?.check_out || (rec?.check_in
                                  ? <span className="text-blue-500 text-xs font-semibold">In progress</span>
                                  : <span className="text-gray-300">—</span>)}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700 font-medium">{fmtHours(rec?.work_hours || 0)}</td>
                              <td className="px-5 py-4"><StatusBadge status={status} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════════
                EMPLOYEE VIEW
            ════════════════════════ */}
            {!isAdminOrHR && !isPayroll && (
              <>
                {/* Time window banner */}
                <TimeWindowBanner now={new Date()} />

                {/* Top row: Check-in panel + Stat cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <CheckInOutPanel
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    todayRecord={todayRecord}
                    loading={actionLoading}
                  />

                  <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
                    <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <RingProgress pct={attendanceRate} size={72} stroke={6} color="#2563eb" />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-600">
                          {attendanceRate}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">Attendance Rate</p>
                        <p className="text-xs text-gray-400 mt-0.5">{format(empMonth, 'MMMM yyyy')}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500"><span className="font-bold text-green-600">{presentDays}</span> present</span>
                          <span className="text-xs text-gray-500"><span className="font-bold text-amber-600">{lateDays}</span> late</span>
                          <span className="text-xs text-gray-500"><span className="font-bold text-blue-600">{leaveCount}</span> leaves</span>
                        </div>
                      </div>
                    </div>

                    <StatCard icon={CheckCircle2} label="Days Present" value={presentDays} color="green" sub={`of ${totalWorkDays} working days`} />
                    <StatCard icon={TrendingUp} label="Total Hours" value={fmtHours(totalHours)} color="purple" sub="logged this month" />
                    <StatCard icon={Clock} label="Leave Taken" value={leaveCount} color="blue" sub="this month" />
                    <StatCard icon={AlertCircle} label="Late Arrivals" value={lateDays} color="amber" sub="after 9:05 AM" />
                  </div>
                </div>

                {/* Monthly history table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-wrap gap-y-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEmpMonth(m => subMonths(m, 1))}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEmpMonth(m => addMonths(m, 1))}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <select value={empMonth.getMonth()} onChange={e => setEmpMonth(new Date(empMonth.getFullYear(), parseInt(e.target.value), 1))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary-500/20">
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select value={empYear} onChange={e => setEmpMonth(new Date(parseInt(e.target.value), empMonth.getMonth(), 1))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-primary-500/20">
                      {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <div className="flex-1" />
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { label: 'Present', cls: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-500', val: presentDays },
                        { label: 'Leaves', cls: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500', val: leaveCount },
                        { label: 'Late', cls: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500', val: lateDays },
                      ].map(({ label, cls, dot, val }) => (
                        <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold ${cls}`}>
                          <span className={`w-2 h-2 rounded-full ${dot}`} />{val} {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime', 'Status'].map(h => (
                            <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          [...Array(6)].map((_, i) => (
                            <tr key={i}>{[...Array(6)].map((_, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '100px' : '70px' }} />
                              </td>
                            ))}</tr>
                          ))
                        ) : monthlyAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-16">
                              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-400 text-sm">No records for this month</p>
                            </td>
                          </tr>
                        ) : (
                          [...monthlyAttendance]
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map(rec => {
                              const d = new Date(rec.date + 'T00:00:00')
                              const workHrs = rec.work_hours || 0
                              const extraHrs = Math.max(0, workHrs - 9)
                              const status = resolveStatus(rec)
                              const today = isToday(d)
                              return (
                                <tr key={rec.id || rec.date}
                                  className={`hover:bg-blue-50/30 transition-colors ${today ? 'bg-primary-50/40' : ''}`}>
                                  <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      {today && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                                      <div>
                                        <p className="text-sm font-semibold text-gray-800">{format(d, 'dd MMM yyyy')}</p>
                                        <p className="text-xs text-gray-400">{format(d, 'EEEE')}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    {rec.check_in
                                      ? <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />{rec.check_in}
                                      </span>
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-5 py-4">
                                    {rec.check_out
                                      ? <span className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />{rec.check_out}
                                      </span>
                                      : rec.check_in
                                        ? <span className="flex items-center gap-1 text-blue-500 text-xs font-semibold"><Timer className="w-3 h-3" /> Pending</span>
                                        : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-sm text-gray-700 font-medium">{fmtHours(workHrs)}</span>
                                    {workHrs > 0 && (
                                      <div className="mt-1 h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                                          style={{ width: `${Math.min((workHrs / 9) * 100, 100)}%` }} />
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-5 py-4 text-sm">
                                    {extraHrs > 0
                                      ? <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                                        <TrendingUp className="w-3 h-3" />+{fmtHours(extraHrs)}
                                      </span>
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-5 py-4"><StatusBadge status={status} /></td>
                                </tr>
                              )
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!loading && monthlyAttendance.length > 0 && (
                    <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center gap-6">
                      <span className="text-xs text-gray-500">
                        Total hours: <span className="font-bold text-gray-700">{fmtHours(totalHours)}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        Attendance rate: <span className="font-bold text-primary-600">{attendanceRate}%</span>
                      </span>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                            style={{ width: `${attendanceRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{attendanceRate}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </motion.div>
        </div>
      </main>

      {/* Manual Entry Modal */}
      {showManual && (
        <ManualEntryModal
          onClose={() => setShowManual(false)}
          onSave={handleManualSave}
          userId={user?.id}
          employees={employees}
          isAdminOrHR={isAdminOrHR}
        />
      )}
    </div>
  )
}

export default Attendance