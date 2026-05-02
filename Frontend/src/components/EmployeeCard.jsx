import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCircle, Mail, Phone, Calendar } from 'lucide-react'

const EmployeeCard = ({ employee }) => {
  const navigate = useNavigate()
  
  const getStatusColor = () => {
    switch(employee.status) {
      case 'present': return 'bg-green-500'
      case 'absent': return 'bg-yellow-500'
      case 'leave': return 'bg-blue-500'
      default: return 'bg-red-500'
    }
  }
  
  const getStatusText = () => {
    switch(employee.status) {
      case 'present': return 'Present'
      case 'absent': return 'Absent'
      case 'leave': return 'On Leave'
      default: return 'Unapproved Absence'
    }
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/employee/${employee.id}`)}
      className="bg-white rounded-xl shadow-md p-6 cursor-pointer card-hover relative"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`status-dot ${getStatusColor()}`}></div>
        <span className="text-xs text-gray-500">{getStatusText()}</span>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
          {employee.profilePicture ? (
            <img src={employee.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <UserCircle className="w-10 h-10 text-white" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm text-gray-500">{employee.loginId}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{employee.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{employee.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Joined: {employee.joiningDate}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default EmployeeCard