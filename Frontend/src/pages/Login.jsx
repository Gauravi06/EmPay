import React, { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { label: 'Admin', id: 'admin', hint: 'ADMIN001 / admin123' },
  { label: 'HR Officer', id: 'hr_officer', hint: 'HR001 / hr123' },
  { label: 'Payroll Officer', id: 'payroll_officer', hint: 'PAY001 / pay123' },
  { label: 'Employee', id: 'employee', hint: 'EMP001 / emp123' },
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .ep-page {
    min-height: 100vh;
    background: #F0EBFF;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 40px 20px;
    gap: 28px;
  }
  .ep-card { width: 100%; max-width: 440px; }

  /* Logo */
  .ep-logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .ep-logo-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(109,40,217,0.35); flex-shrink: 0;
  }
  .ep-brand { font-size: 22px; font-weight: 700; color: #1A1A2E; letter-spacing: -0.3px; }
  .ep-title { font-size: 32px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px; letter-spacing: -0.5px; }
  .ep-sub   { font-size: 15px; color: #6B7280; margin: 0 0 32px; line-height: 1.5; }

  /* Form */
  .ep-form { display: flex; flex-direction: column; gap: 20px; }
  .ep-field { display: flex; flex-direction: column; gap: 8px; }
  .ep-label { font-size: 13px; font-weight: 600; color: #6B7280; letter-spacing: 0.02em; }
  .ep-label-row { display: flex; justify-content: space-between; align-items: center; }
  .ep-forgot { font-size: 13px; color: #7C3AED; font-weight: 600; text-decoration: none; }
  .ep-forgot:hover { text-decoration: underline; }

  /* Input */
  .ep-input-wrap { position: relative; }
  .ep-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #9CA3AF; pointer-events: none; display: flex;
  }
  .ep-input {
    width: 100%;
    padding: 13px 16px 13px 44px;
    background: #EDE9FE;
    border: 1.5px solid #DDD6FE;
    border-radius: 12px;
    font-size: 15px; color: #1A1A2E; font-family: 'DM Sans', inherit;
    outline: none; box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .ep-input:focus { border-color: #7C3AED; background: #EDE9FE; }
  .ep-input::placeholder { color: #A78BFA; }
  .ep-input-pr { padding-right: 44px; }

  .ep-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; padding: 0;
    color: #9CA3AF; display: flex; align-items: center;
  }
  .ep-eye:hover { color: #7C3AED; }

  /* Dropdown */
  .ep-dd-wrap { position: relative; }
  .ep-dd-btn {
    width: 100%; padding: 13px 16px;
    background: #EDE9FE; border: 1.5px solid #DDD6FE; border-radius: 12px;
    font-size: 15px; color: #1A1A2E; font-weight: 500;
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; outline: none; font-family: 'DM Sans', inherit;
    transition: border-color 0.2s;
  }
  .ep-dd-btn:hover, .ep-dd-btn:focus { border-color: #7C3AED; }
  .ep-chev { color: #7C3AED; transition: transform 0.2s; }
  .ep-chev-open { transform: rotate(180deg); }

  .ep-dd-list {
    position: absolute; top: calc(100% + 6px); left: 0; right: 0;
    background: white; border-radius: 14px;
    box-shadow: 0 12px 40px rgba(124,58,237,0.18);
    border: 1.5px solid #EDE9FE; z-index: 100; overflow: hidden;
  }
  .ep-dd-item {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 13px 16px;
    text-align: left; background: white;
    color: #1A1A2E; font-size: 15px; font-weight: 400;
    cursor: pointer; border: none; font-family: 'DM Sans', inherit;
    transition: background 0.12s;
  }
  .ep-dd-item:hover { background: #F5F3FF; }
  .ep-dd-item.ep-active { background: #F0EBFF; color: #7C3AED; font-weight: 600; }
  .ep-hint { font-size: 11px; color: #A78BFA; font-weight: 400; font-family: monospace; }

  /* Remember */
  .ep-remember {
    display: flex; align-items: center; gap: 10px;
    font-size: 14px; color: #4B5563; cursor: pointer; user-select: none;
  }
  .ep-remember input { width: 17px; height: 17px; accent-color: #7C3AED; cursor: pointer; }

  /* Button */
  .ep-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    color: white; border: none; border-radius: 14px;
    font-size: 16px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(109,40,217,0.4);
    font-family: 'DM Sans', inherit; margin-top: 4px; transition: opacity 0.2s;
  }
  .ep-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  /* Footer */
  .ep-footer { font-size: 14px; color: #9CA3AF; text-align: center; }
  .ep-footer-link { color: #7C3AED; font-weight: 700; text-decoration: none; }
  .ep-footer-link:hover { text-decoration: underline; }
`

const EmPayLogo = () => (
  <div className="ep-logo-icon">
    <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [role, setRole] = useState(ROLES[0])
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLoginIdChange = useCallback((e) => setLoginId(e.target.value), [])
  const handlePasswordChange = useCallback((e) => setPassword(e.target.value), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(loginId, password)
    setLoading(false)
    if (result.success) {
      toast.success('Login successful!')
      navigate('/dashboard')
    } else {
      toast.error(result.message || 'Invalid credentials')
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="ep-page">
        <motion.div
          className="ep-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div className="ep-logo-row">
            <EmPayLogo />
            <span className="ep-brand">EmPay</span>
          </div>

          <h1 className="ep-title">Welcome Back</h1>
          <p className="ep-sub">Enter your credentials to access your HR dashboard.</p>

          <form onSubmit={handleSubmit} className="ep-form">

            {/* Role */}
            <div className="ep-field">
              <label className="ep-label">Role</label>
              <div className="ep-dd-wrap">
                <button type="button" className="ep-dd-btn" onClick={() => setRoleOpen(o => !o)}>
                  <span>{role.label}</span>
                  <ChevronDown size={18} className={`ep-chev ${roleOpen ? 'ep-chev-open' : ''}`} />
                </button>
                <AnimatePresence>
                  {roleOpen && (
                    <motion.div className="ep-dd-list"
                      initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                      transition={{ duration: 0.15 }}
                      style={{ transformOrigin: 'top' }}
                    >
                      {ROLES.map(r => (
                        <button key={r.id} type="button"
                          className={`ep-dd-item ${role.id === r.id ? 'ep-active' : ''}`}
                          onClick={() => { setRole(r); setRoleOpen(false); setLoginId(''); setPassword('') }}
                        >
                          <span>{r.label}</span>
                          <span className="ep-hint">{r.hint}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Login ID */}
            <div className="ep-field">
              <label className="ep-label">Login ID / Email</label>
              <div className="ep-input-wrap">
                <span className="ep-icon"><Mail size={17} /></span>
                <input type="text" className="ep-input"
                  placeholder={role.hint.split(' / ')[0]}
                  value={loginId} onChange={handleLoginIdChange}
                  autoComplete="username" required
                />
              </div>
            </div>

            {/* Password */}
            <div className="ep-field">
              <div className="ep-label-row">
                <label className="ep-label">Password</label>
                <a href="#" className="ep-forgot">Forgot password?</a>
              </div>
              <div className="ep-input-wrap">
                <span className="ep-icon"><Lock size={17} /></span>
                <input type={showPassword ? 'text' : 'password'} className="ep-input ep-input-pr"
                  placeholder="••••••••"
                  value={password} onChange={handlePasswordChange}
                  autoComplete="current-password" required
                />
                <button type="button" className="ep-eye" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="ep-remember">
              <input type="checkbox" />
              Remember me for 30 days
            </label>

            {/* Submit */}
            <motion.button type="submit" className="ep-btn"
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }} disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="ep-footer">
          New to EmPay?{' '}
          <Link to="/signup" className="ep-footer-link">Request a demo</Link>
        </p>
      </div>
    </>
  )
}

export default Login