import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, LogOut, Settings, UserCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed right-0 top-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-end">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.loginId}</p>
            </div>
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
              >
                <Link
                  to="/my-profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">My Profile</span>
                </Link>
                <Link
                  to="/change-password"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Change Password</span>
                </Link>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setIsOpen(false)
                    useAuthStore.getState().logout()
                  }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Log Out</span>
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