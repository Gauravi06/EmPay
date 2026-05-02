import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserCircle, Mail, Phone, Calendar,
  Building, Users, Briefcase, ArrowLeft,
  MapPin, Hash, Edit2, Save, X, Lock, RefreshCw, Key, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

// Premium Field Component
const Field = ({ label, value, icon: Icon, isEditing, onChange, type = "text", options = [] }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</span>
    {isEditing ? (
      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-sm">
        {Icon && <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
        {type === 'select' ? (
          <select 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 capitalize"
          >
            <option value="">Select</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700"
          />
        )}
      </div>
    ) : (
      <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 group hover:border-indigo-100 transition-all">
        {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />}
        <span className="text-sm font-bold text-slate-700">{value || '—'}</span>
      </div>
    )}
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    present: { label: 'Active', bg: 'bg-emerald-50', color: 'text-emerald-700', dot: 'bg-emerald-500' },
    leave: { label: 'On Leave', bg: 'bg-blue-50', color: 'text-blue-700', dot: 'bg-blue-500' },
    absent: { label: 'Inactive', bg: 'bg-slate-50', color: 'text-slate-600', dot: 'bg-slate-400' },
  }
  const s = map[status] || map.absent
  return (
    <span className={`inline-flex items-center gap-2 ${s.bg} ${s.color} px-4 py-1.5 rounded-full text-xs font-black tracking-wide border border-transparent hover:border-current/10 transition-all`}>
      <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
      {s.label}
    </span>
  )
}

const EmployeeProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchEmployees, hasPermission, updateEmployee, user, resetPassword } = useAuthStore()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [isResetting, setIsResetting] = useState(false)
  const [newManualPassword, setNewManualPassword] = useState('')

  const isAdmin = user?.role === ROLES.ADMIN

  useEffect(() => {
    const load = async () => {
      try {
        const emps = await fetchEmployees()
        const emp = emps.find(e => e.id === parseInt(id))
        setEmployee(emp || null)
        if (emp) {
          setFormData({
            email: emp.email || '',
            phone: emp.phone || '',
            company_name: emp.company_name || emp.companyName || '',
            department: emp.department || '',
            location: emp.location || '',
            grade: emp.grade || '',
            role: emp.role || 'employee'
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async () => {
    try {
      await updateEmployee(employee.id, formData)
      setEmployee({ ...employee, ...formData })
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (e) {
      toast.error('Failed to update profile')
    }
  }

  const handleResetPassword = async () => {
    const passwordToSet = newManualPassword.trim() || 'Welcome@123'
    const confirmMsg = newManualPassword.trim() 
      ? `Are you sure you want to set the password to: "${passwordToSet}"?`
      : `No custom password entered. Are you sure you want to reset to default: "Welcome@123"?`

    if (!window.confirm(confirmMsg)) return
    
    setIsResetting(true)
    try {
      await resetPassword(employee.loginId || employee.login_id, employee.id, passwordToSet)
      toast.success(`Password successfully updated to: ${passwordToSet}`)
      setNewManualPassword('')
    } catch (e) {
      toast.error('Failed to update password')
    } finally {
      setIsResetting(false)
    }
  }

  const canEdit = hasPermission(MODULES.EMPLOYEES, PERMISSIONS.EDIT) || (user && user.id === parseInt(id))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <Header />
        <main className="pt-16 p-6" style={{ marginLeft: 220 }}>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-64 bg-white rounded-3xl animate-pulse" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-white rounded-3xl animate-pulse" />
              <div className="h-48 bg-white rounded-3xl animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <Header />
        <main className="pt-16 p-6" style={{ marginLeft: 220 }}>
          <div className="text-center py-24">
            <UserCircle className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold mb-6">Employee profile not found</p>
            <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
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
  const profilePicture = employee.profile_picture || employee.profilePicture || null
  const roleLabel = (employee.role || '').replace(/_/g, ' ')

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Sidebar />
      <Header />

      <main className="pt-16 p-6" style={{ marginLeft: 220 }}>
        <div className="max-w-4xl mx-auto">

          {/* Navigation & Actions */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all text-sm font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-5 h-5" />
              Directory
            </button>

            <div className="flex gap-3">
              {canEdit && (
                isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/25">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-8 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest shadow-sm">
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                )
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
          >
            {/* Premium Header */}
            <div className="relative p-10 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700">
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L100 0 L100 100 Z" fill="white" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 p-1.5 shadow-2xl overflow-hidden">
                  <div className="w-full h-full rounded-2xl bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-16 h-16 text-white/60" />
                    )}
                  </div>
                </div>
                <div className="text-center md:text-left text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-black uppercase tracking-widest mb-3">
                    {roleLabel}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">{firstName} {lastName}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-indigo-100/70 mt-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold"><Hash className="w-3.5 h-3.5" /> {loginId}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold"><Building className="w-3.5 h-3.5" /> {employee.department}</span>
                    <StatusBadge status={employee.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-10 space-y-12">
              
              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                
                {/* Personal Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-50 rounded-lg"><UserCircle className="w-4 h-4 text-indigo-600" /></div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Personal</h3>
                  </div>
                  <Field label="Email Address" value={isEditing ? formData.email : employee.email} isEditing={isEditing} onChange={v => setFormData({...formData, email: v})} icon={Mail} />
                  <Field label="Phone Number" value={isEditing ? formData.phone : employee.phone} isEditing={isEditing} onChange={v => setFormData({...formData, phone: v})} icon={Phone} />
                  <Field label="Identity Code" value={loginId} icon={Hash} />
                </div>

                {/* Employment Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg"><Briefcase className="w-4 h-4 text-purple-600" /></div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Hiring</h3>
                  </div>
                  <Field label="Department" value={isEditing ? formData.department : employee.department} isEditing={isEditing} onChange={v => setFormData({...formData, department: v})} icon={Users} />
                  <Field label="Work Location" value={isEditing ? formData.location : employee.location} isEditing={isEditing} onChange={v => setFormData({...formData, location: v})} icon={MapPin} />
                  <Field label="Employment Grade" value={isEditing ? formData.grade : employee.grade} isEditing={isEditing} onChange={v => setFormData({...formData, grade: v})} icon={Star} />
                </div>

                {/* Role Management — Admin Only */}
                {isAdmin && isEditing && (
                  <div className="md:col-span-2 p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-100 rounded-lg"><Shield className="w-4 h-4 text-indigo-600" /></div>
                      <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Access Control</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Field 
                        label="System Role" 
                        value={formData.role} 
                        isEditing={true} 
                        onChange={v => setFormData({...formData, role: v})} 
                        type="select"
                        options={['admin', 'hr_officer', 'payroll_officer', 'employee']}
                        icon={Lock}
                      />
                      <div className="flex flex-col gap-1.5 justify-end">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Security Warning</p>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Changing a user's role will immediately update their access permissions across all modules.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Actions — Admin Only */}
              {isAdmin && !isEditing && (
                <div className="pt-8 border-t border-slate-50">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full"></div>
                    <div className="relative z-10 flex-1">
                      <div className="flex items-center gap-6 mb-4">
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                          <Key className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-xl tracking-tight">Security & Access</h4>
                          <p className="text-slate-400 text-sm font-medium">Update password manually or reset to default</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            type="text"
                            value={newManualPassword}
                            onChange={(e) => setNewManualPassword(e.target.value)}
                            placeholder="Type new password (leave blank for default)"
                            className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                          />
                        </div>
                        <button 
                          onClick={handleResetPassword}
                          disabled={isResetting}
                          className="flex items-center gap-3 px-8 py-3.5 bg-indigo-500 text-white font-black rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 active:scale-95 flex-shrink-0"
                        >
                          {isResetting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

const Star = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
)

export default EmployeeProfile
