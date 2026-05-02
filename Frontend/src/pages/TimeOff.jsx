import React, { useState, useEffect } from 'react'
import { useAuthStore, TIME_OFF_TYPES, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, CheckCircle, XCircle, Users, 
  AlertCircle, FileText, MessageSquare, Filter,
  ChevronLeft, ChevronRight, Plus, Eye, Upload,
  Lock, Unlock, Save, Download, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TimeOff = () => {
  const { user, timeOffRequests, submitTimeOff, approveTimeOff, lockTimeOff, getRemainingTimeOff, hasPermission, employees } = useAuthStore()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [lockMonth, setLockMonth] = useState(new Date().getMonth() + 1)
  const [lockYear, setLockYear] = useState(new Date().getFullYear())
  const [attachment, setAttachment] = useState(null)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: TIME_OFF_TYPES.PAID,
    employeeId: null
  })
  
  const isAdminOrHR = user?.role === ROLES.ADMIN || user?.role === ROLES.HR_OFFICER
  const canApprove = hasPermission(MODULES.TIME_OFF, PERMISSIONS.APPROVE)
  
  const userRequests = timeOffRequests.filter(req => req.employeeId === user?.id)
  const allRequests = isAdminOrHR ? timeOffRequests : userRequests
  
  const filteredRequests = allRequests.filter(req => {
    let match = true
    if (filterStatus !== 'all') match = match && req.status === filterStatus
    if (filterType !== 'all') match = match && req.type === filterType
    return match
  })
  
  const getRemainingDays = (type) => {
    const remaining = getRemainingTimeOff(selectedEmployee?.id || user?.id, type)
    return remaining === Infinity ? 'Unlimited' : remaining
  }
  
  const handleSubmitRequest = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill all fields')
      return
    }
    
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date')
      return
    }
    
    const employeeId = isAdminOrHR && formData.employeeId ? formData.employeeId : user.id
    
    const result = submitTimeOff(employeeId, formData.startDate, formData.endDate, formData.reason, formData.type, attachment)
    
    if (result.success) {
      toast.success('Time off request submitted successfully')
      setShowRequestForm(false)
      setFormData({ startDate: '', endDate: '', reason: '', type: TIME_OFF_TYPES.PAID, employeeId: null })
      setAttachment(null)
    } else {
      toast.error(result.message)
    }
  }
  
  const handleApprove = (requestId, approved) => {
    approveTimeOff(requestId, approved)
    toast.success(approved ? 'Request approved' : 'Request rejected')
  }
  
  const handleLockTimeOff = () => {
    lockTimeOff(selectedEmployee?.id || user?.id, lockYear, lockMonth, true)
    toast.success(`Time off records locked for ${new Date(lockYear, lockMonth - 1).toLocaleString('default', { month: 'long' })} ${lockYear}`)
  }
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }
  
  const getTypeBadge = (type) => {
    const types = {
      [TIME_OFF_TYPES.PAID]: 'bg-blue-100 text-blue-800',
      [TIME_OFF_TYPES.SICK]: 'bg-purple-100 text-purple-800',
      [TIME_OFF_TYPES.UNPAID]: 'bg-orange-100 text-orange-800',
      [TIME_OFF_TYPES.CASUAL]: 'bg-teal-100 text-teal-800',
      [TIME_OFF_TYPES.VACATION]: 'bg-indigo-100 text-indigo-800',
      [TIME_OFF_TYPES.HOLIDAY]: 'bg-pink-100 text-pink-800'
    }
    return types[type] || 'bg-gray-100 text-gray-800'
  }
  
  const getTypeLabel = (type) => {
    const labels = {
      [TIME_OFF_TYPES.PAID]: 'Paid Time Off',
      [TIME_OFF_TYPES.SICK]: 'Sick Leave',
      [TIME_OFF_TYPES.UNPAID]: 'Unpaid Leave',
      [TIME_OFF_TYPES.CASUAL]: 'Casual Leave',
      [TIME_OFF_TYPES.VACATION]: 'Vacation',
      [TIME_OFF_TYPES.HOLIDAY]: 'Holiday'
    }
    return labels[type] || type
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Time Off Management</h1>
              <p className="text-gray-600">Request and manage leaves and absences</p>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
          
          {/* Time Off Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.values(TIME_OFF_TYPES).map((type) => {
              const remaining = getRemainingDays(type)
              return (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{getTypeLabel(type)}</p>
                      <p className="text-xl font-bold text-primary-600">
                        {remaining === 'Unlimited' ? '∞' : remaining}
                      </p>
                      <p className="text-xs text-gray-400">Days Available</p>
                    </div>
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Types</option>
                  {Object.values(TIME_OFF_TYPES).map(type => (
                    <option key={type} value={type}>{getTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              {isAdminOrHR && (
                <div className="flex-1">
                  <select
                    value={selectedEmployee?.id || ''}
                    onChange={(e) => {
                      const emp = employees.find(em => em.id === parseInt(e.target.value))
                      setSelectedEmployee(emp)
                    }}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {/* Time Off Lock Section for Admin/HR */}
          {isAdminOrHR && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Lock Time Off Period
              </h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <input
                    type="number"
                    value={lockYear}
                    onChange={(e) => setLockYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Month</label>
                  <select
                    value={lockMonth}
                    onChange={(e) => setLockMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                {isAdminOrHR && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Employee (Optional)</label>
                    <select
                      value={selectedEmployee?.id || ''}
                      onChange={(e) => {
                        const emp = employees.find(em => em.id === parseInt(e.target.value))
                        setSelectedEmployee(emp)
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-48"
                    >
                      <option value="">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleLockTimeOff}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Lock Time Off                </button>
              </div>
            </div>
          )}
          
          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No time off requests</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {isAdminOrHR ? 'No requests to display' : 'Submit your first time off request'}
                </p>
              </div>
            ) : (
              filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-semibold text-gray-800">
                          {isAdminOrHR ? request.employeeName : 'Your Request'}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadge(request.type)}`}>
                          {getTypeLabel(request.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.locked && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            <Lock className="w-3 h-3 inline mr-1" />
                            Locked
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Start Date:</span>
                          <span className="ml-2 font-medium">{format(new Date(request.startDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">End Date:</span>
                          <span className="ml-2 font-medium">{format(new Date(request.endDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Days:</span>
                          <span className="ml-2 font-medium">{request.days} days</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Allocation:</span>
                          <span className="ml-2 font-medium">{request.days}.00 Days</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {request.reason}
                        </p>
                      </div>
                      
                      {request.attachment && (
                        <div className="mt-2 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <a href="#" className="text-sm text-primary-600 hover:underline">View Attachment</a>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-400">
                        Submitted: {format(new Date(request.submittedAt), 'MMM d, yyyy h:mm a')}
                        {request.approvedAt && ` • Approved: ${format(new Date(request.approvedAt), 'MMM d, yyyy h:mm a')}`}
                      </div>
                      
                      {request.comments && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-700">📝 {request.comments}</p>
                        </div>
                      )}
                    </div>
                    
                    {canApprove && request.status === 'pending' && !request.locked && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id, true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprove(request.id, false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
      
      {/* Request Form Modal */}
      <AnimatePresence>
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRequestForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-800">Request Time Off</h2>
                <p className="text-sm text-gray-500 mt-1">Submit a new leave or absence request</p>
              </div>
              
              <div className="p-6 space-y-4">
                {isAdminOrHR && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Off Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.values(TIME_OFF_TYPES).map(type => (
                      <option key={type} value={type}>{getTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity Period</label>
                  <input
                    type="text"
                    value={formData.startDate && formData.endDate ? `${format(new Date(formData.startDate), 'MMM d')} to ${format(new Date(formData.endDate), 'MMM d')}` : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    placeholder="Select dates above"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allocation (Days)</label>
                  <input
                    type="text"
                    value={formData.startDate && formData.endDate ? `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1}.00 Days` : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    rows="3"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Please provide a reason for your time off request..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Upload medical certificate or supporting document</p>
                    <input
                      type="file"
                      onChange={(e) => setAttachment(e.target.files[0])}
                      className="hidden"
                      id="attachment"
                    />
                    <label
                      htmlFor="attachment"
                      className="mt-2 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Submit Request
                </button>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TimeOff