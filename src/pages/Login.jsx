import React, { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ChevronDown, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_HINTS = [
  { label: 'Admin', id: 'admin', hint: 'ADMIN001 / admin123' },
  { label: 'HR Officer', id: 'hr_officer', hint: 'HR001 / hr123' },
  { label: 'Payroll Officer', id: 'payroll_officer', hint: 'PAY001 / pay123' },
  { label: 'Employee', id: 'employee', hint: 'EMP001 / emp123' },
]

const Logo = () => (
  <div style={{
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #7c5cfc 0%, #a855f7 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 24px rgba(124,92,252,0.5)',
    flexShrink: 0
  }}>
    <svg width="22" height="18" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2.2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2.2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState(ROLE_HINTS[0])
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(loginId, password)
    setLoading(false)
    if (result.success) {
      toast.success('Logged in successfully')
      navigate('/dashboard')
    } else {
      toast.error(result.message || 'Invalid credentials')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#f0f0ff',
    fontSize: 14,
    fontFamily: 'Geist, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,92,252,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.05) 0%, transparent 50%), #0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist, sans-serif',
      padding: 20
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.3px' }}>EmPay</div>
            <div style={{ fontSize: 11, color: '#8888aa' }}>HR Management System</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '28px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0ff', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13.5, color: '#8888aa', margin: '0 0 28px', lineHeight: 1.5 }}>
            Sign in to your HR dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Role Selector */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Role</label>
              <button type="button" onClick={() => setRoleOpen(o => !o)} style={{
                ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', border: '1px solid ' + (roleOpen ? 'rgba(124,92,252,0.6)' : 'rgba(255,255,255,0.1)')
              }}>
                <span>{selectedRole.label}</span>
                <ChevronDown size={15} style={{ color: '#8888aa', transform: roleOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              <AnimatePresence>
                {roleOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                      background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                      overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
                    }}
                  >
                    {ROLE_HINTS.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => { setSelectedRole(r); setRoleOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '10px 14px', background: selectedRole.id === r.id ? 'rgba(124,92,252,0.12)' : 'transparent',
                          border: 'none', cursor: 'pointer', fontFamily: 'Geist, sans-serif',
                          color: selectedRole.id === r.id ? '#9b7dff' : '#f0f0ff', fontSize: 13.5, fontWeight: 500,
                          transition: 'background 0.1s'
                        }}
                        onMouseEnter={e => { if (selectedRole.id !== r.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={e => { if (selectedRole.id !== r.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span>{r.label}</span>
                        <span style={{ fontSize: 11, color: '#4a4a66', fontFamily: 'Geist Mono, monospace' }}>{r.hint}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Login ID */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                Login ID / Email
              </label>
              <input
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder={selectedRole.hint.split(' / ')[0]}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(124,92,252,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <Link to="/change-password" style={{ fontSize: 12, color: '#7c5cfc', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,92,252,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8888aa', display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'rgba(124,92,252,0.4)' : 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Geist, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(124,92,252,0.35)',
                marginTop: 4
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#8888aa', marginTop: 20 }}>
          New to EmPay?{' '}
          <Link to="/signup" style={{ color: '#9b7dff', fontWeight: 700, textDecoration: 'none' }}>
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default Login