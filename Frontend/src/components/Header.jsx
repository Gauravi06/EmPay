import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Mail, Search, LogOut, User, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => { setIsOpen(false); logout(); navigate('/login') }

  const firstName = user?.first_name || user?.firstName || ''
  const lastName = user?.last_name || user?.lastName || ''
  const profilePicture = user?.profile_picture || user?.profilePicture || null
  const roleLabel = { admin: 'Global Operations', hr_officer: 'HR Operations', payroll_officer: 'Payroll Operations', employee: 'Team Member' }[user?.role] || 'User'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #F0F0F5',
      height: 64,
      position: 'fixed',
      right: 0,
      top: 0,
      left: 220,
      zIndex: 99,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          placeholder="Search employees, payroll, or reports..."
          style={{
            width: '100%', padding: '9px 14px 9px 36px',
            background: '#F8F8FC', border: '1.5px solid #EBEBF5',
            borderRadius: 10, fontSize: 13, color: '#374151',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
          onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.borderColor = '#EBEBF5'; e.target.style.background = '#F8F8FC' }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Icons */}
      <button style={iconBtn}>
        <Bell size={18} color="#6B7280" />
        <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#7C3AED', borderRadius: '50%', border: '2px solid #fff' }} />
      </button>
      <button style={iconBtn}>
        <Mail size={18} color="#6B7280" />
      </button>

      {/* User */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 10, fontFamily: 'inherit' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {profilePicture ? <img src={profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{firstName[0]}{lastName[0]}</span>
            )}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{firstName} {lastName}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{roleLabel}</div>
          </div>
          <ChevronDown size={14} color="#9CA3AF" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 210, background: '#fff', borderRadius: 14,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F0F0F5',
                zIndex: 200, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{firstName} {lastName}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' }}>{(user?.role || '').replace(/_/g, ' ')}</div>
              </div>
              <Link to="/my-profile" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', textDecoration: 'none', color: '#374151', fontSize: 13, fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <User size={15} color="#7C3AED" /> My Profile
              </Link>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', width: '100%', background: 'none', border: 'none', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <LogOut size={15} /> Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

const iconBtn = {
  width: 38, height: 38, borderRadius: 10, border: '1.5px solid #EBEBF5',
  background: '#F8F8FC', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', position: 'relative',
}

export default Header
