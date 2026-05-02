import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const Sidebar = () => {
  const { logout } = useAuthStore()
  
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees', icon: Users, label: 'Employees' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/payroll', icon: DollarSign, label: 'Payroll' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]
  
  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto"
    >
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">EMS</h1>
        <p className="text-xs text-gray-500 mt-1">Employee Management</p>
      </div>
      
      <nav className="p-4 space-y-1">
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
        
        <button
          onClick={logout}
          className="sidebar-item text-red-600 w-full mt-8"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </nav>
    </motion.div>
  )
}

export default Sidebar