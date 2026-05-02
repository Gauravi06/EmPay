import React, { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  DollarSign,
  Award,
  BookOpen,
  Briefcase,
  CreditCard,
  Users,
  Heart,
  Flag
} from 'lucide-react'

const MyProfile = () => {
  const { user, updateEmployee } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    personalEmail: user?.personalEmail || '',
    gender: user?.gender || '',
    maritalStatus: user?.maritalStatus || '',
    residingAddress: user?.residingAddress || '',
    nationality: user?.nationality || '',
    bankDetails: user?.bankDetails || '',
    about: user?.about || '',
    certifications: user?.certifications || ''
  })
  
  const calculateSalaryComponents = (salary) => {
    const basic = salary * 0.5
    const hra = basic * 0.5
    const standardAllowance = 4167
    const performanceBonus = salary * 0.0833
    const leaveTravel = salary * 0.05333
    const pf = salary * 0.12
    const professionalTax = 200
    
    const totalComponents = basic + hra + standardAllowance + performanceBonus + leaveTravel
    const fixedAllowance = salary - totalComponents
    
    return {
      basic: Math.round(basic),
      hra: Math.round(hra),
      standardAllowance,
      performanceBonus: Math.round(performanceBonus),
      leaveTravel: Math.round(leaveTravel),
      fixedAllowance: Math.round(fixedAllowance),
      pf: Math.round(pf),
      professionalTax
    }
  }
  
  const salaryComponents = calculateSalaryComponents(user?.salary || 50000)
  
  const handleSave = () => {
    updateEmployee(user.id, formData)
    setIsEditing(false)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600">View and manage your personal information</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                  <p className="text-primary-100">{user?.loginId}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                    <input
                      type="text"
                      value={user?.loginId || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={user?.phone || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Residing Address</label>
                    <textarea
                      value={formData.residingAddress}
                      onChange={(e) => setFormData({ ...formData, residingAddress: e.target.value })}
                      disabled={!isEditing}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                    <input
                      type="text"
                      value={user?.joiningDate || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails}
                    onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter bank account number"
                  />
                </div>
              </div>
              
              {/* Salary Information */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Salary Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wage Type</label>
                    <input
                      type="text"
                      value="Fixed Wage"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Wage (Monthly)</label>
                    <input
                      type="text"
                      value={`₹${user?.salary?.toLocaleString() || '50,000'}`}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Salary Components</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span>Basic (50% of wage)</span>
                        <span className="font-medium">₹{salaryComponents.basic.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>HRA (50% of Basic)</span>
                        <span className="font-medium">₹{salaryComponents.hra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Standard Allowance</span>
                        <span className="font-medium">₹{salaryComponents.standardAllowance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Performance Bonus (8.33%)</span>
                        <span className="font-medium">₹{salaryComponents.performanceBonus.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Leave Travel Allowance (5.333%)</span>
                        <span className="font-medium">₹{salaryComponents.leaveTravel.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Fixed Allowance</span>
                        <span className="font-medium">₹{salaryComponents.fixedAllowance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>PF (12%)</span>
                        <span className="font-medium">₹{salaryComponents.pf.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Professional Tax</span>
                        <span className="font-medium">₹{salaryComponents.professionalTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Skills & Certifications */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Skills & Certifications
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      disabled={!isEditing}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                    <textarea
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      disabled={!isEditing}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="List your certifications..."
                    />
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default MyProfile