import React, { useState, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Upload, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .su-page {
    min-height: 100vh;
    background: #F0EBFF;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 40px 20px;
  }
  .su-card { width: 100%; max-width: 460px; }

  /* Logo row */
  .su-logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .su-logo-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(109,40,217,0.35); flex-shrink: 0;
  }
  .su-brand  { font-size: 22px; font-weight: 700; color: #1A1A2E; }
  .su-title  { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0 0 6px; letter-spacing: -0.4px; }
  .su-sub    { font-size: 14px; color: #6B7280; margin: 0 0 28px; line-height: 1.5; }

  /* Logo upload */
  .su-upload-wrap { width: 100%; margin-bottom: 24px; }
  .su-upload-label { font-size: 13px; font-weight: 600; color: #6B7280; margin-bottom: 8px; display: block; }
  .su-upload-box {
    width: 100%; padding: 18px 16px;
    background: #EDE9FE; border: 2px dashed #C4B5FD; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    cursor: pointer; transition: all 0.2s; box-sizing: border-box; position: relative;
  }
  .su-upload-box:hover { border-color: #7C3AED; background: #DDD6FE; }
  .su-upload-box.has-preview { padding: 12px; border-style: solid; border-color: #7C3AED; background: #F5F3FF; }
  .su-upload-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #7C3AED, #6D28D9);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .su-upload-text { font-size: 14px; font-weight: 600; color: #6D28D9; }
  .su-upload-sub  { font-size: 11px; color: #A78BFA; margin-top: 2px; }
  .su-upload-preview-wrap {
    display: flex; align-items: center; gap: 14px; width: 100%;
  }
  .su-upload-preview {
    width: 72px; height: 72px; object-fit: contain;
    border-radius: 10px; background: white;
    box-shadow: 0 2px 8px rgba(109,40,217,0.15);
    padding: 6px; box-sizing: border-box;
  }
  .su-upload-preview-info { flex: 1; }
  .su-upload-preview-name { font-size: 13px; font-weight: 600; color: #1A1A2E; }
  .su-upload-preview-change { font-size: 12px; color: #7C3AED; margin-top: 3px; cursor: pointer; font-weight: 500; }
  .su-upload-check { color: #7C3AED; flex-shrink: 0; }

  /* Form */
  .su-form { display: flex; flex-direction: column; gap: 16px; }
  .su-field { display: flex; flex-direction: column; gap: 7px; }
  .su-label { font-size: 13px; font-weight: 600; color: #6B7280; }

  .su-input-wrap { position: relative; }
  .su-input {
    width: 100%;
    padding: 13px 16px;
    background: #EDE9FE; border: 1.5px solid #DDD6FE; border-radius: 12px;
    font-size: 15px; color: #1A1A2E; font-family: 'DM Sans', inherit;
    outline: none; box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .su-input:focus { border-color: #7C3AED; background: #E8E1FF; }
  .su-input::placeholder { color: #A78BFA; }
  .su-input-pr { padding-right: 46px; }

  .su-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; padding: 0;
    color: #9CA3AF; display: flex; align-items: center;
  }
  .su-eye:hover { color: #7C3AED; }

  /* Button */
  .su-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    color: white; border: none; border-radius: 14px;
    font-size: 16px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(109,40,217,0.4);
    font-family: 'DM Sans', inherit; transition: opacity 0.2s; margin-top: 4px;
  }
  .su-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .su-footer-txt  { text-align: center; font-size: 14px; color: #6B7280; margin: 0; }
  .su-footer-link { color: #7C3AED; font-weight: 700; text-decoration: none; }
  .su-footer-link:hover { text-decoration: underline; }
`

const EmPayLogo = () => (
  <div className="su-logo-icon">
    <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
      <rect x="1" y="3" width="24" height="16" rx="3" stroke="white" strokeWidth="2" />
      <path d="M1 8h24" stroke="white" strokeWidth="2" />
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
  const [logoFileName, setLogoFileName] = useState('')
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    companyName: '', name: '', email: '', phone: '',
    password: '', confirmPassword: ''
  })

  const setField = useCallback((key) => (e) => setForm(f => ({ ...f, [key]: e.target.value })), [])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB')
      return
    }
    setLogoFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setLogoPreview(dataUrl)
      // Persist so Login page + Sidebar can read it after signup
      try { localStorage.setItem('empay_company_logo', dataUrl) } catch { }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const nameParts = form.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Also store company name for display on login page
      try { localStorage.setItem('empay_company_name', form.companyName) } catch { }

      const result = await signup({
        firstName,
        lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        companyName: form.companyName,
        role: 'admin'   // first registrant is always admin
      })

      if (result.success) {
        toast.success(`Account created! Login ID: ${result.loginId}`)
        navigate('/login')
      } else {
        toast.error(result.message || 'Failed to create account')
      }
    } catch (err) {
      toast.error(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="su-page">
        <motion.div className="su-card"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* EmPay Logo */}
          <div className="su-logo-row">
            <EmPayLogo />
            <span className="su-brand">EmPay</span>
          </div>

          <h1 className="su-title">Create Account</h1>
          <p className="su-sub">Register your company to get started.</p>

          {/* Company Logo Upload */}
          <div className="su-upload-wrap">
            <label className="su-upload-label">Company / App Logo</label>
            <div
              className={`su-upload-box${logoPreview ? ' has-preview' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <div className="su-upload-preview-wrap">
                  <img src={logoPreview} alt="Logo preview" className="su-upload-preview" />
                  <div className="su-upload-preview-info">
                    <div className="su-upload-preview-name">{logoFileName}</div>
                    <div className="su-upload-preview-change">Click to change</div>
                  </div>
                  <CheckCircle size={22} className="su-upload-check" />
                </div>
              ) : (
                <>
                  <div className="su-upload-icon">
                    <Upload size={18} color="white" />
                  </div>
                  <div>
                    <div className="su-upload-text">Click to upload logo</div>
                    <div className="su-upload-sub">PNG, JPG, SVG up to 2MB</div>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLogoChange}
            />
          </div>

          <form onSubmit={handleSubmit} className="su-form">

            {/* Company Name */}
            <div className="su-field">
              <label className="su-label">Company Name</label>
              <div className="su-input-wrap">
                <input className="su-input" type="text" placeholder="Acme Inc."
                  value={form.companyName} onChange={setField('companyName')} required />
              </div>
            </div>

            {/* Name */}
            <div className="su-field">
              <label className="su-label">Your Name</label>
              <div className="su-input-wrap">
                <input className="su-input" type="text" placeholder="Jane Doe"
                  value={form.name} onChange={setField('name')} required />
              </div>
            </div>

            {/* Email */}
            <div className="su-field">
              <label className="su-label">Email</label>
              <div className="su-input-wrap">
                <input className="su-input" type="email" placeholder="jane@company.com"
                  value={form.email} onChange={setField('email')} required />
              </div>
            </div>

            {/* Phone */}
            <div className="su-field">
              <label className="su-label">Phone</label>
              <div className="su-input-wrap">
                <input className="su-input" type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={setField('phone')} />
              </div>
            </div>

            {/* Password */}
            <div className="su-field">
              <label className="su-label">Password</label>
              <div className="su-input-wrap">
                <input className="su-input su-input-pr"
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={setField('password')} required autoComplete="new-password" />
                <button type="button" className="su-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="su-field">
              <label className="su-label">Confirm Password</label>
              <div className="su-input-wrap">
                <input className="su-input su-input-pr"
                  type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                  value={form.confirmPassword} onChange={setField('confirmPassword')} required autoComplete="new-password" />
                <button type="button" className="su-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" className="su-btn"
              whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.975 }} disabled={loading}
            >
              {loading ? 'Creating account…' : 'Sign Up'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </motion.button>

            <p className="su-footer-txt">
              Already have an account?{' '}
              <Link to="/login" className="su-footer-link">Sign In</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default SignUp