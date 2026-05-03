import React, { useEffect, useState, useCallback } from 'react'
import { useAuthStore, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Clock, Calendar, Award, BarChart3, Shield, Key, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000/api'

const PIE_COLORS  = ['#7C3AED', '#38BDF8', '#FB923C', '#10B981', '#F43F5E', '#F59E0B']
const card        = { background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #EBEBF5' }
const btnPrimary  = { padding: '9px 18px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }
const btnOutline  = { padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#111827', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }
const statusColor = s => ({ approved: '#10B981', rejected: '#EF4444', pending: '#F59E0B' }[s] || '#9CA3AF')

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: color + '15', color, whiteSpace: 'nowrap', border: `1px solid ${color}30` }}>{label}</span>
)

const StatCard = ({ title, value, icon, badge, badgeColor, loading }) => (
  <motion.div whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }} transition={{ duration: 0.18 }}
    style={{ ...card, flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <Badge label={badge} color={badgeColor} />
    </div>
    <div style={{ fontSize: 12, fontWeight: 800, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
    {loading
      ? <div style={{ height: 36, width: 110, background: '#F3F4F6', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
      : <div style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>}
  </motion.div>
)

function AttendanceChart({ barData, label, subtitle, isPayroll }) {
  const [hovered, setHovered] = useState(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [barData])

  const W = 580, H = 230, padL = 38, padR = 20, padT = 14, padB = 36
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const maxVal = Math.max(...barData.map(d => d.value), 1)
  const barW   = Math.min(34, (chartW / barData.length) * 0.52)
  const gap    = chartW / barData.length
  const peakIdx = barData.reduce((pi, d, i) => d.value > barData[pi].value ? i : pi, 0)
  const yTicks  = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: Math.round(maxVal * f), y: padT + chartH * (1 - f) }))
  const pts     = barData.map((d, i) => ({
    x: padL + gap * i + gap / 2,
    y: padT + chartH * (1 - (animated ? d.value : 0) / maxVal),
  }))

  return (
    <div style={{ ...card, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 20, left: 30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.4px' }}>{isPayroll ? 'Payroll Overview' : 'Attendance Overview'}</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 3, fontWeight: 500 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7C3AED', display: 'inline-block', boxShadow: '0 0 0 3px rgba(124,58,237,0.2)' }} /> Peak
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 12px' }}>{label}</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block', marginTop: 6 }}>
        <defs>
          <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="normGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#C4B5FD" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="hovGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
          <filter id="peakGlow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="dropShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.25" /></filter>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={t.y} y2={t.y} stroke={i === 0 ? '#E2E8F0' : '#F1F5F9'} strokeWidth={i === 0 ? 1.5 : 1} strokeDasharray={i === 0 ? 'none' : '5 4'} />
            <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize={10} fill="#94A3B8" fontWeight={600}>{t.val}</text>
          </g>
        ))}

        {barData.length > 1 && (() => {
          const area = `M${pts[0].x},${padT + chartH} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${padT + chartH} Z`
          const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
          return (
            <g>
              <path d={area} fill="url(#areaFill)" />
              <path d={line} fill="none" stroke="#7C3AED" strokeWidth={1.8} strokeOpacity={0.35} strokeDasharray="6 3" strokeLinecap="round" />
            </g>
          )
        })()}

        {barData.map((d, i) => {
          const cx    = padL + gap * i + gap / 2
          const x     = cx - barW / 2
          const bh    = animated ? Math.max(5, (d.value / maxVal) * chartH) : 5
          const y     = padT + chartH - bh
          const isPeak = i === peakIdx
          const isHov  = hovered === i
          const grad   = isPeak ? 'url(#peakGrad)' : isHov ? 'url(#hovGrad)' : 'url(#normGrad)'
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              {isPeak && <rect x={x + 3} y={y + 6} width={barW} height={bh} rx={9} fill="#7C3AED" opacity={0.18} style={{ filter: 'blur(8px)' }} />}
              <rect x={x} y={y} width={barW} height={bh} rx={9} fill={grad} filter={isPeak ? 'url(#dropShadow)' : undefined} style={{ transition: 'all 0.55s cubic-bezier(0.34,1.56,0.64,1)', opacity: isHov || isPeak ? 1 : 0.85 }} />
              {isPeak && <circle cx={cx} cy={y - 8} r={4} fill="#7C3AED" filter="url(#peakGlow)" />}
              {(isHov || isPeak) && (
                <g>
                  <rect x={cx - 24} y={y - 34} width={48} height={24} rx={7} fill={isPeak ? '#7C3AED' : '#1E293B'} />
                  <text x={cx} y={y - 18} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
                    {isPayroll ? `₹${Math.round(d.value / 1000)}k` : d.value}
                  </text>
                  <polygon points={`${cx - 5},${y - 10} ${cx + 5},${y - 10} ${cx},${y - 3}`} fill={isPeak ? '#7C3AED' : '#1E293B'} />
                </g>
              )}
              <text x={cx} y={H - 4} textAnchor="middle" fontSize={11} fill={isPeak ? '#7C3AED' : '#64748B'} fontWeight={isPeak ? 800 : 500}>{d.name}</text>
            </g>
          )
        })}

        {pts.map((p, i) => {
          const isPeak = i === peakIdx
          return (
            <circle key={i} cx={p.x} cy={p.y} r={isPeak ? 5.5 : 3}
              fill={isPeak ? '#7C3AED' : '#fff'}
              stroke={isPeak ? '#fff' : '#A78BFA'}
              strokeWidth={isPeak ? 2.5 : 1.5}
              filter={isPeak ? 'url(#peakGlow)' : undefined}
            />
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 24, paddingTop: 10, borderTop: '1px solid #F1F5F9', marginTop: 2 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Peak Period</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED', marginTop: 1 }}>{barData[peakIdx]?.name} · {isPayroll ? `₹${Math.round((barData[peakIdx]?.value || 0) / 1000)}k` : `${barData[peakIdx]?.value} emp`}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Average</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
            {isPayroll ? `₹${Math.round(barData.reduce((s, d) => s + d.value, 0) / barData.length / 1000)}k` : `${Math.round(barData.reduce((s, d) => s + d.value, 0) / barData.length)} emp`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Points</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 1 }}>{barData.length} entries</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, checkIn, checkOut, autoCheckOut, getTodayAttendance, fetchEmployees, fetchReportsSummary, fetchTimeOffRequests, hasPermission, approveTimeOff } = useAuthStore()
  const navigate = useNavigate()

  const [state, setState] = useState({
    employees: [], todayAtt: [], leaveRequests: [],
    summary: { totalEmployees: 0, presentToday: 0, pendingLeaves: 0, totalPayroll: 0, monthlyPayrollCost: 0, monthlyPayroll: [], departmentDistribution: [], attendanceTrend: [] },
    checkedIn: false, checkInTime: null, loading: true,
  })

  const [announcements, setAnnouncements]           = useState([])
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [annTitle, setAnnTitle]                     = useState('')
  const [annBody, setAnnBody]                       = useState('')

  const isAdmin = user?.role === 'admin'
  const set     = patch => setState(s => ({ ...s, ...patch }))

  useEffect(() => {
    if (!user) return
    const iv = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 18 && now.getMinutes() === 0)
        autoCheckOut().then(() => set({ checkedIn: false, checkInTime: null })).catch(() => {})
    }, 60000)
    return () => clearInterval(iv)
  }, [user])

  const loadAnnouncements = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/announcements`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      })
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch {}
  }, [])

  const load = useCallback(async () => {
    set({ loading: true })
    try {
      const [att, emps, leaves] = await Promise.all([
        getTodayAttendance().catch(() => []),
        fetchEmployees().catch(() => []),
        fetchTimeOffRequests().catch(() => []),
      ])
      let summary = { totalEmployees: (emps || []).length, presentToday: 0, pendingLeaves: 0, totalPayroll: 0, monthlyPayrollCost: 0, monthlyPayroll: [], departmentDistribution: [], attendanceTrend: [] }
      if (hasPermission('reports', 'view')) {
        try { summary = await fetchReportsSummary() } catch (_) {}
      }
      const my = (att || []).find(a => a.user_id === user?.id)
      set({ employees: emps || [], todayAtt: att || [], leaveRequests: (leaves || []).slice(0, 5), summary, checkedIn: !!my?.check_in, checkInTime: my?.check_in || null, loading: false })
    } catch (e) { console.error(e); set({ loading: false }) }
  }, [user])

  useEffect(() => { load(); loadAnnouncements() }, [load, loadAnnouncements])

  const WORK_START_MIN = 9 * 60
  const WORK_END_MIN = 18 * 60
  const nowMins = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes() }

  const handleCheckIn = async () => {
    const mins = nowMins()
    if (mins < WORK_START_MIN) { toast.error('Check-in opens at 9:00 AM'); return }
    if (mins >= WORK_END_MIN) { toast.error('Office hours ended at 6:00 PM'); return }
    try {
      const today = new Date().toISOString().split('T')[0], now = new Date().toTimeString().slice(0, 5)
      await checkIn(today, now); set({ checkedIn: true, checkInTime: now }); toast.success('Checked in!')
    } catch (e) { toast.error(e.message || 'Failed') }
  }

  const handleCheckOut = async () => {
    const mins = nowMins()
    if (mins >= WORK_END_MIN) { toast.error('Auto check-out applied at 6:00 PM'); return }
    try {
      const today = new Date().toISOString().split('T')[0], now = new Date().toTimeString().slice(0, 5)
      await checkOut(today, now); set({ checkedIn: false, checkInTime: null }); toast.success('Checked out!')
    } catch (e) { toast.error(e.message || 'Failed') }
  }

  const handleApprove = async (id, approved) => {
    try {
      await approveTimeOff(id, approved)
      toast.success(approved ? 'Leave approved' : 'Leave rejected')
      load()
    } catch (e) { toast.error(e.message || 'Failed') }
  }

  const postAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return
    try {
      await fetch(`${API_BASE}/announcements`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ title: annTitle, body: annBody }),
      })
      setAnnTitle('')
      setAnnBody('')
      setShowAnnouncementForm(false)
      loadAnnouncements()
      toast.success('Announcement posted!')
    } catch { toast.error('Failed to post announcement') }
  }

  const handleExportReport = () => {
    // FIX: destructure from state inside handler to avoid stale closure
    const { employees, todayAtt, leaveRequests, summary } = state
    const _presentCount = todayAtt.filter(a => a.status === 'present').length
    const rows = [
      ['Metric', 'Value'],
      ['Total Employees', summary.totalEmployees || employees.length],
      ['Present Today', summary.presentToday ?? _presentCount],
      ['Pending Leaves', summary.pendingLeaves ?? leaveRequests.filter(l => l.status === 'pending').length],
      ['Monthly Payroll Cost', summary.monthlyPayrollCost || summary.totalPayroll || 0],
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `empay-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Report exported!')
  }

  const { employees, todayAtt, leaveRequests, summary, checkedIn, checkInTime, loading } = state
  const presentCount = todayAtt.filter(a => a.status === 'present').length

  const barData = summary.attendanceTrend?.length > 0
    ? summary.attendanceTrend.map(d => ({ name: d.name?.slice(5), value: d.present || 0 }))
    : summary.monthlyPayroll?.length > 0
      ? summary.monthlyPayroll.slice(0, 8).reverse().map(d => ({ name: d.month?.slice(0, 7), value: d.total_payroll || 0 }))
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'].map((n, i) => ({ name: n, value: [3, 5, 4, 7, 5, 6, 4, 5][i] }))

  const pieData = summary.departmentDistribution?.length > 0
    ? summary.departmentDistribution.map((d, i) => ({ name: d.name || d.department, value: d.count || d.value || 0, color: PIE_COLORS[i % PIE_COLORS.length] }))
    : [{ name: 'General', value: 1, color: '#7C3AED' }]

  const totalPie          = pieData.reduce((s, d) => s + d.value, 0)
  const nextPayroll       = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const monthlyPayrollCost = summary.monthlyPayrollCost || summary.totalPayroll || 0
  const occupancyPct      = summary.totalEmployees ? Math.round(((summary.presentToday ?? presentCount) / summary.totalEmployees) * 100) : 0
  const pendingLeavesCount = summary.pendingLeaves ?? leaveRequests.filter(l => l.status === 'pending').length
  const budgetPct         = monthlyPayrollCost > 0 ? Math.min(Math.round((monthlyPayrollCost / (monthlyPayrollCost * 1.09)) * 100), 100) : 0
  const canApprove        = hasPermission('time_off', 'approve')
  const isPayroll         = summary.monthlyPayroll?.length > 0 && !summary.attendanceTrend?.length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FB', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240 }}>
        <Header />
        <main style={{ padding: '84px 28px 40px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Dashboard</h1>
              <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 15, fontWeight: 500 }}>Here's what's happening in your organization today.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {user?.role === ROLES.EMPLOYEE && (
                checkedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '7px 14px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>In since {checkInTime}</span>
                    </div>
                    <button onClick={handleCheckOut} style={{ ...btnPrimary, background: '#EF4444', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>⏱ Check Out</button>
                  </div>
                ) : (
                  <button onClick={handleCheckIn} style={btnPrimary}>⏱ Check In</button>
                )
              )}
              {hasPermission('reports', 'view') && (
                <button onClick={handleExportReport} style={btnOutline}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Report
                </button>
              )}
              {hasPermission('employees', 'create') && (
                <button onClick={() => navigate('/employees')} style={btnPrimary}>+ Add Employee</button>
              )}
            </div>
          </div>



          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard loading={loading} title="Total Employees"    value={summary.totalEmployees || employees.length}                                            icon="👥" badge="+4% vs LW"                                              badgeColor="#10B981" />
            <StatCard loading={loading} title="Present Today"      value={summary.presentToday ?? presentCount}                                                  icon="👤" badge={`${occupancyPct}% Occupancy`}                            badgeColor="#3B82F6" />
            <StatCard loading={loading} title="Pending Leaves"     value={pendingLeavesCount}                                                                    icon="📅" badge={pendingLeavesCount > 0 ? 'Action Needed' : 'All Clear'} badgeColor={pendingLeavesCount > 0 ? '#F59E0B' : '#10B981'} />
            <StatCard loading={loading} title="Monthly Payroll Cost" value={`₹${monthlyPayrollCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}     icon="💰" badge={monthlyPayrollCost > 0 ? `Budget: ${budgetPct}%` : 'No data'} badgeColor={budgetPct > 90 ? '#EF4444' : '#10B981'} />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 24 }}>
            <AttendanceChart
              barData={barData}
              label={summary.attendanceTrend?.length > 0 ? 'Last 7 Days' : 'Monthly Trend'}
              subtitle={summary.attendanceTrend?.length > 0 ? 'Trends over the last 7 days' : 'Historical payroll and attendance trends'}
              isPayroll={isPayroll}
            />

            {/* Department Distribution */}
            <div style={card}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>Department Distribution</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8, fontWeight: 500 }}>Employee headcount by team</div>
              <div style={{ position: 'relative', height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={pieData.length > 1 ? 3 : 0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>{totalPie}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                      {totalPie > 0 ? Math.round((d.value / totalPie) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>

            {/* Leave Requests */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>Recent Leave Requests</div>
                <button onClick={() => navigate('/time-off')} style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #F1F5F9' }}>
                    {['Employee', 'Type', 'Dates', 'Status', canApprove ? 'Action' : ''].filter(Boolean).map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px 10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [0, 1, 2].map(i => (
                    <tr key={i}><td colSpan={5}><div style={{ height: 44, background: '#F8FAFC', borderRadius: 8, margin: '6px 0' }} /></td></tr>
                  )) : leaveRequests.length > 0 ? leaveRequests.map((req, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '11px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                            {req.profile_picture || req.profilePicture
                              ? <img src={req.profile_picture || req.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : (req.firstName || req.first_name || req.employee_name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{req.firstName || req.first_name} {req.lastName || req.last_name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{req.loginId || req.login_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 8px', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        {(req.type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </td>
                      <td style={{ padding: '11px 8px', fontSize: 12, fontWeight: 500, color: '#475569', whiteSpace: 'nowrap' }}>
                        {req.start_date} – {req.end_date}
                      </td>
                      <td style={{ padding: '11px 8px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(req.status), background: statusColor(req.status) + '18', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', border: `1px solid ${statusColor(req.status)}30` }}>
                          {req.status || 'pending'}
                        </span>
                      </td>
                      {canApprove && (
                        <td style={{ padding: '11px 8px' }}>
                          {req.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleApprove(req.id, true)}  style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #D1FAE5', background: '#F0FDF4', color: '#10B981', fontSize: 14, cursor: 'pointer' }}>✓</button>
                              <button onClick={() => handleApprove(req.id, false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', fontSize: 14, cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : <span style={{ color: '#CBD5E1', fontSize: 16 }}>···</span>}
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 14 }}>No leave requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Notice Board — Re-styled from Announcements */}
              <div className="notice-board">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>Notice Board</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAnnouncementForm(f => !f)}
                      style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #EDE9FE', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
                    >
                      {showAnnouncementForm ? 'Cancel' : '+ New'}
                    </button>
                  )}
                </div>

                {showAnnouncementForm && (
                  <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      placeholder="Title"
                      value={annTitle}
                      onChange={e => setAnnTitle(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    />
                    <textarea
                      placeholder="Write your announcement..."
                      value={annBody}
                      onChange={e => setAnnBody(e.target.value)}
                      rows={3}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                    />
                    <button onClick={postAnnouncement} style={{ ...btnPrimary, alignSelf: 'flex-end', padding: '7px 16px', fontSize: 12 }}>Post</button>
                  </div>
                )}

                {announcements.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No active notices.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {announcements.map(a => (
                      <div key={a.id} style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#1F2937' }}>{a.title}</div>
                        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>{a.body}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>{a.author}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Payroll */}
              <div style={{ borderRadius: 16, padding: '22px 24px', background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', opacity: 0.7, marginBottom: 5 }}>UPCOMING PAYROLL</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.6px' }}>
                  {nextPayroll.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
                  {employees.length} employees · Est. ₹{(monthlyPayrollCost || employees.length * 50000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 16, alignItems: 'flex-end', height: 32 }}>
                  {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(255,255,255,0.22)', borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}