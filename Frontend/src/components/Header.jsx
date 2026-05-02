import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, UserCircle, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsOpen(false)
    logout()
    navigate('/login')
  }

  const firstName = user?.first_name || user?.firstName || ''
  const lastName = user?.last_name || user?.lastName || ''
  const loginId = user?.login_id || user?.loginId || ''
  const profilePicture = user?.profile_picture || user?.profilePicture || null

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed right-0 top-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-end">

        <div className="relative" ref={dropdownRef}>
          {/* Avatar button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 focus:outline-none group"
          >
            {/* Avatar circle */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Name + role */}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {firstName} {lastName}
              </p>
              <p className="text-xs text-gray-400">{loginId}</p>
            </div>

            <ChevronDown
              className="w-4 h-4 text-gray-400 transition-transform"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              >
                {/* User info at top */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{firstName} {lastName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {(user?.role || '').replace(/_/g, ' ')}
                  </p>
                </div>

                {/* My Profile — opens in form view */}
                <Link
                  to="/my-profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: '#EDE9FE' }}>
                    <User className="w-3.5 h-3.5" style={{ color: '#7C3AED' }} />
                  </div>
                  <span className="text-sm font-medium">My Profile</span>
                </Link>

                <hr className="my-1 border-gray-100" />

                {/* Log Out */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: '#fee2e2' }}>
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-red-600">Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

export default Header
