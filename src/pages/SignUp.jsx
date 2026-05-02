import React, { useState, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Upload, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Logo = () => (
  <div style={{
    width: 42, height: 42, borderRadius: 12,
    background: 'linear-gradient(135deg, #7c5cfc 0%, #a855f7 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 24px rgba(124,92,252,0.5)', flexShrink: 0
  }}>
    <svg width="22" height="18" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2.2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2.2" />
      <rect x="5" y="12" width="6" height="3" rx="1" fill="white" />
    </svg>
  </div>
)

const SignUp = () => {
  const navigate = useNavigate()
  const { signup } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const fileRef = useRef(null)
  const [form, setForm] = useState({ companyName: '', name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const set = useCallback((key) => (e) => setForm(f => ({ ...f, [key]: e.target.value })), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const nameParts = form.name.trim().split(' ')
    const result = await signup({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: form.email,
      phone: form.phone,
      password: form.password,
      companyName: form.companyName,
      role: 'employee'
    })
    setLoading(false)
    if (result.success) {
      toast.success(`Account created! Login ID: ${result.loginId}`)
      navigate('/login')
    } else {
      toast.error(result.message || 'Failed to create account')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#f0f0ff', fontSize: 13.5,
    fontFamily: 'Geist, sans-serif', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s'
  }

  const labelStyle = { fontSize: 11.5, fontWeight: 700, color: '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,92,252,0.08) 0%, transparent 60%), #0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist, sans-serif', padding: '40px 20px'
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0ff' }}>EmPay</div>
            <div style={{ fontSize: 11, color: '#8888aa' }}>HR Management System</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '26px 26px', backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0ff', margin: '0 0 4px' }}>Create Account</h1>
          <p style={{ fontSize: 13, color: '#8888aa', margin: '0 0 24px' }}>Register your company to get started</p>

          {/* Logo upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Company Logo</label>
            <div onClick={() => fileRef.current?.click()}
              style={{
                padding: '14px', background: 'rgba(124,92,252,0.06)',
                border: '1px dashed rgba(124,92,252,0.3)', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', transition: 'border-color 0.15s', minHeight: 64
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,92,252,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(124,92,252,0.3)'}
            >
              {logoPreview
                ? <img src={logoPreview} alt="Logo" style={{ height: 48, objectFit: 'contain', borderRadius: 6 }} />
                : <>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c5cfc, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={15} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#9b7dff' }}>Click to upload logo</div>
                    <div style={{ fontSize: 11, color: '#4a4a66', marginTop: 2 }}>PNG, JPG, SVG · max 2MB</div>
                  </div>
                </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setLogoPreview(ev.target.result); r.readAsDataURL(f) } }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {[
              ['Company Name', 'companyName', 'text', 'Acme Inc.'],
              ['Full Name', 'name', 'text', 'Jane Doe'],
              ['Email', 'email', 'email', 'jane@company.com'],
              ['Phone', 'phone', 'tel', '+91 98765 43210'],
            ].map(([lbl, key, type, ph]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <input type={type} value={form[key]} onChange={set(key)} placeholder={ph} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,92,252,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  required={key !== 'phone'} />
              </div>
            ))}

            {[['Password', 'password', showPass, setShowPass], ['Confirm Password', 'confirmPassword', showConfirm, setShowConfirm]].map(([lbl, key, show, setShow]) => (
              <div key={key}>
                <label style={labelStyle}>{lbl}</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={form[key]} onChange={set(key)} placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,92,252,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    required />
                  <button type="button" onClick={() => setShow(v => !v)}
                    style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8888aa', display: 'flex' }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '11px',
                background: 'linear-gradient(135deg, #7c5cfc, #a855f7)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Geist, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(124,92,252,0.35)', marginTop: 4,
                opacity: loading ? 0.6 : 1
              }}>
              {loading ? 'Creating account…' : 'Create Account'}
              {!loading && <ArrowRight size={15} />}
            </motion.button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#8888aa', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#9b7dff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp