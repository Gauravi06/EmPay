import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore, MODULES, PERMISSIONS, ROLES } from '../stores/authStore'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, Calendar, Eye, Printer,
  AlertCircle, Users, FileText, Plus, X, Search, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toFixed(2)
const fmtInt = (n) => Number(n || 0).toFixed(0)

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
    user, fetchEmployees, fetchPayrolls, generatePayroll,
    updatePayrollStatus, hasPermission
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
  
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState(null)

  const isAdminOrPayroll = user?.role === ROLES.ADMIN || user?.role === ROLES.PAYROLL_OFFICER
  const canGeneratePayroll = hasPermission(MODULES.PAYROLL, PERMISSIONS.CREATE)

  const fetchBudget = useCallback(async (year, month) => {
    try {
      const res = await fetch(`http://localhost:5000/api/payroll/budget?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      })
      const data = await res.json()
      setMonthlyBudget(data.budget || 0)
    } catch {}
  }, [])

  const updateBudget = async () => {
    try {
      await fetch(`http://localhost:5000/api/payroll/budget`, {
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
        fetchPayrolls(),
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
      await generatePayroll(targetEmployee.id, selectedYear, selectedMonth, {
        bonus: Number(genOverrides.bonus || 0),
        manual_basic: genOverrides.manual_basic ? Number(genOverrides.manual_basic) : undefined
      })
      toast.success(`Payroll generated for ${targetEmployee.firstName || targetEmployee.first_name}`)
      loadData()
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

  const handleSaveAdjustment = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/payroll/${adjustmentData.id}`, {
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
      toast.error('Network error')
    }
  }

  const handlePrintPayslip = (p) => {
    toast.success('Preparing high-quality PDF statement...')
    setTimeout(() => window.print(), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9]">
      <Sidebar />
      <div style={{ marginLeft: 220 }}>
        <Header />
        
        <main style={{ padding: '80px 40px 40px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flex: 1, flexWrap: 'wrap' }}>
                <FilterSelect label="Cycle Year" value={selectedYear} options={[2023, 2024, 2025, 2026]} onChange={v => setSelectedYear(parseInt(v))} />
                <FilterSelect label="Payroll Month" value={selectedMonth} options={[1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({v:m, l: new Date(2000, m-1).toLocaleString('default',{month:'long'})}))} onChange={v => setSelectedMonth(parseInt(v))} />
                
                {isAdminOrPayroll && (
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Employee</label>
                    <select value={selectedEmployee?.id || ''}
                      onChange={e => setSelectedEmployee(employees.find(emp => emp.id === parseInt(e.target.value)) || null)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237C3AED%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}>
                      <option value="">Select an employee...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName || emp.first_name} {emp.lastName || emp.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {canGeneratePayroll && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ minWidth: 100 }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manual Base</label>
                      <input type="number" placeholder="Auto" value={genOverrides.manual_basic}
                        onChange={e => setGenOverrides({ ...genOverrides, manual_basic: e.target.value })}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                    </div>
                    <button onClick={handleGeneratePayroll} disabled={generating} style={{ ...btnPrimary, height: 46 }}>
                      {generating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Plus size={18} />}
                      {generating ? 'Processing...' : 'Generate'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, minWidth: 400 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Monthly Budget</div>
                  {isEditingBudget ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="number" 
                        value={monthlyBudget} 
                        onChange={e => setMonthlyBudget(e.target.value)}
                        style={{ width: 120, padding: '4px 8px', borderRadius: 8, border: '1px solid #7C3AED', outline: 'none' }} 
                      />
                      <button onClick={updateBudget} style={{ fontSize: 11, fontWeight: 900, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#1E293B', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      ₹{fmt(monthlyBudget)}
                      <button onClick={() => setIsEditingBudget(true)} style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                    </div>
                  )}
                </div>
                <div style={{ width: 1, height: 40, background: '#EBEBF5' }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: remainingBudget < 0 ? '#F43F5E' : '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: remainingBudget < 0 ? '#F43F5E' : '#10B981' }}>₹{fmt(remainingBudget)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
              <StatCard title="Total Payout" value={`₹${fmt(totalPayrollCost)}`} icon="💰" badge={selectedYear.toString()} badgeColor="#7C3AED" />
              <StatCard title="Team Count" value={filteredPayrolls.length.toString()} icon="👥" badge="Active" badgeColor="#10B981" />
              <StatCard title="Average Salary" value={`₹${fmt(totalPayrollCost / (filteredPayrolls.length || 1))}`} icon="📈" badge="Per Head" badgeColor="#3B82F6" />
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Payroll Vault</h3>
                <div style={{ position: 'relative', width: 400 }}>
                  <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                  <input type="text" placeholder="Search by name, code or period..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: 16, border: '1.5px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: 14, fontWeight: 600 }} />
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 100, textAlign: 'center', color: '#94A3B8' }}>Loading payroll records...</div>
              ) : filteredPayrolls.length === 0 ? (
                <div style={{ padding: 100, textAlign: 'center' }}>
                  <AlertCircle size={48} color="#E2E8F0" style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>No Payroll Records</div>
                  <p style={{ color: '#64748B', fontSize: 14 }}>Ready to start the cycle? Select an employee above.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #F8FAFC' }}>
                        <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Employee</th>
                        <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Period</th>
                        <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Gross Wage</th>
                        <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Deductions</th>
                        <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Net Pay</th>
                        <th style={{ textAlign: 'center', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayrolls.map((p, idx) => {
                        const sColor = statusColors[p.status] || '#9CA3AF'
                        return (
                          <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}
                            whileHover={{ background: '#F8FAFC' }}
                            onClick={() => { setSelectedPayroll(p); setShowPayslip(true); }}>
                            <td style={{ padding: '20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7C3AED10,#7C3AED20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>{p.employee_name?.charAt(0)}</div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{p.employee_name}</div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{p.employee_code}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '20px', fontSize: 14, fontWeight: 600, color: '#475569' }}>{p.period}</td>
                            <td style={{ padding: '20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#1E293B' }}>₹{fmt(p.gross_wage)}</td>
                            <td style={{ padding: '20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#F43F5E' }}>₹{fmt(p.total_deductions)}</td>
                            <td style={{ padding: '20px', textAlign: 'right', fontSize: 15, fontWeight: 900, color: '#10B981' }}>₹{fmt(p.net_pay)}</td>
                            <td style={{ padding: '20px', textAlign: 'center' }}>
                              <span style={{ padding: '6px 12px', borderRadius: 20, background: sColor + '15', color: sColor, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{p.status}</span>
                            </td>
                            <td style={{ padding: '20px' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <ActionBtn onClick={() => handlePrintPayslip(p)} icon={<Printer size={16} />} color="#64748B" bg="#F8FAFC" />
                                {isAdminOrPayroll && p.status !== 'paid' && (
                                  <>
                                    <ActionBtn 
                                      onClick={() => { setAdjustmentData({...p}); setShowAdjustmentModal(true); }} 
                                      icon={<FileText size={16} />} 
                                      color="#7C3AED" bg="#F5F3FF" 
                                      title="Manual Adjustment"
                                    />
                                    <ActionBtn
                                      onClick={() => handleStatusCycle(p)}
                                      icon={<span style={{fontSize:10,fontWeight:900}}>{p.status==='draft'?'▶':'✓'}</span>}
                                      color="#10B981" bg="#F0FDF4"
                                      title={p.status==='draft'?'Mark Approved':'Mark Paid'}
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showAdjustmentModal && adjustmentData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, padding: 32, boxShadow: '0 40px 100px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>Manual Adjustments</h3>
                <button onClick={() => setShowAdjustmentModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Basic Salary', key: 'basic_salary' },
                  { label: 'Performance Bonus', key: 'bonus' },
                  { label: 'HRA', key: 'hra' },
                  { label: 'Travel Allowance', key: 'travel_allowance' },
                  { label: 'Other Allowance', key: 'other_allowance' },
                  { label: 'PF Contribution', key: 'pf' },
                  { label: 'Professional Tax', key: 'prof_tax' },
                  { label: 'Income Tax (TDS)', key: 'tds' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748B', marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</label>
                    <input 
                      type="number" 
                      value={adjustmentData[field.key] || 0} 
                      onChange={e => setAdjustmentData({ ...adjustmentData, [field.key]: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 16, background: '#F5F3FF', borderRadius: 16, textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase' }}>Estimated Net Pay</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#1E293B' }}>₹{fmt(adjustmentData.basic_salary + adjustmentData.bonus + adjustmentData.hra + adjustmentData.travel_allowance + adjustmentData.other_allowance - (adjustmentData.pf + adjustmentData.prof_tax + adjustmentData.tds))}</div>
              </div>
              <button onClick={handleSaveAdjustment} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 50, marginTop: 24 }}>Save Changes</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayslip && selectedPayroll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
            onClick={() => setShowPayslip(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              style={{ background: '#fff', borderRadius: 32, boxShadow: '0 40px 100px rgba(0,0,0,0.25)', maxWidth: 880, width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}
              onClick={e => e.stopPropagation()}>
              
              <div style={{ padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(124,58,237,0.3)' }}>
                      <Sparkles color="#fff" size={28} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Salary Statement</h2>
                      <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14, fontWeight: 600 }}>Period: {selectedPayroll.period}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPayslip(false)} style={{ width: 44, height: 44, borderRadius: 16, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 40, padding: 32, background: '#F8FAFC', borderRadius: 24, border: '1px solid #EBEBF5' }}>
                  <InfoItem label="Member Name" val={selectedPayroll.employee_name} />
                  <InfoItem label="Employee Code" val={selectedPayroll.employee_code} />
                  <InfoItem label="Department" val={selectedPayroll.department || 'General'} />
                  <InfoItem label="Location" val={selectedPayroll.location || 'Head Office'} />
                  <InfoItem label="UAN Number" val={selectedPayroll.uan || 'N/A'} />
                  <InfoItem label="Days Count" val={`${selectedPayroll.days_present}/${selectedPayroll.working_days}`} />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#7C3AED', fontSize: 13, fontWeight: 900 }}>EARNINGS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#7C3AED', fontSize: 13, fontWeight: 900 }}>AMOUNT</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#F43F5E', fontSize: 13, fontWeight: 900 }}>DEDUCTIONS</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#F43F5E', fontSize: 13, fontWeight: 900 }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Basic Salary', selectedPayroll.basic_salary, 'PF Employee', selectedPayroll.pf_employee],
                      ['House Rent Allowance', selectedPayroll.house_rent_allowance, 'Professional Tax', selectedPayroll.professional_tax],
                      ['Standard Allowance', selectedPayroll.standard_allowance, 'Income Tax (TDS)', selectedPayroll.tds],
                      ['Performance Bonus', selectedPayroll.performance_bonus, '', null],
                      ['Travel Allowance', selectedPayroll.leave_travel_allowance, '', null],
                    ].map(([e1, v1, e2, v2], i) => (
                      <tr key={i}>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{e1}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#10B981', textAlign: 'right' }}>₹{fmt(v1)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{e2}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 800, color: '#F43F5E', textAlign: 'right' }}>{v2 !== null ? `₹${fmt(v2)}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F8FAFC', borderTop: '2px solid #EBEBF5' }}>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900 }}>Gross Total</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900, color: '#10B981', textAlign: 'right' }}>₹{fmt(selectedPayroll.gross_wage)}</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900 }}>Total Deductions</td>
                      <td style={{ padding: 20, fontSize: 15, fontWeight: 900, color: '#F43F5E', textAlign: 'right' }}>₹{fmt(selectedPayroll.total_deductions)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ padding: 32, background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', borderRadius: 24, textAlign: 'right', boxShadow: '0 20px 40px rgba(124,58,237,0.2)' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Net Payable Amount</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginTop: 8 }}>₹{fmt(selectedPayroll.net_pay)}</div>
                </div>

                <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                  <button onClick={() => handlePrintPayslip(selectedPayroll)} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', height: 56, fontSize: 16 }}>
                    <Printer size={20} /> Print Statement
                  </button>
                  <button onClick={() => setShowPayslip(false)} style={{ flex: 1, height: 56, borderRadius: 14, border: '2px solid #F1F5F9', background: '#fff', color: '#64748B', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FilterSelect = ({ label, value, options, onChange }) => (
  <div style={{ minWidth: 140 }}>
    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, color: '#1E293B', outline: 'none', cursor: 'pointer' }}>
      {options.map(opt => typeof opt === 'object' ? <option key={opt.v} value={opt.v}>{opt.l}</option> : <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
)

const ActionBtn = ({ onClick, icon, color, bg, title }) => (
  <button onClick={onClick} title={title} style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: bg, color: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
    {icon}
  </button>
)

const InfoItem = ({ label, val }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{val}</div>
  </div>
)

export default Payroll