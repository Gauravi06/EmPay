import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Phone, Calendar, Plane } from 'lucide-react'

const StatusDot = ({ status }) => {
  if (status === 'present') return (
    <div title="Present" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(34,197,94,0.6)', flexShrink: 0 }} />
  )
  if (status === 'leave') return (
    <Plane size={12} title="On Leave" style={{ color: 'var(--blue)', flexShrink: 0 }} />
  )
  return (
    <div title="Absent" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 6px rgba(245,158,11,0.5)', flexShrink: 0 }} />
  )
}

const EmployeeCard = ({ employee }) => {
  const navigate = useNavigate()
  const firstName = employee.first_name || employee.firstName || ''
  const lastName = employee.last_name || employee.lastName || ''
  const loginId = employee.login_id || employee.loginId || ''
  const joiningDate = employee.joining_date || employee.joiningDate || ''
  const status = employee.status || 'absent'
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/employee/${employee.id}`)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Subtle gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--accent), transparent)',
        opacity: 0.6
      }} />

      {/* Status — top right */}
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
        <StatusDot status={status} />
      </div>

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div className="avatar" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 16 }}>
          {employee.profile_picture || employee.profilePicture
            ? <img src={employee.profile_picture || employee.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firstName} {lastName}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{loginId}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-bright)', marginTop: 2, fontWeight: 500, textTransform: 'capitalize' }}>
            {(employee.role || '').replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
          <Mail size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employee.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
          <Phone size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          <span>{employee.phone || '—'}</span>
        </div>
        {joiningDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Calendar size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
            <span>Joined {joiningDate}</span>
          </div>
        )}
      </div>

      {/* Department badge */}
      {employee.department && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span className="badge badge-purple">{employee.department}</span>
        </div>
      )}
    </motion.div>
  )
}

export default EmployeeCard