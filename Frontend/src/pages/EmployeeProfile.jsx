import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import {
  UserCircle,
  Mail,
  Phone,
  Calendar,
  Building,
  MapPin,
  Globe,
  Users,
  Briefcase,
  Award,
  BookOpen
} from 'lucide-react'

const EmployeeProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { employees } = useAuthStore()
  const employee = employees.find(emp => emp.id === parseInt(id))
  
  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16 p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Employee not found</p>
            <button
              onClick={() => navigate('/employees')}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Back to Employees
            </button>
          </div>
        </main>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/employees')}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-block"
          >
            ← Back to Employees
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <UserCircle className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
                  <p className="text-primary-100">{employee.loginId}</p>
                  <p className="text-primary-100 mt-1">{employee.companyName}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Date of Joining: {employee.joiningDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Employment Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>Company: {employee.companyName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Status: {employee.status === 'present' ? 'Present' : employee.status === 'absent' ? 'Absent' : 'On Leave'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {!employee.bankDetails && (
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