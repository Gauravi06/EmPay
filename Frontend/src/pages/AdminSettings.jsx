
import React, { useState } from 'react'
import { useAuthStore, ROLES, MODULES, PERMISSIONS } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion } from 'framer-motion'
import { Shield, Users, Key, Save, Edit2, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const { employees: storeEmployees, updateUserRole, hasPermission, user: currentUser, fetchEmployees } = useAuthStore()
  const [employees, setEmployees] = React.useState(storeEmployees || [])

  React.useEffect(() => {
    fetchEmployees().then(emps => { if (emps) setEmployees(emps) }).catch(() => {})
  }, [])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  
  const handleRoleChange = () => {
    if (selectedEmployee && selectedRole) {
      if (selectedEmployee.id === currentUser?.id) {
        toast.error("You cannot change your own role")
        return
      }
      updateUserRole(selectedEmployee.id, selectedRole).then(() => {
        fetchEmployees().then(emps => { if (emps) setEmployees(emps) }).catch(() => {})
      })
      toast.success(`Role updated successfully for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`)
      setSelectedEmployee(null)
      setSelectedRole('')
    }
  }
  
  if (!hasPermission(MODULES.SETTINGS, PERMISSIONS.VIEW)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case ROLES.ADMIN: return 'bg-purple-100 text-purple-800'
      case ROLES.HR_OFFICER: return 'bg-blue-100 text-blue-800'
      case ROLES.PAYROLL_OFFICER: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar />
      <Header />
      
      <main style={{ marginLeft: 240, paddingTop: 84, paddingLeft: 24, paddingRight: 24, paddingBottom: 40 }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary-600" />
              Admin Settings - User Access Rights
            </h1>
            <p className="text-gray-600 mt-1">Configure user roles and module-based permissions</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List Panel */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm"
              >
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Users
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Select a user to assign role</p>
                </div>
                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployee(emp)
                        setSelectedRole(emp.role)
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedEmployee?.id === emp.id
                          ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">
                              {emp.firstName} {emp.lastName}
                            </p>
                            {emp.id === currentUser?.id && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{emp.loginId}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(emp.role)}`}>
                            {emp.role?.replace('_', ' ') || 'employee'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Role Assignment Panel */}
            <div className="lg:col-span-2">
              {selectedEmployee ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-sm"
                >
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Assign Role</h2>
                      <p className="text-sm text-gray-500">
                        User: {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmployee(null)
                        setSelectedRole('')
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Role
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(ROLES).map(([key, value]) => (
                          <button
                            key={value}
                            onClick={() => setSelectedRole(value)}
                            disabled={selectedEmployee.id === currentUser?.id}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              selectedRole === value
                                ? 'border-primary-500 bg-primary-50 shadow-md'
                                : 'border-gray-200 hover:border-primary-300'
                            } ${selectedEmployee.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold capitalize text-gray-800">
                                {value.replace('_', ' ')}
                              </div>
                              {selectedRole === value && (
                                <CheckCircle className="w-5 h-5 text-primary-600" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              {value === ROLES.ADMIN && (
                                <>
                                  <div>✓ Full system access</div>
                                  <div>✓ Manage all users</div>
                                  <div>✓ Configure settings</div>
                                </>
                              )}
                              {value === ROLES.HR_OFFICER && (
                                <>
                                  <div>✓ Manage employees</div>
                                  <div>✓ Approve time off</div>
                                  <div>✓ View attendance</div>
                                </>
                              )}
                              {value === ROLES.PAYROLL_OFFICER && (
                                <>
                                  <div>✓ Process payroll</div>
                                  <div>✓ Generate reports</div>
                                  <div>✓ View salary info</div>
                                </>
                              )}
                              {value === ROLES.EMPLOYEE && (
                                <>
                                  <div>✓ Mark attendance</div>
                                  <div>✓ Request time off</div>
                                  <div>✓ View own profile</div>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedEmployee.id === currentUser?.id && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          You cannot change your own role. Contact another administrator.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleRoleChange}
                        disabled={!selectedRole || selectedEmployee.id === currentUser?.id}
                        className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Role Assignment
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(null)
                          setSelectedRole('')
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl shadow-sm p-12 text-center"
                >
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Select a User</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose a user from the list to assign or modify their role
                  </p>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Permissions Info Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Module Access Rights Overview
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Employees</th>
                    <th className="px-4 py-3 text-left">Attendance</th>
                    <th className="px-4 py-3 text-left">Time Off</th>
                    <th className="px-4 py-3 text-left">Payroll</th>
                    <th className="px-4 py-3 text-left">Reports</th>
                    <th className="px-4 py-3 text-left">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">Admin</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                    <td className="px-4 py-3 text-green-600">Full Access</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">HR Officer</td>
                    <td className="px-4 py-3 text-blue-600">View, Create, Edit</td>
                    <td className="px-4 py-3 text-blue-600">View, Edit, Approve</td>
                    <td className="px-4 py-3 text-blue-600">View, Edit, Approve</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-gray-400">No Access</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">Payroll Officer</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-blue-600">View, Create, Edit</td>
                    <td className="px-4 py-3 text-blue-600">View, Create</td>
                    <td className="px-4 py-3 text-gray-400">No Access</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">Employee</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-blue-600">View, Create</td>
                    <td className="px-4 py-3 text-blue-600">View, Create</td>
                    <td className="px-4 py-3 text-yellow-600">View Only</td>
                    <td className="px-4 py-3 text-gray-400">No Access</td>
                    <td className="px-4 py-3 text-gray-400">No Access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default AdminSettings
