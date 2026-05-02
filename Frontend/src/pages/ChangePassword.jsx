import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { Lock, Key, Shield, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

const ChangePassword = () => {
  const navigate = useNavigate()
  const { user, updatePassword, resetPassword } = useAuthStore()
  const [formData, setFormData] = useState({
    loginId: user?.loginId || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [resetEmail, setResetEmail] = useState('')
  
  const handleChangePassword = (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    
    const result = updatePassword(formData.loginId, formData.oldPassword, formData.newPassword)
    if (result.success) {
      toast.success(result.message)
      setFormData({ ...formData, oldPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => navigate('/dashboard'), 2000)
    } else {
      toast.error(result.message)
    }
  }
  
  const handleResetPassword = (e) => {
    e.preventDefault()
    if (!resetEmail) {
      toast.error('Please enter your email or login ID')
      return
    }
    
    const result = resetPassword(resetEmail)
    if (result.success) {
      toast.success(result.message)
      setResetEmail('')
    } else {
      toast.error('User not found')
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="pt-16 p-6" style={{ marginLeft: 220 }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Password Management</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login ID
                  </label>
                  <input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Old Password
                  </label>
                  <input
                    type="password"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </form>
            </motion.div>
            
            {/* Reset Password Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-800">Reset Password</h2>
              </div>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email / Login ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your email or login ID"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A password reset link will be sent to your registered email
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Reset Password
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChangePassword