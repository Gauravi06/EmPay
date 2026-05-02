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
  if (status === 'present') return <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px #10B98120', display: 'inline-block' }} title="Present" />
  if (status === 'leave') return <Plane size={13} style={{ color: '#3B82F6' }} title="On Leave" />
  return <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 0 3px #F59E0B20', display: 'inline-block' }} title="Absent" />
}

/* ─── Avatar ─── */
const Avatar = ({ first, last, size = 'md' }) => {
  const s = { sm: 32, md: 44, lg: 56 }[size] || 44
  const fs = { sm: 11, md: 13, lg: 16 }[size] || 13
  return (
    <div style={{
      width: s, height: s, borderRadius: 14,
      background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: fs, flexShrink: 0, letterSpacing: '0.5px'
    }}>
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
    present: '#10B98130', absent: '#E5E7EB', leave: '#3B82F630', weekend: '#F1F5F9',
  }[status] || '#E5E7EB'
  const bgColor = {
    present: '#F0FDF4', absent: '#fff', leave: '#EFF6FF', weekend: '#FAFAFA',
  }[status] || '#fff'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 16, border: `1.5px solid ${borderColor}`, background: bgColor,
        padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        position: 'relative', transition: 'box-shadow 0.2s ease'
      }}
    >
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <StatusDot status={status} />
      </div>

      <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="lg" />

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
          {emp.firstName || emp.first_name} {emp.lastName || emp.last_name}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{emp.department || emp.loginId || emp.login_id}</div>
      </div>

      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
          <span>Check In</span>
          <span style={{ fontWeight: 700, color: '#1E293B' }}>{rec?.check_in || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
          <span>Check Out</span>
          <span style={{ fontWeight: 700, color: '#1E293B' }}>
            {rec?.check_out
              ? rec.check_out
              : rec?.check_in
                ? <span style={{ color: '#3B82F6', fontWeight: 700 }}>In progress</span>
                : '—'}
          </span>
        </div>
        {workHrs > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>
              <span>Hours</span>
              <span style={{ fontWeight: 700, color: '#475569' }}>{fmtHours(workHrs)}</span>
            </div>
            <div style={{ height: 5, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 10, width: `${Math.min((workHrs / 9) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* View history button */}
      <button
        onClick={() => onViewHistory(emp)}
        style={{
          width: '100%', padding: '6px 0', fontSize: 12, fontWeight: 700,
          color: '#7C3AED', background: '#F5F3FF', border: 'none', borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontFamily: 'inherit', marginTop: 2
        }}
      >
        <History size={13} /> View History
      </button>
    </motion.div>
  )
}

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = {
    blue: { bg: '#EFF6FF', icon: '#3B82F6', iconBg: '#DBEAFE', val: '#1D4ED8' },
    green: { bg: '#F0FDF4', icon: '#10B981', iconBg: '#D1FAE5', val: '#059669' },
    amber: { bg: '#FFFBEB', icon: '#F59E0B', iconBg: '#FEF3C7', val: '#D97706' },
    red: { bg: '#FEF2F2', icon: '#F43F5E', iconBg: '#FEE2E2', val: '#DC2626' },
    purple: { bg: '#F5F3FF', icon: '#7C3AED', iconBg: '#EDE9FE', val: '#6D28D9' },
  }
  const c = colors[color] || colors.blue
  return (
    <motion.div whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
      style={{
        background: c.bg, borderRadius: 16, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        border: '1px solid #EBEBF5', transition: 'all 0.15s ease'
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} style={{ color: c.icon }} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: c.val, letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    Present: { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
    Late: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
    Absent: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
    'On Leave': { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    Weekend: { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
    'In Progress': { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  }
  const s = map[status] || map.Absent
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20,
      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>
      {status}
    </span>
  )
}

/* ─── Progress ring ─── */
const RingProgress = ({ pct, size = 56, stroke = 5, color = '#7C3AED' }) => {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
      background: beforeWork ? '#FFFBEB' : '#F8FAFC',
      color: beforeWork ? '#B45309' : '#64748B',
      border: `1px solid ${beforeWork ? '#FDE68A' : '#E5E7EB'}`
    }}>
      <Clock size={15} style={{ flexShrink: 0 }} />
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

  const statusColor = isCheckedOut ? '#94A3B8' : isInProgress ? '#10B981' : '#F59E0B'
  const statusBg = isCheckedOut ? '#F8FAFC' : isInProgress ? '#F0FDF4' : '#FFFBEB'
  const statusText = isCheckedOut ? 'Completed for today' : isInProgress ? 'Currently checked in' : 'Not checked in'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14
    }}>
      {/* Live clock */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
          {format(now, 'HH:mm:ss')}
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{format(now, 'EEEE, d MMMM yyyy')}</div>
        <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>Office hours: 09:00 – 18:00</div>
      </div>

      {/* Status indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
        background: statusBg, color: statusColor
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block', ...(isInProgress ? { animation: 'pulse 2s infinite' } : {}) }} />
        {statusText}
      </div>

      {/* Check in/out times */}
      {isCheckedIn && (
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
          <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Check In</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 2 }}>{todayRecord.check_in}</div>
          </div>
          <div style={{ background: '#F5F3FF', borderRadius: 12, padding: 10 }}>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Check Out</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED', marginTop: 2 }}>{todayRecord.check_out || '—'}</div>
          </div>
        </div>
      )}

      {/* Time window notice */}
      {!withinHours && !isCheckedOut && (
        <div style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: mins < WORK_START_MIN ? '#FFFBEB' : '#F8FAFC',
          color: mins < WORK_START_MIN ? '#B45309' : '#64748B',
          border: `1px solid ${mins < WORK_START_MIN ? '#FDE68A' : '#E5E7EB'}`
        }}>
          <Clock size={13} style={{ flexShrink: 0 }} />
          {mins < WORK_START_MIN ? 'Check-in available from 9:00 AM' : 'Office hours ended at 6:00 PM'}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ width: '100%', display: 'flex', gap: 10 }}>
        {!isCheckedIn && (
          <button
            onClick={handleCheckIn}
            disabled={loading || !withinHours}
            title={!withinHours ? (mins < WORK_START_MIN ? 'Check-in opens at 9:00 AM' : 'Office hours have ended') : 'Check in'}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0', background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14,
              border: 'none', cursor: loading || !withinHours ? 'not-allowed' : 'pointer',
              opacity: loading || !withinHours ? 0.4 : 1, fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)'
            }}
          >
            <LogIn size={16} /> Check In
          </button>
        )}
        {isInProgress && (
          <button
            onClick={handleCheckOut}
            disabled={loading || !withinHours}
            title={!withinHours ? 'Office hours have ended — auto checkout will apply' : 'Check out'}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 0', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
              color: '#fff', borderRadius: 12, fontWeight: 800, fontSize: 14,
              border: 'none', cursor: loading || !withinHours ? 'not-allowed' : 'pointer',
              opacity: loading || !withinHours ? 0.4 : 1, fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(124,58,237,0.25)'
            }}
          >
            <LogOut size={16} /> Check Out
          </button>
        )}
        {isCheckedOut && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 0', background: '#F8FAFC', color: '#64748B', borderRadius: 12,
            fontWeight: 700, fontSize: 14
          }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> Done for today
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
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }
  const fieldStyle = { width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#F8FAFC', fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'inherit', outline: 'none' }

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 420, margin: '0 16px', overflow: 'hidden' }}
        >
          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
              <CalendarDays size={18} />
              <span style={{ fontSize: 15, fontWeight: 800 }}>Manual Attendance Entry</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isAdminOrHR && (
              <div>
                <label style={labelStyle}>Employee</label>
                <select value={form.employee_id} onChange={e => setF('employee_id', e.target.value)} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName || e.first_name} {e.lastName || e.last_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} style={fieldStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Check In <span style={{ color: '#CBD5E1', fontWeight: 400 }}>(09:00–18:00)</span></label>
                <input type="time" value={form.check_in} min="09:00" max="18:00" onChange={e => setF('check_in', e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Check Out <span style={{ color: '#CBD5E1', fontWeight: 400 }}>(max 18:00)</span></label>
                <input type="time" value={form.check_out} min={form.check_in || '09:00'} max="18:00" onChange={e => setF('check_out', e.target.value)} style={fieldStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Break Time (minutes)</label>
              <input type="number" value={form.break_time} onChange={e => setF('break_time', parseInt(e.target.value) || 0)} style={fieldStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#475569', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
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
              style={{ flex: 1, padding: '10px 16px', background: '#7C3AED', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{emp.department || emp.loginId || emp.login_id} · Attendance History</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 24px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setMonth(m => subMonths(m, 1))} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', minWidth: 110, textAlign: 'center' }}>{format(month, 'MMMM yyyy')}</span>
            <button onClick={() => setMonth(m => addMonths(m, 1))} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronRight size={16} /></button>
          </div>
          <span style={{ fontSize: 12, color: '#64748B' }}><span style={{ fontWeight: 800, color: '#10B981' }}>{presentDays}</span> days present</span>
          <span style={{ fontSize: 12, color: '#64748B' }}><span style={{ fontWeight: 800, color: '#F59E0B' }}>{lateDays}</span> late</span>
          <span style={{ fontSize: 12, color: '#64748B' }}><span style={{ fontWeight: 800, color: '#7C3AED' }}>{fmtHours(totalHours)}</span> total hours</span>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9', position: 'sticky', top: 0, zIndex: 5 }}>
                {['Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '14px 18px' }}>
                        <div style={{ height: 14, background: '#F1F5F9', borderRadius: 6, width: j === 0 ? 120 : 70 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <CalendarDays size={36} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>No attendance records for this month</div>
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
                        style={{ borderBottom: '1px solid #F8FAFC', background: today ? '#F5F3FF' : weekend ? '#FAFAFA' : '#fff', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {today && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7C3AED', flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{format(d, 'dd MMM yyyy')}</div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>{format(d, 'EEEE')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {rec.check_in
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1E293B', fontWeight: 600 }}>
                              <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />{rec.check_in}
                            </span>
                            : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          {rec.check_out
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1E293B', fontWeight: 600 }}>
                              <CheckCircle2 size={13} style={{ color: '#3B82F6', flexShrink: 0 }} />{rec.check_out}
                            </span>
                            : rec.check_in
                              ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3B82F6', fontSize: 12, fontWeight: 700 }}><Timer size={12} /> Pending</span>
                              : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fmtHours(workHrs)}</span>
                          {workHrs > 0 && (
                            <div style={{ marginTop: 4, height: 4, width: 48, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 10, width: `${Math.min((workHrs / 9) * 100, 100)}%` }} />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 18px', fontSize: 13 }}>
                          {extraHrs > 0
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 700, fontSize: 12 }}>
                              <TrendingUp size={12} />+{fmtHours(extraHrs)}
                            </span>
                            : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 18px' }}><StatusBadge status={status} /></td>
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

/* ─── MAIN COMPONENT ─── */
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FB', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 220 }}>
        <Header />

        {/* HR Employee History Modal */}
        {historyEmp && (
          <EmployeeHistoryModal
            emp={historyEmp}
            onClose={() => setHistoryEmp(null)}
            getMonthlyAttendance={getMonthlyAttendance}
          />
        )}

        <main style={{ padding: '84px 28px 40px' }}>
          {/* ── Top bar ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Attendance</h1>
              <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 14, fontWeight: 500 }}>
                {isAdminOrHR
                  ? `Today · ${format(new Date(), 'EEEE, d MMMM yyyy')} · Office hours: 09:00 – 18:00`
                  : `${format(empMonth, 'MMMM yyyy')} overview`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 700, color: '#475569', background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Download size={15} /> Export
              </button>
              {(isAdminOrHR) && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowManual(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 800, color: '#fff', background: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
                >
                  <Plus size={15} /> Manual Entry
                </motion.button>
              )}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ════════════════════════
                ADMIN / HR VIEW
            ════════════════════════ */}
            {isAdminOrHR && (
              <>
                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  <StatCard icon={Users} label="Total Employees" value={employees.length} color="blue" />
                  <StatCard icon={UserCheck} label="Present Today" value={presentCount} color="green"
                    sub={`${employees.length > 0 ? Math.round(presentCount / employees.length * 100) : 0}% attendance`} />
                  <StatCard icon={XCircle} label="Absent Today" value={absentCount} color="red" />
                  <StatCard icon={TrendingUp} label="On Time"
                    value={`${presentCount > 0 ? Math.round(onTimeCount / presentCount * 100) : 0}%`}
                    color="purple" sub="of present employees" />
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#64748B' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 0 2px #10B98120' }} /> Present</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Plane size={13} style={{ color: '#3B82F6' }} /> On Leave</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', boxShadow: '0 0 0 2px #F59E0B20' }} /> Absent</span>
                  <span style={{ marginLeft: 8, fontStyle: 'italic', color: '#94A3B8' }}>Click "View History" on any card to see monthly records</span>
                </div>

                {/* Toolbar */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                    {/* Date nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => setAdminDate(d => subDays(d, 1))} style={{ padding: 6, border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
                        <ChevronLeft size={15} />
                      </button>
                      <input type="date" value={format(adminDate, 'yyyy-MM-dd')}
                        onChange={e => e.target.value && setAdminDate(new Date(e.target.value + 'T00:00:00'))}
                        style={{ padding: '5px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#1E293B', background: '#fff', outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={() => setAdminDate(d => addDays(d, 1))} style={{ padding: 6, border: '1.5px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    <span style={{
                      padding: '5px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8,
                      background: isToday(adminDate) ? '#F5F3FF' : '#F8FAFC',
                      color: isToday(adminDate) ? '#7C3AED' : '#475569',
                      border: `1px solid ${isToday(adminDate) ? '#DDD6FE' : '#E5E7EB'}`
                    }}>
                      {isToday(adminDate) ? 'Today · ' : ''}{format(adminDate, 'EEEE, d MMM')}
                    </span>

                    {/* View toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1.5px solid #E5E7EB', borderRadius: 10, padding: 3, background: '#F8FAFC' }}>
                      {[['cards', 'Cards'], ['table', 'Table']].map(([v, l]) => (
                        <button key={v} onClick={() => setViewMode(v)}
                          style={{
                            padding: '4px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            background: viewMode === v ? '#fff' : 'transparent',
                            color: viewMode === v ? '#7C3AED' : '#64748B',
                            boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                          }}>
                          {l}
                        </button>
                      ))}
                    </div>

                    <div style={{ flex: 1 }} />

                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type="text" placeholder="Search employee…" value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 6, paddingBottom: 6, border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#F8FAFC', width: 200, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>

                  {/* ── CARDS view ── */}
                  {viewMode === 'cards' && (
                    <div style={{ padding: 18 }}>
                      {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                          {[...Array(8)].map((_, i) => (
                            <div key={i} style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#F8FAFC', padding: 16, height: 220 }} />
                          ))}
                        </div>
                      ) : filteredEmployees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                          <AlertCircle size={36} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
                          <div style={{ fontSize: 13, color: '#94A3B8' }}>No employees found</div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
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
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9' }}>
                            {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Extra Hours', 'Status', ''].map(h => (
                              <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            [...Array(5)].map((_, i) => (
                              <tr key={i}>
                                {[...Array(7)].map((_, j) => (
                                  <td key={j} style={{ padding: '14px 18px' }}>
                                    <div style={{ height: 14, background: '#F1F5F9', borderRadius: 6, width: j === 0 ? 140 : 70 }} />
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
                              <tr key={emp.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }}>
                                <td style={{ padding: '12px 18px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</div>
                                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{emp.department || emp.loginId || emp.login_id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 18px' }}>
                                  {rec?.check_in
                                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1E293B' }}><CheckCircle2 size={13} style={{ color: '#10B981' }} />{rec.check_in}</span>
                                    : <span style={{ color: '#D1D5DB' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 18px' }}>
                                  {rec?.check_out
                                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1E293B' }}><CheckCircle2 size={13} style={{ color: '#3B82F6' }} />{rec.check_out}</span>
                                    : rec?.check_in
                                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3B82F6', fontSize: 12, fontWeight: 700 }}><Timer size={12} /> In progress</span>
                                      : <span style={{ color: '#D1D5DB' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                                  {rec?.check_in ? fmtHours(workHrs) : <span style={{ color: '#D1D5DB' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 18px', fontSize: 13 }}>
                                  {extraHrs > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 700 }}><TrendingUp size={13} />{fmtHours(extraHrs)}</span>
                                    : <span style={{ color: '#D1D5DB' }}>—</span>}
                                </td>
                                <td style={{ padding: '12px 18px' }}><StatusBadge status={status} /></td>
                                <td style={{ padding: '12px 18px' }}>
                                  <button
                                    onClick={() => setHistoryEmp(emp)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', border: 'none', padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                                  >
                                    <History size={13} /> History
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
                    <div style={{ padding: '10px 18px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 20 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Present: <span style={{ fontWeight: 800, color: '#10B981' }}>{presentCount}</span></span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Absent: <span style={{ fontWeight: 800, color: '#F43F5E' }}>{absentCount}</span></span>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Total: <span style={{ fontWeight: 800, color: '#0F172A' }}>{filteredEmployees.length}</span></span>
                      <div style={{ flex: 1 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ height: 5, width: 120, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: 10, transition: 'width 0.7s', width: `${employees.length > 0 ? (presentCount / employees.length) * 100 : 0}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  <StatCard icon={Users} label="Total Employees" value={employees.length} color="blue" />
                  <StatCard icon={UserCheck} label="Present Today" value={presentCount} color="green" />
                  <StatCard icon={XCircle} label="Absent Today" value={absentCount} color="red" />
                  <StatCard icon={TrendingUp} label="On Time"
                    value={`${presentCount > 0 ? Math.round(onTimeCount / presentCount * 100) : 0}%`} color="purple" />
                </div>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Today's Attendance — {format(new Date(), 'EEEE, d MMMM yyyy')}</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input type="text" placeholder="Search…" value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 6, paddingBottom: 6, border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#F8FAFC', width: 180, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9' }}>
                          {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map(emp => {
                          const rec = allAttendance.find(a => a.id === emp.id || a.employee_id === emp.id)
                          const status = resolveStatus(rec ? { ...rec, date: format(new Date(), 'yyyy-MM-dd') } : null)
                          return (
                            <tr key={emp.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <Avatar first={emp.firstName || emp.first_name} last={emp.lastName || emp.last_name} size="sm" />
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</div>
                                </div>
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 13, color: '#1E293B' }}>{rec?.check_in || <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                              <td style={{ padding: '12px 18px', fontSize: 13, color: '#1E293B' }}>
                                {rec?.check_out || (rec?.check_in
                                  ? <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 700 }}>In progress</span>
                                  : <span style={{ color: '#D1D5DB' }}>—</span>)}
                              </td>
                              <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fmtHours(rec?.work_hours || 0)}</td>
                              <td style={{ padding: '12px 18px' }}><StatusBadge status={status} /></td>
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
            {!isAdminOrHR && !isPayroll && (() => {
              const calDays = eachDayOfInterval({ start: startOfMonth(empMonth), end: endOfMonth(empMonth) })
              const firstDow = startOfMonth(empMonth).getDay()
              const workHrsToday = todayRecord?.work_hours || 0
              return (
                <>
                  <TimeWindowBanner now={new Date()} />

                  {/* Row 1: Quick Check-in + Currently In Office status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    {/* Quick Check-in */}
                    <CheckInOutPanel onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} todayRecord={todayRecord} loading={actionLoading} />

                    {/* Currently In Office card */}
                    <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 16, padding: 20, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.18)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                          {todayRecord?.check_in && !todayRecord?.check_out ? 'Currently In Office' : todayRecord?.check_out ? 'Day Complete' : 'Not Checked In'}
                        </span>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>{fmtHours(workHrsToday)}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Total logged time today</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                        <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>In Time</div><div style={{ fontSize: 16, fontWeight: 800 }}>{todayRecord?.check_in || '--:--'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Out Time</div><div style={{ fontSize: 16, fontWeight: 800 }}>{todayRecord?.check_out || '--:--'}</div></div>
                      </div>
                    </div>

                    {/* Attendance Rate ring */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <RingProgress pct={attendanceRate} size={90} stroke={7} color="#7C3AED" />
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#7C3AED' }}>{attendanceRate}%</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 10 }}>Attendance Rate</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{format(empMonth, 'MMMM yyyy')}</div>
                    </div>
                  </div>

                  {/* Row 2: Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    <StatCard icon={CheckCircle2} label="Present Days" value={presentDays} color="green" sub={`of ${totalWorkDays} working days`} />
                    <StatCard icon={XCircle} label="Absent Days" value={Math.max(0, totalWorkDays - presentDays - leaveCount)} color="red" />
                    <StatCard icon={AlertCircle} label="Late Marks" value={lateDays} color="amber" sub="after 9:05 AM" />
                  </div>

                  {/* Row 3: Calendar */}
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{format(empMonth, 'MMMM yyyy')}</span>
                        <button onClick={() => setEmpMonth(m => subMonths(m, 1))} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronLeft size={18} /></button>
                        <button onClick={() => setEmpMonth(m => addMonths(m, 1))} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronRight size={18} /></button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Present</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F43F5E' }} /> Absent</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> Late</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em' }}>{d}</div>
                      ))}
                      {[...Array(firstDow)].map((_, i) => <div key={`e${i}`} />)}
                      {calDays.map(day => {
                        const ds = format(day, 'yyyy-MM-dd')
                        const rec = monthlyAttendance.find(r => r.date === ds)
                        const today = isToday(day)
                        const wknd = isWeekend(day)
                        const status = rec ? resolveStatus(rec) : (day <= new Date() && !wknd ? 'Absent' : null)
                        const barColor = status === 'Present' ? '#10B981' : status === 'Late' ? '#F59E0B' : status === 'On Leave' ? '#3B82F6' : status === 'Absent' ? '#F43F5E' : null
                        return (
                          <div key={ds} style={{
                            minHeight: 64, padding: '6px 8px', borderRadius: 10,
                            border: today ? '2px solid #7C3AED' : '1px solid #F1F5F9',
                            background: today ? '#F5F3FF' : wknd ? '#FAFAFA' : '#fff',
                            position: 'relative'
                          }}>
                            <div style={{ fontSize: 13, fontWeight: today ? 900 : 600, color: wknd ? '#CBD5E1' : '#0F172A' }}>{format(day, 'd')}</div>
                            {today && <span style={{ position: 'absolute', top: 6, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#7C3AED' }} />}
                            {barColor && <div style={{ marginTop: 4, height: 3, borderRadius: 4, background: barColor }} />}
                            {rec?.check_in && <div style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{rec.check_in}{rec.check_out ? ` - ${rec.check_out}` : ''}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 4: Today's Logs */}
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EBEBF5', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Today's Logs</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', cursor: 'pointer' }}>View All History</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9' }}>
                          {['Date', 'Check In', 'Check Out', 'Working Hours', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(monthlyAttendance.length === 0 && !loading) ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>No records yet</td></tr>
                        ) : [...monthlyAttendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(rec => {
                          const d = new Date(rec.date + 'T00:00:00')
                          const status = resolveStatus(rec)
                          const statusColors = { Present: { bg: '#D1FAE5', color: '#059669' }, Late: { bg: '#FEF3C7', color: '#B45309' }, Absent: { bg: '#FEE2E2', color: '#DC2626' }, 'On Leave': { bg: '#DBEAFE', color: '#1D4ED8' }, 'In Progress': { bg: '#EDE9FE', color: '#6D28D9' } }
                          const sc = statusColors[status] || statusColors.Absent
                          return (
                            <tr key={rec.id || rec.date} style={{ borderBottom: '1px solid #F8FAFC' }}>
                              <td style={{ padding: '12px 20px' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{format(d, 'MMM dd, yyyy')}</div>
                                <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>{format(d, 'EEEE')}</div>
                              </td>
                              <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{rec.check_in || '--:--'}</td>
                              <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{rec.check_out || (rec.check_in ? 'Pending' : '--:--')}</td>
                              <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{fmtHours(rec.work_hours || 0)}</td>
                              <td style={{ padding: '12px 20px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: sc.bg, color: sc.color }}>{status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}

          </motion.div>
        </main>
      </div>

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