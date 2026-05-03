import React, { useState, useEffect } from 'react'
import { useAuthStore, MODULES, PERMISSIONS } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import EmployeeCard from '../components/EmployeeCard'
import { Search, Filter, UserPlus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const EmployeeList = () => {
  const { fetchEmployees, addEmployee, hasPermission, user } = useAuthStore()
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', role: 'employee', salary: 50000,
    location: 'Head Office', companyName: 'EmPay Corp'
  })

  const canCreate = hasPermission(MODULES.EMPLOYEES, PERMISSIONS.CREATE)
  const canEdit   = hasPermission(MODULES.EMPLOYEES, PERMISSIONS.EDIT)
  const canDelete = hasPermission(MODULES.EMPLOYEES, PERMISSIONS.DELETE)
  const isAdmin   = user?.role === 'admin'
  const isHR      = user?.role === 'hr_officer'

  useEffect(() => {
    const load = async () => {
      try {
        const emps = await fetchEmployees()
        setEmployees(emps || [])
      } catch (e) {
        toast.error('Failed to load employees')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredEmployees = employees.filter(emp => {
    const name = `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name} ${emp.email} ${emp.loginId || emp.login_id}`.toLowerCase()
    const matchesSearch = name.includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id) => {
    try {
      const { deleteEmployee } = useAuthStore.getState()
      await deleteEmployee(id)
      toast.success('Employee deleted successfully')
      setEmployees(employees.filter(e => e.id !== id))
    } catch (e) {
      toast.error('Failed to delete employee')
    }
  }

  const handleAdd = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('First name, last name, and email are required')
      return
    }
    try {
      await addEmployee(formData)
      toast.success('Employee added successfully!')
      setShowAddForm(false)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', department: '', role: 'employee', salary: 50000, location: 'Head Office', companyName: 'EmPay Corp' })
      const emps = await fetchEmployees()
      setEmployees(emps || [])
    } catch (e) {
      toast.error(e.message || 'Failed to add employee')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Sidebar />
      <Header />
      <main style={{ marginLeft: 240, paddingTop: 84, paddingLeft: 24, paddingRight: 24, paddingBottom: 40 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
            <p className="text-gray-600">Manage all employee records</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Employee
            </button>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white p-5 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-0 bg-white shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-10 py-3 border-0 bg-white shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 appearance-none text-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading employees...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EmployeeCard 
                  employee={employee} 
                  isAdmin={isAdmin} 
                  onDelete={handleDelete} 
                />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found</p>
          </div>
        )}

        {/* Add Employee Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Add New Employee</h2>
                  <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    ['First Name', 'firstName', 'text'],
                    ['Last Name', 'lastName', 'text'],
                    ['Email', 'email', 'email'],
                    ['Phone', 'phone', 'text'],
                    ['Department', 'department', 'text'],
                    // Salary only visible/settable by Admin
                    ...(isAdmin ? [['Salary (₹)', 'salary', 'number']] : []),
                  ].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <input
                        type={type}
                        value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="hr_officer">HR Officer</option>
                      <option value="payroll_officer">Payroll Officer</option>
                      {/* Only Admin can create another Admin */}
                      {isAdmin && <option value="admin">Admin</option>}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add Employee
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default EmployeeList