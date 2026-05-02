import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Clock,
  DollarSign, FileText, Settings, LogOut,
  ChevronRight
} from 'lucide-react'
import { useAuthStore, MODULES, PERMISSIONS } from '../stores/authStore'

const Logo = () => (
  <div style={{
    width: 32, height: 32, borderRadius: 9,
    background: 'linear-gradient(135deg, #7c5cfc 0%, #a855f7 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 16px rgba(124,92,252,0.4)',
    flexShrink: 0
  }}>
    <svg width="18" height="14" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2.2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2.2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const Sidebar = () => {
  const { logout, user, hasPermission } = useAuthStore()
  const navigate = useNavigate()

  const allItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', always: true },
    { path: '/employees', icon: Users, label: 'Employees', module: MODULES.EMPLOYEES, permission: PERMISSIONS.VIEW },
    { path: '/attendance', icon: Calendar, label: 'Attendance', module: MODULES.ATTENDANCE, permission: PERMISSIONS.VIEW },
    { path: '/time-off', icon: Clock, label: 'Time Off', module: MODULES.TIME_OFF, permission: PERMISSIONS.VIEW },
    { path: '/payroll', icon: DollarSign, label: 'Payroll', module: MODULES.PAYROLL, permission: PERMISSIONS.VIEW },
    { path: '/reports', icon: FileText, label: 'Reports', module: MODULES.REPORTS, permission: PERMISSIONS.VIEW },
    { path: '/settings', icon: Settings, label: 'Settings', module: MODULES.SETTINGS, permission: PERMISSIONS.VIEW },
  ]

  const menuItems = allItems.filter(item =>
    item.always || hasPermission(item.module, item.permission)
  )

  const firstName = user?.firstName || user?.first_name || ''
  const lastName = user?.lastName || user?.last_name || ''
  const loginId = user?.loginId || user?.login_id || ''
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  const roleLabel = {
    admin: 'Administrator',
    hr_officer: 'HR Officer',
    payroll_officer: 'Payroll Officer',
    employee: 'Employee'
  }[user?.role] || 'User'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.div
      className="sidebar"
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>EmPay</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>HR Management</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ width: 34, height: 34, borderRadius: 9, fontSize: 12 }}>
            {initials || '??'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firstName} {lastName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-bright)', fontWeight: 500 }}>{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        <div className="section-heading" style={{ marginBottom: 6 }}>Menu</div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <item.icon size={16} />
            <span style={{ flex: 1 }}>{item.label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="section-heading" style={{ marginTop: 14, marginBottom: 6 }}>Admin</div>
            <NavLink to="/admin-settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Settings size={16} />
              <span style={{ flex: 1 }}>Access Rights</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', color: 'var(--red)', border: 'none', background: 'transparent' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar