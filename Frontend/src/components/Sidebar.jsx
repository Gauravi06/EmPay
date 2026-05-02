import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Clock,
  DollarSign, FileText, Settings, LogOut, Sparkles
} from 'lucide-react'
import { useAuthStore, MODULES, PERMISSIONS } from '../stores/authStore'

const EmPayLogo = () => (
  <div style={{
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(124,58,237,0.25)', flexShrink: 0,
  }}>
    <svg width="22" height="18" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2.5" />
      <path d="M1 8h24" stroke="white" strokeWidth="2.5" />
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
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', always: true },
    { path: '/employees', icon: Users, label: 'Employees', module: MODULES.EMPLOYEES, permission: PERMISSIONS.VIEW },
    { path: '/attendance', icon: Calendar, label: 'Attendance', module: MODULES.ATTENDANCE, permission: PERMISSIONS.VIEW },
    { path: '/time-off', icon: Clock, label: 'Leave / Time Off', module: MODULES.TIME_OFF, permission: PERMISSIONS.VIEW },
    { path: '/payroll', icon: DollarSign, label: 'Payroll', module: MODULES.PAYROLL, permission: PERMISSIONS.VIEW },
    { path: '/reports', icon: FileText, label: 'Reports', module: MODULES.REPORTS, permission: PERMISSIONS.VIEW },
    { path: '/settings', icon: Settings, label: 'Settings', module: MODULES.SETTINGS, permission: PERMISSIONS.VIEW },
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: 240,
        background: '#fff',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        borderRight: '1px solid #F0F0F5',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Logo Section */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #F3F4F6' }}>
        {companyLogo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={companyLogo} alt="logo" style={{ width: 42, height: 42, objectFit: 'contain', borderRadius: 10, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{companyName || 'My Company'}</div>
              <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 4, fontWeight: 800, letterSpacing: '0.08em' }}>SMART HRMS</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <EmPayLogo />
            <div>
              <div style={{ fontSize: 22, fontWeight: 950, color: '#111827', letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                EmPay
                <Sparkles size={14} className="text-amber-400 fill-amber-400" />
              </div>
              <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 800, letterSpacing: '0.08em' }}>SMART HR & PAYROLL</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px 12px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 14,
              marginBottom: 4,
              textDecoration: 'none',
              fontSize: 14.5,
              fontWeight: isActive ? 850 : 750,
              color: isActive ? '#7C3AED' : '#4B5563',
              background: isActive ? '#F5F3FF' : 'transparent',
              borderLeft: isActive ? '4px solid #7C3AED' : '4px solid transparent',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? '0 4px 12px rgba(124,58,237,0.08)' : 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2.2} style={{ flexShrink: 0, color: isActive ? '#7C3AED' : '#6B7280' }} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid #F3F4F6', background: 'linear-gradient(to bottom, #fff, #FBFBFF)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 12, background: '#fff', borderRadius: 16, border: '1px solid #F3F4F6' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 8px rgba(124,58,237,0.15)' }}>
            {user?.profile_picture || user?.profilePicture ? (
              <img src={user?.profile_picture || user?.profilePicture} alt="me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>{user?.firstName?.[0] || user?.first_name?.[0]}{user?.lastName?.[0] || user?.last_name?.[0]}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 850, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName || user?.first_name} {user?.lastName || user?.last_name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize', fontWeight: 600 }}>{(user?.role || '').replace('_', ' ')}</div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 14, width: '100%',
            background: 'transparent', border: 'none', borderLeft: '4px solid transparent',
            color: '#EF4444', fontSize: 14.5, fontWeight: 850, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderLeftColor = '#EF4444' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent' }}
        >
          <LogOut size={20} strokeWidth={2.5} style={{ color: '#EF4444' }} />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar