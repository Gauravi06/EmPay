import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Calendar, Clock,
  DollarSign, FileText, Settings, LogOut
} from 'lucide-react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'

// Same EmPay logo as SignUp page
const EmPayLogo = () => (
  <div style={{
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(109,40,217,0.35)', flexShrink: 0,
  }}>
    <svg width="22" height="18" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const Sidebar = () => {
  const { logout, user, hasPermission } = useAuthStore()

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

  const roleLabel = {
    admin: 'Administrator',
    hr_officer: 'HR Officer',
    payroll_officer: 'Payroll Officer',
    employee: 'Employee'
  }[user?.role] || 'User'

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col"
    >
      {/* Logo — matches SignUp page style */}
      <div className="p-6 border-b border-gray-200">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EmPayLogo />
          <div>
            <h1 className="text-xl font-bold text-primary-600">EmPay</h1>
            <p className="text-xs text-gray-500">Smart HR Management</p>
          </div>
        </div>
      </div>

      {user && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-800">{user.first_name} {user.last_name}</p>
          <p className="text-xs text-primary-600 font-medium">{roleLabel}</p>
          <p className="text-xs text-gray-400">{user.login_id}</p>
        </div>
      )}

      <nav className="p-4 space-y-1 flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active text-primary-600' : 'text-gray-700'}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="sidebar-item text-red-600 w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  )
}

export default Sidebar
