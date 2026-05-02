import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCircle, Mail, Phone, Calendar } from 'lucide-react'

// Status indicator: green dot = present, airplane = on leave, yellow dot = absent
const StatusIndicator = ({ status }) => {
  if (status === 'present') {
    return (
      <div title="Present in office" style={{
        width: 14, height: 14, borderRadius: '50%',
        background: '#10b981',
        boxShadow: '0 0 0 2px #d1fae5',
        flexShrink: 0,
      }} />
    )
  }
  if (status === 'leave') {
    // Airplane icon for on leave
    return (
      <div title="On leave" style={{ width: 18, height: 18, flexShrink: 0, color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
      </div>
    )
  }
  // absent = yellow dot
  return (
    <div title="Absent" style={{
      width: 14, height: 14, borderRadius: '50%',
      background: '#f59e0b',
      boxShadow: '0 0 0 2px #fef3c7',
      flexShrink: 0,
    }} />
  )
}

const EmployeeCard = ({ employee }) => {
  const navigate = useNavigate()

  const firstName = employee.first_name || employee.firstName || ''
  const lastName = employee.last_name || employee.lastName || ''
  const loginId = employee.login_id || employee.loginId || ''
  const joiningDate = employee.joining_date || employee.joiningDate || ''
  const profilePicture = employee.profile_picture || employee.profilePicture || null
  const status = employee.status || 'absent'

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(109,40,217,0.12)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/employee/${employee.id}`)}
      className="bg-white rounded-xl shadow-md p-5 cursor-pointer relative"
      style={{ transition: 'box-shadow 0.2s' }}
    >
      {/* Status indicator — top right corner */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <StatusIndicator status={status} />
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircle className="w-9 h-9 text-white" />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 className="font-semibold text-gray-800 truncate">{firstName} {lastName}</h3>
          <p className="text-xs text-gray-500">{loginId}</p>
          <p className="text-xs font-medium capitalize" style={{ color: '#7C3AED' }}>
            {(employee.role || '').replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{employee.phone || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Joined: {joiningDate}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default EmployeeCard
