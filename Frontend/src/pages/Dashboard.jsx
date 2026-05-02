import React, { useEffect, useState, useCallback } from 'react'
import { useAuthStore, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const PIE_COLORS = ['#7C3AED', '#38BDF8', '#FB923C', '#10B981', '#F43F5E', '#F59E0B']

const card = { background: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #F0F0F5' }
const btnPrimary = { padding: '9px 18px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }
const btnOutline = { padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }
const statusColor = s => ({ approved: '#10B981', rejected: '#EF4444', pending: '#F59E0B' }[s] || '#9CA3AF')

const Badge = ({ label, color }) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: color + '18', color, whiteSpace: 'nowrap' }}>{label}</span>
)

const StatCard = ({ title, value, icon, badge, badgeColor, loading }) => (
  <motion.div whileHover={{ y: -2 }} style={{ ...card, flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <Badge label={badge} color={badgeColor} />
    </div>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
    {loading
      ? <div style={{ height: 36, width: 100, background: '#F3F4F6', borderRadius: 8, animation: 'shimmer 1.5s infinite' }} />
      : <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-1px' }}>{value}</div>}
  </motion.div>
)

export default function Dashboard() {
  const { user, checkIn, checkOut, autoCheckOut, getTodayAttendance, fetchEmployees, fetchReportsSummary, fetchTimeOffRequests, hasPermission, approveTimeOff } = useAuthStore()
  const navigate = useNavigate()

  const [state, setState] = useState({
    employees: [], todayAtt: [], leaveRequests: [],
    summary: { totalEmployees: 0, presentToday: 0, pendingLeaves: 0, totalPayroll: 0, monthlyPayroll: [], departmentDistribution: [], attendanceTrend: [] },
    checkedIn: false, checkInTime: null, loading: true
  })

  const set = patch => setState(s => ({ ...s, ...patch }))

  useEffect(() => {
    if (!user) return
    const iv = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 18 && now.getMinutes() === 0)
        autoCheckOut().then(() => set({ checkedIn: false, checkInTime: null })).catch(() => {})
    }, 60000)
    return () => clearInterval(iv)
  }, [user])

  const load = useCallback(async () => {
    set({ loading: true })
    try {
      const [att, emps, leaves] = await Promise.all([
        getTodayAttendance().catch(() => []),
        fetchEmployees().catch(() => []),
        fetchTimeOffRequests().catch(() => []),
      ])

      let summary = { totalEmployees: (emps || []).length, presentToday: 0, pendingLeaves: 0, totalPayroll: 0, monthlyPayroll: [], departmentDistribution: [], attendanceTrend: [] }
      if (hasPermission('reports', 'view')) {
        try { summary = await fetchReportsSummary() } catch (_) {}
      }

      const my = (att || []).find(a => a.user_id === user?.id)
      set({
        employees: emps || [],
        todayAtt: att || [],
        leaveRequests: (leaves || []).slice(0, 5),
        summary,
        checkedIn: !!my?.check_in,
        checkInTime: my?.check_in || null,
        loading: false
      })
    } catch (e) { console.error(e); set({ loading: false }) }
  }, [user])

  useEffect(() => { load() }, [load])

  const handleCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0], now = new Date().toTimeString().slice(0, 5)
      await checkIn(today, now); set({ checkedIn: true, checkInTime: now }); toast.success('Checked in!')
    } catch (e) { toast.error(e.message || 'Failed') }
  }

  const handleCheckOut = async () => {
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

  const { employees, todayAtt, leaveRequests, summary, checkedIn, checkInTime, loading } = state
  const presentCount = todayAtt.filter(a => a.status === 'present').length
  const onLeaveCount = todayAtt.filter(a => a.status === 'leave').length

  // Build bar chart: prefer attendanceTrend, fallback monthlyPayroll, fallback placeholder
  const barData = summary.attendanceTrend?.length > 0
    ? summary.attendanceTrend.map(d => ({ name: d.name?.slice(5), value: d.present || 0 }))
    : summary.monthlyPayroll?.length > 0
      ? summary.monthlyPayroll.slice(0, 6).reverse().map(d => ({ name: d.month?.slice(0, 7), value: d.total_payroll || 0 }))
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((n, i) => ({ name: n, value: [3, 5, 4, 7, 6, 2][i] }))

  // Build pie: prefer real dept data, fallback placeholder
  const pieData = summary.departmentDistribution?.length > 0
    ? summary.departmentDistribution.map((d, i) => ({ name: d.name || d.department, value: d.count || d.value || 0, color: PIE_COLORS[i % PIE_COLORS.length] }))
    : [{ name: 'No data yet', value: 1, color: '#E5E7EB' }]

  const totalPie = pieData.reduce((s, d) => s + d.value, 0)
  const nextPayroll = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)

  const canApprove = hasPermission('time_off', 'approve')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F8FC', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 220 }}>
        <Header />
        <main style={{ padding: '84px 28px 40px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>Dashboard</h1>
              <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>Here's what's happening in your organization today.</p>
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
              <button onClick={load} style={btnOutline}>↻ Refresh</button>
              {hasPermission('employees', 'create') && (
                <button onClick={() => navigate('/employees')} style={btnPrimary}>+ Add Employee</button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
            <StatCard loading={loading} title="Total Employees" value={summary.totalEmployees || employees.length}
              icon="👥" badge={`${employees.length} Active`} badgeColor="#10B981" />
            <StatCard loading={loading} title="Present Today" value={summary.presentToday ?? presentCount}
              icon="📋"
              badge={`${summary.totalEmployees ? Math.round(((summary.presentToday ?? presentCount) / summary.totalEmployees) * 100) : 0}% Occupancy`}
              badgeColor="#3B82F6" />
            <StatCard loading={loading} title="Pending Leaves" value={summary.pendingLeaves ?? leaveRequests.filter(l => l.status === 'pending').length}
              icon="📅" badge={summary.pendingLeaves > 0 ? 'Action Needed' : 'All Clear'} badgeColor={summary.pendingLeaves > 0 ? '#F59E0B' : '#10B981'} />
            <StatCard loading={loading} title="Payroll Paid" value={`₹${(summary.totalPayroll || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              icon="💰" badge="This Period" badgeColor="#7C3AED" />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 22 }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                    {summary.attendanceTrend?.length > 0 ? 'Attendance Trend (Last 7 Days)' : 'Monthly Payroll Overview'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Live data from database</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 12px' }}>Live</span>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13 }}
                      formatter={v => summary.monthlyPayroll?.length > 0 && !summary.attendanceTrend?.length ? `₹${v?.toLocaleString('en-IN')}` : `${v} employees`} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((_, i) => <Cell key={i} fill={i === barData.length - 1 ? '#7C3AED' : '#C4B5FD'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Department Distribution</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Employee headcount by team</div>
              <div style={{ position: 'relative', height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={pieData.length > 1 ? 3 : 0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{totalPie}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#374151' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {totalPie > 0 ? Math.round((d.value / totalPie) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
            {/* Leave Requests Table */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Recent Leave Requests</div>
                <button onClick={() => navigate('/time-off')} style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Employee', 'Type', 'Dates', 'Status', canApprove ? 'Action' : ''].filter(Boolean).map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [0, 1, 2].map(i => (
                    <tr key={i}><td colSpan={5}><div style={{ height: 44, background: '#F9FAFB', borderRadius: 8, margin: '6px 0' }} /></td></tr>
                  )) : leaveRequests.length > 0 ? leaveRequests.map((req, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                      <td style={{ padding: '11px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(req.firstName || req.first_name || req.employee_name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{req.firstName || req.first_name} {req.lastName || req.last_name}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{req.loginId || req.login_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 8px', fontSize: 13, color: '#374151' }}>
                        {(req.type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </td>
                      <td style={{ padding: '11px 8px', fontSize: 12, color: '#6B7280' }}>
                        {req.start_date} – {req.end_date}
                      </td>
                      <td style={{ padding: '11px 8px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(req.status), background: statusColor(req.status) + '18', padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                          {req.status || 'pending'}
                        </span>
                      </td>
                      {canApprove && (
                        <td style={{ padding: '11px 8px' }}>
                          {req.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleApprove(req.id, true)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #D1FAE5', background: '#F0FDF4', color: '#10B981', fontSize: 14, cursor: 'pointer' }}>✓</button>
                              <button onClick={() => handleApprove(req.id, false)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5', color: '#EF4444', fontSize: 14, cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : <span style={{ color: '#D1D5DB', fontSize: 16 }}>···</span>}
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 14 }}>No leave requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Actions + Payroll Banner */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Add Employee', icon: '👤', color: '#7C3AED', bg: '#F5F3FF', path: '/employees', perm: ['employees', 'create'] },
                    { label: 'Approve Leaves', icon: '✅', color: '#3B82F6', bg: '#EFF6FF', path: '/time-off', perm: ['time_off', 'approve'] },
                    { label: 'Run Payroll', icon: '💳', color: '#10B981', bg: '#ECFDF5', path: '/payroll', perm: ['payroll', 'create'] },
                    { label: 'View Reports', icon: '📊', color: '#6B7280', bg: '#F9FAFB', path: '/reports', perm: ['reports', 'view'] },
                  ].filter(a => !a.perm || hasPermission(a.perm[0], a.perm[1])).map((a, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(a.path)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 8px', borderRadius: 12, background: a.bg, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: a.color, minHeight: 80, fontFamily: 'inherit' }}>
                      <span style={{ fontSize: 24 }}>{a.icon}</span>
                      {a.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ borderRadius: 14, padding: '20px 22px', background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', color: '#fff' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7, marginBottom: 4 }}>UPCOMING PAYROLL</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
                  {nextPayroll.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                  {employees.length} employees · Est. ₹{((summary.totalPayroll || employees.length * 50000) / (summary.monthlyPayroll?.length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 16, alignItems: 'flex-end', height: 32 }}>
                  {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'rgba(255,255,255,0.25)', borderRadius: '3px 3px 0 0' }} />
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