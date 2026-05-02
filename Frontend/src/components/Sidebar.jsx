import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Clock,
  DollarSign, FileText, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuthStore, MODULES, PERMISSIONS } from '../stores/authStore'

const EmPayLogo = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 10,
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(124,58,237,0.35)', flexShrink: 0,
  }}>
    <svg width="20" height="16" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const Sidebar = () => {
  const { logout, user, hasPermission } = useAuthStore()
  const navigate = useNavigate()

  const companyLogo = (() => { try { return localStorage.getItem('empay_company_logo') } catch { return null } })()
  const companyName = (() => { try { return localStorage.getItem('empay_company_name') } catch { return null } })()

  const allItems = [
    { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',     always: true },
    { path: '/employees',  icon: Users,            label: 'Employees',    module: MODULES.EMPLOYEES,  permission: PERMISSIONS.VIEW },
    { path: '/attendance', icon: Calendar,         label: 'Attendance',   module: MODULES.ATTENDANCE, permission: PERMISSIONS.VIEW },
    { path: '/time-off',   icon: Clock,            label: 'Leave / Time Off', module: MODULES.TIME_OFF, permission: PERMISSIONS.VIEW },
    { path: '/payroll',    icon: DollarSign,       label: 'Payroll',      module: MODULES.PAYROLL,    permission: PERMISSIONS.VIEW },
    { path: '/reports',    icon: FileText,         label: 'Reports',      module: MODULES.REPORTS,    permission: PERMISSIONS.VIEW },
    { path: '/settings',   icon: Settings,         label: 'Settings',     module: MODULES.SETTINGS,   permission: PERMISSIONS.VIEW },
  ]

  const menuItems = allItems.filter(item =>
    item.always || hasPermission(item.module, item.permission)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 220,
        background: '#fff',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        borderRight: '1px solid #EBEBF0',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #F3F4F6' }}>
        {companyLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={companyLogo} alt="logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 9, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{companyName || 'My Company'}</div>
              <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 2, fontWeight: 600 }}>SMART HR & PAYROLL</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EmPayLogo />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>EmPay</div>
              <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 600, letterSpacing: '0.05em' }}>SMART HR & PAYROLL</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: '14px 10px 10px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 13.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#7C3AED' : '#6B7280',
              background: isActive ? '#F5F3FF' : 'transparent',
              borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} style={{ flexShrink: 0, color: isActive ? '#7C3AED' : '#9CA3AF' }} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — Logout only */}
      <div style={{ padding: '10px 10px 16px', borderTop: '1px solid #F3F4F6' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, width: '100%',
            background: 'transparent', border: 'none', borderLeft: '3px solid transparent',
            color: '#EF4444', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderLeftColor = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}
        >
          <LogOut size={17} style={{ color: '#EF4444' }} />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar