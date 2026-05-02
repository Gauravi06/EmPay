import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { forgotPassword } = useAuthStore()
  const [loginId, setLoginId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await forgotPassword(loginId, email)
    setLoading(false)
    if (result.success) {
      setSubmitted(true)
      toast.success('Temporary password sent!')
    } else {
      toast.error(result.message || 'Validation failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white rounded-3xl shadow-xl p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-sm text-gray-500">Dual-factor security validation</p>
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-600 leading-relaxed">
              For security, please enter both your **Login ID** and **Registered Email**.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Login ID</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-0 bg-white shadow-sm rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. EMP001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-0 bg-white shadow-sm rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Send Temporary Password'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Check Your Email</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We've sent a temporary password to the email associated with **{loginId}**.
              Please check your inbox (and spam folder) to log in.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gray-800 text-white py-3.5 rounded-2xl font-bold hover:bg-gray-900 shadow-lg transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Return to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
