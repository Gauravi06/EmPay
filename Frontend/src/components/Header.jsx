import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Mail, Search, LogOut, User, ChevronDown, Sparkles } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const { user, logout, fetchEmployees } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  const companyName = (() => { try { return localStorage.getItem('empay_company_name') } catch { return null } })()

  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifs()
    const iv = setInterval(fetchNotifs, 30000) // Poll every 30s
    return () => clearInterval(iv)
  }, [fetchNotifs])

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const markRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      fetchNotifs()
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      fetchNotifs()
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleLogout = () => { setIsOpen(false); logout(); navigate('/login') }

  const firstName = user?.first_name || user?.firstName || ''
  const lastName = user?.last_name || user?.lastName || ''
  const profilePicture = user?.profile_picture || user?.profilePicture || null
  const roleLabel = { 
    admin: 'Global Operations', 
    hr_officer: 'HR Operations', 
    payroll_officer: 'Payroll Operations', 
    employee: 'Team Member' 
  }[user?.role] || 'User'

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #F0F0F5',
      height: 68,
      position: 'fixed',
      right: 0,
      top: 0,
      left: 240, // Match new Sidebar width
      zIndex: 99,
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      gap: 20,
    }}>
      {/* Search Bar — Premium Bold Style */}
      <div style={{ flex: 1, maxWidth: 460, position: 'relative' }}>
        <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
        <input
          placeholder="Search employees or reports..."
          value={searchVal}
          onChange={async e => {
            const v = e.target.value
            setSearchVal(v)
            if (v.trim().length < 2) { setSearchResults([]); setShowResults(false); return }
            try {
              const emps = await fetchEmployees()
              const q = v.toLowerCase()
              const matches = (emps || []).filter(emp =>
                `${emp.firstName||emp.first_name} ${emp.lastName||emp.last_name} ${emp.loginId||emp.login_id} ${emp.email}`.toLowerCase().includes(q)
              ).slice(0, 6)
              setSearchResults(matches)
              setShowResults(true)
            } catch {}
          }}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)'; if (searchResults.length) setShowResults(true) }}
          style={{
            width: '100%', padding: '12px 16px 12px 48px',
            background: '#F8F9FF', border: '2px solid #F0F0FB',
            borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#1E293B',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
        />
        {showResults && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1px solid #EDE9FE', zIndex: 300, overflow: 'hidden' }}>
            {searchResults.map(emp => (
              <div key={emp.id}
                onMouseDown={() => { navigate(`/employee/${emp.id}`); setSearchVal(''); setShowResults(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F8FAFC' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {(emp.firstName||emp.first_name||'?')[0]}{(emp.lastName||emp.last_name||'')[0]}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{emp.firstName||emp.first_name} {emp.lastName||emp.last_name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{emp.loginId||emp.login_id} · {emp.department||emp.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Action Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button style={iconBtn} onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={20} strokeWidth={2.2} color="#475569" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 8, right: 8, width: 14, height: 14, background: '#EF4444', color: '#fff', borderRadius: '50%', border: '2px solid #fff', fontSize: 8, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                  width: 340, background: '#fff', borderRadius: 20,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #F1F5F9',
                  zIndex: 200, overflow: 'hidden'
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FF' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>Activity Log</span>
                  <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all as read</button>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No recent activity</div>
                  ) : notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.is_read && markRead(n.id)}
                      style={{ 
                        padding: '14px 20px', borderBottom: '1px solid #F8FAFC', 
                        background: n.is_read ? '#fff' : '#F5F3FF', cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ 
                          width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                          background: n.type === 'success' ? '#10B981' : n.type === 'warning' ? '#F59E0B' : '#7C3AED' 
                        }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {n.user_name && <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED' }}>{n.user_name}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #F1F5F9' }}>
                  <button style={{ width: '100%', padding: '8px', background: '#F8FAFC', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>View All History</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button style={iconBtn}>
          <Mail size={20} strokeWidth={2.2} color="#475569" />
        </button>
      </div>

      {/* Vertical Divider */}
      <div style={{ width: 1, height: 32, background: '#F1F5F9' }} />

      {/* User Dropdown — Bold & Premium */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(o => !o)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 14, 
            background: isOpen ? '#F5F3FF' : 'none', 
            border: 'none', cursor: 'pointer', padding: '6px 10px', 
            borderRadius: 16, fontFamily: 'inherit', transition: 'all 0.2s ease'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}>
            {profilePicture ? <img src={profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
              <span style={{ color: '#fff', fontWeight: 850, fontSize: 14 }}>{firstName[0]}{lastName[0]}</span>
            )}
          </div>
          <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
            <div style={{ fontSize: 14, fontWeight: 850, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 4 }}>
              {firstName} {lastName}
              {user?.role === 'admin' && <Sparkles size={12} className="text-amber-400 fill-amber-400" />}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 750, uppercase: true, letterSpacing: '0.05em' }}>{roleLabel}</div>
          </div>
          <ChevronDown size={16} strokeWidth={2.5} color="#94A3B8" style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 12px)',
                width: 240, background: '#fff', borderRadius: 20,
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)', border: '1px solid #F1F5F9',
                zIndex: 200, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px', background: 'linear-gradient(to bottom, #F5F3FF, #fff)', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{firstName} {lastName}</div>
                <div style={{ fontSize: 12, color: '#7C3AED', marginTop: 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{(user?.role || '').replace(/_/g, ' ')}</div>
              </div>
              
              <div style={{ padding: '8px' }}>
                <Link to="/my-profile" onClick={() => setIsOpen(false)} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    padding: '12px 16px', textDecoration: 'none', 
                    color: '#475569', fontSize: 14, fontWeight: 750,
                    borderRadius: 12, transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#7C3AED' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
                  <User size={18} strokeWidth={2.2} /> My Profile
                </Link>
                
                <button onClick={handleLogout} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 12, 
                    padding: '12px 16px', width: '100%', background: 'none', 
                    border: 'none', color: '#EF4444', fontSize: 14, 
                    fontWeight: 850, cursor: 'pointer', fontFamily: 'inherit',
                    borderRadius: 12, transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LogOut size={18} strokeWidth={2.2} /> Log Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

const iconBtn = {
  width: 42, height: 42, borderRadius: 12, border: '2px solid #F1F5F9',
  background: '#fff', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', position: 'relative',
  transition: 'all 0.2s ease',
}

export default Header
