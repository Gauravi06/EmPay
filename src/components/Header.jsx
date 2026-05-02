import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, ChevronDown, Bell, Search } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const Header = ({ title, subtitle }) => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login')
  }

  const firstName = user?.firstName || user?.first_name || ''
  const lastName = user?.lastName || user?.last_name || ''
  const loginId = user?.loginId || user?.login_id || ''
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  return (
    <div className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {title && (
          <>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
            {subtitle && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{subtitle}</span>}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <button className="icon-btn" title="Notifications">
          <Bell size={15} />
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 5px',
              background: isOpen ? 'var(--bg-overlay)' : 'transparent',
              border: '1px solid ' + (isOpen ? 'var(--border-bright)' : 'transparent'),
              borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <div className="avatar" style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11 }}>
              {initials || '??'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {firstName} {lastName}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{loginId}</div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 200,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: 12,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  zIndex: 60,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{firstName} {lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                    {(user?.role || '').replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ padding: '6px' }}>
                  <Link to="/my-profile" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                      transition: 'all 0.1s'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      <User size={14} />
                      My Profile
                    </div>
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                    color: 'var(--red)', fontSize: 13, fontWeight: 500,
                    background: 'transparent', border: 'none', width: '100%',
                    fontFamily: 'Geist, sans-serif', transition: 'background 0.1s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Header