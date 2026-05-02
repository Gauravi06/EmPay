import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, TIME_OFF_TYPES, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, CheckCircle, XCircle, MessageSquare, Filter,
  Plus, Upload, Lock, Save
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const TimeOff = () => {
  const {
    user, fetchTimeOffRequests, submitTimeOff, approveTimeOff, lockTimeOff,
    getRemainingTimeOff, hasPermission, fetchEmployees
  } = useAuthStore()

  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [lockMonth, setLockMonth] = useState(new Date().getMonth() + 1)
  const [lockYear, setLockYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({
    startDate: '', endDate: '', reason: '', type: TIME_OFF_TYPES.PAID, employeeId: null
  })

  const isAdminOrHR = user?.role === ROLES.ADMIN || user?.role === ROLES.HR_OFFICER
  const canApprove = hasPermission(MODULES.TIME_OFF, PERMISSIONS.APPROVE)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const reqs = await fetchTimeOffRequests()
      setRequests(reqs || [])
      if (isAdminOrHR) {
        const emps = await fetchEmployees()
        setEmployees(emps || [])
      }
    } catch (e) {
      toast.error('Failed to load time off data')
    } finally {
      setLoading(false)
    }
  }, [isAdminOrHR])

  useEffect(() => {
    if (user) loadData()
  }, [loadData])

  // Filter requests
  const baseRequests = isAdminOrHR
    ? (selectedEmployee ? requests.filter(r => r.user_id === selectedEmployee.id) : requests)
    : requests.filter(r => r.user_id === user?.id)

  const filteredRequests = baseRequests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false
    if (filterType !== 'all' && req.type !== filterType) return false
    return true
  })

  const getRemainingDays = (type) => {
    const remaining = getRemainingTimeOff(user?.id, type)
    return remaining === Infinity ? 'Unlimited' : remaining
  }

  const handleSubmitRequest = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill all fields'); return
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date'); return
    }
    const employeeId = isAdminOrHR && formData.employeeId ? formData.employeeId : user.id
    try {
      const result = await submitTimeOff(employeeId, formData.startDate, formData.endDate, formData.reason, formData.type)
      if (result.success) {
        toast.success('Time off request submitted successfully')
        setShowRequestForm(false)
        setFormData({ startDate: '', endDate: '', reason: '', type: TIME_OFF_TYPES.PAID, employeeId: null })
        loadData()
      } else {
        toast.error(result.message || 'Submission failed')
      }
    } catch (e) {
      toast.error(e.message || 'Submission failed')
    }
  }

  const handleApprove = async (requestId, approved) => {
    try {
      await approveTimeOff(requestId, approved)
      toast.success(approved ? 'Request approved' : 'Request rejected')
      loadData()
    } catch (e) {
      toast.error(e.message || 'Action failed')
    }
  }

  const handleLockTimeOff = async () => {
    try {
      // Lock all pending requests for that month
      const toLock = requests.filter(r => {
        const d = new Date(r.start_date)
        return d.getFullYear() === lockYear && (d.getMonth() + 1) === lockMonth &&
          (!selectedEmployee || r.user_id === selectedEmployee.id)
      })
      await Promise.all(toLock.map(r => lockTimeOff(r.id, true)))
      toast.success(`Time off locked for ${new Date(lockYear, lockMonth - 1).toLocaleString('default', { month: 'long' })} ${lockYear}`)
      loadData()
    } catch (e) {
      toast.error(e.message || 'Lock failed')
    }
  }

  const getStatusBadge = (status) => ({
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }[status] || 'bg-yellow-100 text-yellow-800')

  const getTypeBadge = (type) => ({
    [TIME_OFF_TYPES.PAID]: 'bg-blue-100 text-blue-800',
    [TIME_OFF_TYPES.SICK]: 'bg-purple-100 text-purple-800',
    [TIME_OFF_TYPES.UNPAID]: 'bg-orange-100 text-orange-800',
    [TIME_OFF_TYPES.CASUAL]: 'bg-teal-100 text-teal-800',
    [TIME_OFF_TYPES.VACATION]: 'bg-indigo-100 text-indigo-800',
    [TIME_OFF_TYPES.HOLIDAY]: 'bg-pink-100 text-pink-800'
  }[type] || 'bg-gray-100 text-gray-800')

  const getTypeLabel = (type) => ({
    [TIME_OFF_TYPES.PAID]: 'Paid Time Off',
    [TIME_OFF_TYPES.SICK]: 'Sick Leave',
    [TIME_OFF_TYPES.UNPAID]: 'Unpaid Leave',
    [TIME_OFF_TYPES.CASUAL]: 'Casual Leave',
    [TIME_OFF_TYPES.VACATION]: 'Vacation',
    [TIME_OFF_TYPES.HOLIDAY]: 'Holiday'
  }[type] || type)

  const safeDate = (d) => { try { return format(new Date(d), 'MMM d, yyyy') } catch { return d || '—' } }
  const safeDateTime = (d) => { try { return format(new Date(d), 'MMM d, yyyy h:mm a') } catch { return d || '—' } }

  const calcDays = () => {
    if (!formData.startDate || !formData.endDate) return ''
    return `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / 86400000) + 1}.00 Days`
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.values(TIME_OFF_TYPES).map(type => {
              const remaining = getRemainingDays(type)
              return (
                <div key={type} className="bg-white rounded-xl shadow-sm p-4">
                  <p className="text-xs text-gray-500">{getTypeLabel(type)}</p>
                  <p className="text-xl font-bold text-indigo-600">{remaining === 'Unlimited' ? '∞' : remaining}</p>
                  <p className="text-xs text-gray-400">Days Available</p>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Types</option>
                {Object.values(TIME_OFF_TYPES).map(t => (
                  <option key={t} value={t}>{getTypeLabel(t)}</option>
                ))}
              </select>
              {isAdminOrHR && (
                <select value={selectedEmployee?.id || ''}
                  onChange={e => setSelectedEmployee(employees.find(em => em.id === parseInt(e.target.value)) || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48">
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Lock Period (Admin/HR) */}
          {isAdminOrHR && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Lock Time Off Period
              </h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <input type="number" value={lockYear} onChange={e => setLockYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-24" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Month</label>
                  <select value={lockMonth} onChange={e => setLockMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleLockTimeOff}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Lock Time Off
                </button>
              </div>
            </div>
          )}

          {/* Requests List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No time off requests</h3>
              <p className="text-sm text-gray-400 mt-1">
                {isAdminOrHR ? 'No requests to display' : 'Submit your first time off request'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <motion.div key={request.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-semibold text-gray-800">
                          {isAdminOrHR ? (request.employee_name || 'Employee') : 'Your Request'}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadge(request.type)}`}>
                          {getTypeLabel(request.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
                        </span>
                        {request.locked === 1 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            <Lock className="w-3 h-3 inline mr-1" />Locked
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div><span className="text-gray-500">Start:</span> <span className="font-medium">{safeDate(request.start_date)}</span></div>
                        <div><span className="text-gray-500">End:</span> <span className="font-medium">{safeDate(request.end_date)}</span></div>
                        <div><span className="text-gray-500">Days:</span> <span className="font-medium">{request.days}</span></div>
                        <div><span className="text-gray-500">Submitted:</span> <span className="font-medium">{safeDate(request.submitted_at)}</span></div>
                      </div>

                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          {request.reason}
                        </p>
                      </div>

                      {request.comments && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-700">📝 {request.comments}</p>
                        </div>
                      )}

                      {request.approved_at && (
                        <div className="mt-1 text-xs text-gray-400">
                          Approved: {safeDateTime(request.approved_at)}
                        </div>
                      )}
                    </div>

                    {canApprove && request.status === 'pending' && !request.locked && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(request.id, true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleApprove(request.id, false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Request Form Modal */}
      <AnimatePresence>
        {showRequestForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRequestForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-800">Request Time Off</h2>
                <p className="text-sm text-gray-500 mt-1">Submit a new leave or absence request</p>
              </div>

              <div className="p-6 space-y-4">
                {isAdminOrHR && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select value={formData.employeeId || ''}
                      onChange={e => setFormData({ ...formData, employeeId: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Off Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    {Object.values(TIME_OFF_TYPES).map(t => (
                      <option key={t} value={t}>{getTypeLabel(t)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min={format(new Date(), 'yyyy-MM-dd')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min={formData.startDate || format(new Date(), 'yyyy-MM-dd')} />
                  </div>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
                    Duration: <strong>{calcDays()}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea rows="3" value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Please provide a reason..." />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <button onClick={handleSubmitRequest}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Submit Request
                </button>
                <button onClick={() => setShowRequestForm(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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