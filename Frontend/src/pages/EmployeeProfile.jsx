import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import {
  UserCircle, Mail, Phone, Calendar,
  Building, Users, Briefcase, ArrowLeft,
  MapPin, Hash
} from 'lucide-react'

// Read-only field display
const Field = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
      {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      <span className="text-sm text-gray-700">{value || '—'}</span>
    </div>
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    present: { label: 'Present', bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    leave: { label: 'On Leave', bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
    absent: { label: 'Absent', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  }
  const s = map[status] || map.absent
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

const EmployeeProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchEmployees } = useAuthStore()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const emps = await fetchEmployees()
        const emp = emps.find(e => e.id === parseInt(id))
        setEmployee(emp || null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8 animate-pulse">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16 p-6">
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Employee not found</p>
            <button onClick={() => navigate(-1)} className="text-primary-600 hover:text-primary-700 font-medium">
              ← Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  const firstName = employee.first_name || employee.firstName || ''
  const lastName = employee.last_name || employee.lastName || ''
  const loginId = employee.login_id || employee.loginId || ''
  const joiningDate = employee.joining_date || employee.joiningDate || ''
  const profilePicture = employee.profile_picture || employee.profilePicture || null
  const roleLabel = (employee.role || '').replace(/_/g, ' ')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-16 p-6">
        <div className="max-w-3xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-5 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* View-only banner */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-5 text-sm text-blue-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View-only mode — this profile cannot be edited here
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* Header banner */}
            <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }} className="p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{firstName} {lastName}</h1>
                  <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-sm mt-0.5">{loginId}</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-sm capitalize">{roleLabel}</p>
                  <div className="mt-2">
                    <StatusBadge status={employee.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Fields — all read-only */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <UserCircle className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <Field label="Email" value={employee.email} icon={Mail} />
                    <Field label="Phone" value={employee.phone} icon={Phone} />
                    <Field label="Date of Joining" value={joiningDate} icon={Calendar} />
                  </div>
                </div>

                {/* Employment */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Briefcase className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    Employment Details
                  </h3>
                  <div className="space-y-3">
                    <Field label="Company" value={employee.company_name || employee.companyName} icon={Building} />
                    <Field label="Department" value={employee.department} icon={Users} />
                    <Field label="Location" value={employee.location} icon={MapPin} />
                    <Field label="Employee Code" value={loginId} icon={Hash} />
                  </div>
                </div>
              </div>

              {/* Bank details warning */}
              {!employee.bank_details && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">⚠️ Bank account details not provided</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default EmployeeProfile
