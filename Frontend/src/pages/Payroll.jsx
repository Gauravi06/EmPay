import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Calendar, Eye, Printer,
  AlertCircle, Users, FileText, Plus, X, Search, Sparkles, Trash2
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toFixed(2)
const fmtInt = (n) => Number(n || 0).toFixed(0)

const MONTH_NAMES = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December'
}

const PIE_COLORS = ['#7C3AED', '#38BDF8', '#FB923C', '#10B981', '#F43F5E', '#F59E0B']
const cardStyle = { background: '#fff', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #EBEBF5' }
const btnPrimary = { padding: '12px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 16px rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease' }
const statusColors = { paid: '#10B981', approved: '#3B82F6', pending: '#F59E0B', draft: '#9CA3AF' }

const StatCard = ({ title, value, icon, badge, badgeColor }) => (
  <motion.div whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }} transition={{ type: "spring", stiffness: 300 }}
    style={{ ...cardStyle, flex: 1, minWidth: 260 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: badgeColor + '15', color: badgeColor, border: `1px solid ${badgeColor}30`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{badge}</span>
    </div>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 34, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', lineHeight: 1 }}>{value}</div>
  </motion.div>
)

const Payroll = () => {
  const {
    user, fetchEmployees, fetchPayrolls, fetchAllPayrolls, generatePayroll,
    updatePayrollStatus, deletePayroll, hasPermission
  } = useAuthStore()

  const [payrolls, setPayrolls] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [showPayslip, setShowPayslip] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [genOverrides, setGenOverrides] = useState({ manual_basic: '', bonus: '' })
  const [showGenConfirm, setShowGenConfirm] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState(null)

  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER
  const canGeneratePayroll = hasPermission(MODULES.PAYROLL, PERMISSIONS.CREATE)

  const fetchBudget = useCallback(async (year, month) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/payroll/budget?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      const data = await res.json()
      setMonthlyBudget(data.budget || 0)
    } catch {}
  }, [])

  const updateBudget = async () => {
    try {
      await fetch(`http://127.0.0.1:5000/api/payroll/budget`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}` 
        },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth, budget: Number(monthlyBudget) })
      })
      toast.success('Budget updated successfully')
      setIsEditingBudget(false)
    } catch {
      toast.error('Failed to update budget')
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pList, eList] = await Promise.all([
        isAdminOrPayroll ? fetchAllPayrolls() : fetchPayrolls(),
        fetchEmployees()
      ])
      setPayrolls(pList || [])
      setEmployees(eList || [])
      fetchBudget(selectedYear, selectedMonth)
    } catch (e) {
      toast.error('Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }, [fetchPayrolls, fetchEmployees, fetchBudget, selectedYear, selectedMonth])

  useEffect(() => { if (user) loadData() }, [loadData, user])

  const filteredPayrolls = payrolls.filter(p => {
    if (searchTerm && !p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (selectedEmployee && p.user_id !== selectedEmployee.id) return false
    return true
  })

  const totalPayrollCost = payrolls
    .filter(p => p.year === selectedYear && p.month === selectedMonth)
    .reduce((sum, p) => sum + (p.net_pay || 0), 0)
    
  const budgetUtilization = monthlyBudget > 0 ? (totalPayrollCost / monthlyBudget) * 100 : 0
  const remainingBudget = monthlyBudget - totalPayrollCost

  const handleGeneratePayroll = async () => {
    const targetEmployee = selectedEmployee
    if (!targetEmployee) { toast.error('Please select an employee first'); return }

    const existing = payrolls.find(p =>
      p.user_id === targetEmployee.id &&
      p.year === selectedYear &&
      p.month === selectedMonth
    )
    if (existing) {
      const mn = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })
      toast.error(`Payroll already exists for ${mn} ${selectedYear}`)
      return
    }

    setGenerating(true)
    try {
      // Step 1: Preview
      const res = await fetch(`http://127.0.0.1:5000/api/payroll/preview?employee_id=${targetEmployee.id}&month=${selectedMonth}&year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      const data = await res.json()
      setPreviewData(data)
      setGenOverrides({ manual_basic: data.earnedSalary, bonus: '' })
      setShowGenConfirm(true)
    } catch (e) {
      toast.error('Failed to preview payroll')
    } finally {
      setGenerating(false)
    }
  }

  const confirmAndGenerate = async () => {
    setGenerating(true)
    try {
      await generatePayroll(selectedEmployee.id, selectedYear, selectedMonth, {
        bonus: Number(genOverrides.bonus || 0),
        manual_basic: genOverrides.manual_basic ? Number(genOverrides.manual_basic) : undefined
      })
      toast.success(`Payroll generated for ${selectedEmployee.firstName || selectedEmployee.first_name}`)
      loadData()
      setShowGenConfirm(false)
      setGenOverrides({ manual_basic: '', bonus: '' })
    } catch (e) {
      toast.error(e.message || 'Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  const handleStatusCycle = async (p) => {
    let nextStatus = 'draft'
    if (p.status === 'pending') nextStatus = 'approved'
    else if (p.status === 'approved') nextStatus = 'paid'
    else if (p.status === 'draft') nextStatus = 'approved'

    try {
      await updatePayrollStatus(p.id, nextStatus)
      toast.success(`Payroll ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`)
      loadData()
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  const handleDeletePayroll = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return
    try {
      await deletePayroll(id)
      toast.success('Payroll record deleted')
      loadData()
    } catch (e) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  const handleSaveAdjustment = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/payroll/${adjustmentData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}` 
        },
        body: JSON.stringify(adjustmentData)
      })
      if (res.ok) {
        toast.success('Adjustments saved')
        setShowAdjustmentModal(false)
        loadData()
      } else {
        toast.error('Failed to save adjustments')
      }
    } catch {
      toast.error('Error saving adjustments')
    }
  }

  if (!hasPermission(MODULES.PAYROLL, PERMISSIONS.VIEW)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>You do not have permission to view this page.</div>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar activePage="payroll" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '100%', marginLeft: 240 }}>
        <Header user={user} />
        
        <main style={{ padding: '84px 40px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ background: '#7C3AED', width: 12, height: 12, borderRadius: 4 }}></div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px' }}>Payroll Vault</h1>
              </div>
              <p style={{ color: '#64748B', fontWeight: 500 }}>Secure management of company-wide salary disbursements</p>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: '#fff', padding: '8px 16px', borderRadius: 16, border: '1px solid #E2E8F0', display: 'flex', gap: 12 }}>
                <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: 12 }}>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Cycle Year</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                    style={{ border: 'none', fontWeight: 700, outline: 'none', color: '#0F172A', background: 'transparent', cursor: 'pointer' }}>
                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>Payroll Month</label>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    style={{ border: 'none', fontWeight: 700, outline: 'none', color: '#0F172A', background: 'transparent', cursor: 'pointer' }}>
                    {Object.entries(MONTH_NAMES).map(([val, name]) => <option key={val} value={val}>{name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            <StatCard title="Total Payout" value={`₹${fmt(totalPayrollCost)}`} icon="💰" badge={MONTH_NAMES[selectedMonth].slice(0,3) + ' ' + selectedYear} badgeColor="#7C3AED" />
            <StatCard title="Team Count" value={payrolls.length} icon="👥" badge="Active" badgeColor="#10B981" />
            <StatCard title="Average Salary" value={`₹${fmt(payrolls.length ? totalPayrollCost / payrolls.length : 0)}`} icon="📈" badge="Per Head" badgeColor="#3B82F6" />
            
            {/* Budget Widget */}
            <motion.div style={{ ...cardStyle, flex: 2, minWidth: 480, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#fff' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px 16px', background: '#F8FAFC', borderBottomLeftRadius: 16, fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>
                FISCAL BUDGET
              </div>
              
              <div style={{ padding: '8px 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Allocation for {MONTH_NAMES[selectedMonth]} {selectedYear}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px' }}>₹{fmt(monthlyBudget)}</span>
                      {isAdminOrPayroll && (
                        <button onClick={() => setIsEditingBudget(!isEditingBudget)} style={{ background: '#F5F3FF', border: 'none', color: '#7C3AED', fontSize: 10, fontWeight: 800, padding: '6px 12px', borderRadius: 10, cursor: 'pointer' }}>
                          {isEditingBudget ? 'CANCEL' : 'EDIT'}
                        </button>
                      )}
                    </div>
                    
                    {isEditingBudget ? (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} 
                          style={{ padding: '8px 14px', borderRadius: 10, border: '2px solid #7C3AED', outline: 'none', width: 140, fontSize: 15, fontWeight: 700 }} />
                        <button onClick={updateBudget} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 12 }}>Update</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ width: '100%', height: 10, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                            style={{ height: '100%', background: budgetUtilization > 90 ? '#F43F5E' : '#7C3AED', borderRadius: 10 }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                          {budgetUtilization.toFixed(1)}% of budget utilized
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditingBudget && (
                    <div style={{ textAlign: 'right', minWidth: 160 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>REMAINING BUDGET</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: remainingBudget < 0 ? '#F43F5E' : '#10B981', letterSpacing: '-1px' }}>
                        ₹{fmt(remainingBudget)}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: remainingBudget < 0 ? '#F43F5E' : '#10B981', textTransform: 'uppercase', marginTop: 4 }}>
                         {remainingBudget < 0 ? 'Over Limit' : 'Available'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            {/* Generator Panel */}
            {canGeneratePayroll && (
              <div style={{ width: 340, flexShrink: 0 }}>
                <div style={{ ...cardStyle, position: 'sticky', top: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={18} color="#7C3AED" /> Generate New
                  </h3>
                  
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 10 }}>TARGET EMPLOYEE</label>
                    <select value={selectedEmployee?.id || ''} 
                      onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === Number(e.target.value)))}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600, color: '#0F172A', fontSize: 14, appearance: 'none', background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748B\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 16px center / 16px', cursor: 'pointer' }}>
                      <option value="">Select an employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                    </select>
                  </div>

                  <button onClick={handleGeneratePayroll} disabled={generating || !selectedEmployee}
                    style={{ ...btnPrimary, width: '100%', height: 54, justifyContent: 'center', fontSize: 15, opacity: (generating || !selectedEmployee) ? 0.6 : 1 }}>
                    {generating ? 'Processing...' : <><Plus size={20} /> Generate Payroll</>}
                  </button>
                  
                  <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 16, border: '1px dotted #CBD5E1' }}>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                      <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6, color: '#7C3AED' }} />
                      Payroll will be calculated based on attendance records and base salary for the selected period.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* List Table */}
            <div style={{ flex: 1, ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Payroll Records</h3>
                <div style={{ position: 'relative', width: 300 }}>
                  <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Search by name, code or period..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontSize: 13, fontWeight: 500, color: '#0F172A' }} />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Employee</th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Period</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Gross Wage</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Deductions</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Net Pay</th>
                      <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px 32px', textAlign: 'right', fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrolls.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>No payroll records found for this selection.</td></tr>
                    ) : (
                      filteredPayrolls.map((p, i) => (
                        <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}
                          hoverstyle={{ background: '#F8FAFC' }}>
                          <td style={{ padding: '20px 32px' }}>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{p.employee_name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{p.employee_code}</div>
                          </td>
                          <td style={{ padding: '20px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>{p.period}</td>
                          <td style={{ padding: '20px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>₹{fmt(p.gross_wage)}</td>
                          <td style={{ padding: '20px 20px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: '#F43F5E' }}>₹{fmt(p.total_deductions)}</td>
                          <td style={{ padding: '20px 20px', textAlign: 'right', fontSize: 15, fontWeight: 900, color: '#10B981' }}>₹{fmt(p.net_pay)}</td>
                          <td style={{ padding: '20px 20px', textAlign: 'center' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10, background: (statusColors[p.status] || '#94A3B8') + '15', color: statusColors[p.status] || '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${(statusColors[p.status] || '#94A3B8')}30` }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <ActionBtn onClick={() => { setSelectedPayroll(p); setShowPayslip(true) }} icon={<Printer size={16} />} title="View Payslip" />
                              {isAdminOrPayroll && (
                                <>
                                  <ActionBtn onClick={() => { setAdjustmentData(p); setShowAdjustmentModal(true) }} icon={<FileText size={16} />} title="Manual Adjustments" />
                                  {p.status !== 'paid' && (
                                    <ActionBtn 
                                      onClick={() => handleStatusCycle(p)} 
                                      icon={<span style={{fontSize:10,fontWeight:900}}>{p.status==='draft'?'▶':'✓'}</span>} 
                                      color={p.status==='approved'?'#10B981':'#7C3AED'} 
                                      title={p.status==='draft'?'Mark Approved':'Mark Paid'} 
                                    />
                                  )}
                                  <ActionBtn onClick={() => handleDeletePayroll(p.id)} icon={<Trash2 size={16} />} title="Delete Record" color="#EF4444" />
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Generation Confirm Modal */}
      <AnimatePresence>
        {showGenConfirm && (
          <Modal title="Confirm Payroll Generation" onClose={() => setShowGenConfirm(false)}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ flex: 1, padding: 20, background: '#F8FAFC', borderRadius: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 16 }}>ATTENDANCE SUMMARY</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <SummaryRow label="Working Days" value={previewData?.workingDays} />
                  <SummaryRow label="Present Days" value={previewData?.presentDays} />
                  <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0' }} />
                  <SummaryRow label="Fixed Salary" value={`₹${fmt(previewData?.fullSalary)}`} bold />
                  <SummaryRow label="Attendance Pro-rata" value={`₹${fmt(previewData?.earnedSalary)}`} color="#7C3AED" bold />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 16 }}>MANUAL OVERRIDES</h4>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Override Base Salary (Earned)</label>
                  <input type="number" value={genOverrides.manual_basic} onChange={e => setGenOverrides({...genOverrides, manual_basic: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 700, fontSize: 16 }} placeholder={previewData?.earnedSalary} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>One-time Bonus</label>
                  <input type="number" value={genOverrides.bonus} onChange={e => setGenOverrides({...genOverrides, bonus: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 700, fontSize: 16 }} placeholder="0.00" />
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button onClick={confirmAndGenerate} style={{ ...btnPrimary, flex: 1, height: 48, justifyContent: 'center' }}>Commit & Generate</button>
              <button onClick={() => setShowGenConfirm(false)} style={{ padding: '0 24px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Manual Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <Modal title="Manual Salary Adjustments" onClose={() => setShowAdjustmentModal(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <InputGroup label="Basic/Earned" value={adjustmentData.basic_salary} onChange={v => setAdjustmentData({...adjustmentData, basic_salary: Number(v)})} />
              <InputGroup label="Bonus" value={adjustmentData.performance_bonus} onChange={v => setAdjustmentData({...adjustmentData, performance_bonus: Number(v), bonus: Number(v)})} />
              <InputGroup label="HRA" value={adjustmentData.house_rent_allowance} onChange={v => setAdjustmentData({...adjustmentData, house_rent_allowance: Number(v), hra: Number(v)})} />
              <InputGroup label="Standard Allowance" value={adjustmentData.standard_allowance} onChange={v => setAdjustmentData({...adjustmentData, standard_allowance: Number(v), travel_allowance: Number(v)})} />
              <InputGroup label="PF (Employee)" value={adjustmentData.pf_employee} onChange={v => setAdjustmentData({...adjustmentData, pf_employee: Number(v), pf: Number(v)})} />
              <InputGroup label="TDS" value={adjustmentData.tds} onChange={v => setAdjustmentData({...adjustmentData, tds: Number(v)})} />
            </div>
            <div style={{ marginTop: 24, padding: 16, background: '#F0F9FF', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#0369A1' }}>New Net Calculation:</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#0369A1' }}>₹{fmt(adjustmentData.basic_salary + adjustmentData.bonus + adjustmentData.hra + adjustmentData.travel_allowance + adjustmentData.other_allowance - (adjustmentData.pf + adjustmentData.prof_tax + adjustmentData.tds))}</span>
            </div>
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button onClick={handleSaveAdjustment} style={{ ...btnPrimary, flex: 1, height: 48, justifyContent: 'center' }}>Save Adjustments</button>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ padding: '0 24px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Payslip Modal */}
      <AnimatePresence>
        {showPayslip && selectedPayroll && (
          <Modal title="Salary Statement" onClose={() => setShowPayslip(false)} wide>
            <div id="payslip-content" style={{ padding: 40, border: '1px solid #E2E8F0', borderRadius: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>EmPay</h2>
                  <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12, fontWeight: 700 }}>SMART HR & PAYROLL SOLUTIONS</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>PAYSLIP</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13, fontWeight: 600 }}>{selectedPayroll.period}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40, padding: '24px 0', borderTop: '2px solid #F1F5F9', borderBottom: '2px solid #F1F5F9' }}>
                <div>
                  <PayslipInfo label="Employee Name" value={selectedPayroll.employee_name} />
                  <PayslipInfo label="Employee ID" value={selectedPayroll.employee_code} />
                  <PayslipInfo label="Department" value={selectedPayroll.department || 'General'} />
                </div>
                <div>
                  <PayslipInfo label="Days Present" value={`${selectedPayroll.days_present} / ${selectedPayroll.working_days}`} />
                  <PayslipInfo label="Payment Date" value={selectedPayroll.payment_date || 'Pending'} />
                  <PayslipInfo label="Status" value={selectedPayroll.status?.toUpperCase()} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>EARNINGS</h4>
                  <PayslipRow label="Basic Salary (Earned)" value={fmt(selectedPayroll.basic_salary)} />
                  <PayslipRow label="HRA" value={fmt(selectedPayroll.house_rent_allowance)} />
                  <PayslipRow label="Standard Allowance" value={fmt(selectedPayroll.standard_allowance)} />
                  <PayslipRow label="Bonus" value={fmt(selectedPayroll.performance_bonus)} />
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
                    <PayslipRow label="Gross Earnings" value={fmt(selectedPayroll.gross_wage)} bold />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>DEDUCTIONS</h4>
                  <PayslipRow label="PF (Employee)" value={fmt(selectedPayroll.pf_employee)} />
                  <PayslipRow label="Professional Tax" value={fmt(selectedPayroll.professional_tax)} />
                  <PayslipRow label="TDS" value={fmt(selectedPayroll.tds)} />
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #E2E8F0' }}>
                    <PayslipRow label="Total Deductions" value={fmt(selectedPayroll.total_deductions)} bold />
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 32px', background: '#F1F5F9', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>NET SALARY PAYABLE</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED' }}>₹{fmt(selectedPayroll.net_pay)}</span>
              </div>
            </div>
            
            <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button onClick={() => window.print()} style={{ ...btnPrimary, flex: 1, height: 48, justifyContent: 'center' }}><Printer size={18} /> Print Statement</button>
              <button onClick={() => setShowPayslip(false)} style={{ padding: '0 24px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}>Close</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

const Modal = ({ title, children, onClose, wide }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
      style={{ background: '#fff', borderRadius: 32, width: '100%', maxWidth: wide ? 1000 : 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: 32, position: 'relative' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: '#F8FAFC', border: 'none', width: 40, height: 40, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}><X size={20} /></button>
      <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginBottom: 32, letterSpacing: '-0.5px' }}>{title}</h3>
      {children}
    </motion.div>
  </motion.div>
)

const ActionBtn = ({ onClick, icon, title, color = '#64748B' }) => (
  <motion.button whileHover={{ y: -2, background: '#F1F5F9' }} whileTap={{ scale: 0.95 }}
    onClick={onClick} title={title}
    style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
    {icon}
  </motion.button>
)

const SummaryRow = ({ label, value, color = '#64748B', bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: bold ? 800 : 600 }}>
    <span style={{ color: '#64748B' }}>{label}</span>
    <span style={{ color }}>{value}</span>
  </div>
)

const InputGroup = ({ label, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
    <input type="number" value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', outline: 'none', fontWeight: 700, fontSize: 15 }} />
  </div>
)

const PayslipInfo = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{value}</div>
  </div>
)

const PayslipRow = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: bold ? 800 : 500 }}>
    <span style={{ color: bold ? '#0F172A' : '#64748B' }}>{label}</span>
    <span style={{ color: '#0F172A' }}>₹{value}</span>
  </div>
)

export default Payroll