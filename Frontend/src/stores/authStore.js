import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const ROLES = {
  ADMIN: 'admin',
  HR_OFFICER: 'hr_officer',
  PAYROLL_OFFICER: 'payroll_officer',
  EMPLOYEE: 'employee'
}

export const MODULES = {
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  TIME_OFF: 'time_off',
  PAYROLL: 'payroll',
  REPORTS: 'reports',
  SETTINGS: 'settings'
}

export const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve'
}

export const TIME_OFF_TYPES = {
  PAID: 'paid',
  SICK: 'sick',
  UNPAID: 'unpaid',
  CASUAL: 'casual',
  VACATION: 'vacation',
  HOLIDAY: 'holiday'
}

const TIME_OFF_LIMITS = {
  [TIME_OFF_TYPES.PAID]: 24,
  [TIME_OFF_TYPES.SICK]: 12,
  [TIME_OFF_TYPES.CASUAL]: 6,
  [TIME_OFF_TYPES.VACATION]: 20,
  [TIME_OFF_TYPES.HOLIDAY]: 10,
  [TIME_OFF_TYPES.UNPAID]: Infinity
}

// Role-based permissions configuration
const rolePermissions = {
  [ROLES.ADMIN]: {
    [MODULES.EMPLOYEES]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.DELETE],
    [MODULES.ATTENDANCE]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.APPROVE],
    [MODULES.TIME_OFF]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT, PERMISSIONS.APPROVE],
    [MODULES.PAYROLL]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT],
    [MODULES.REPORTS]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE],
    [MODULES.SETTINGS]: [PERMISSIONS.VIEW, PERMISSIONS.EDIT]
  },
  [ROLES.HR_OFFICER]: {
    [MODULES.EMPLOYEES]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT],
    [MODULES.ATTENDANCE]: [PERMISSIONS.VIEW, PERMISSIONS.EDIT, PERMISSIONS.APPROVE],
    [MODULES.TIME_OFF]: [PERMISSIONS.VIEW, PERMISSIONS.EDIT, PERMISSIONS.APPROVE],
    [MODULES.PAYROLL]: [PERMISSIONS.VIEW],
    [MODULES.REPORTS]: [PERMISSIONS.VIEW],
    [MODULES.SETTINGS]: []
  },
  [ROLES.PAYROLL_OFFICER]: {
    [MODULES.EMPLOYEES]: [PERMISSIONS.VIEW],
    [MODULES.ATTENDANCE]: [PERMISSIONS.VIEW],
    [MODULES.TIME_OFF]: [PERMISSIONS.VIEW],
    [MODULES.PAYROLL]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT],
    [MODULES.REPORTS]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE],
    [MODULES.SETTINGS]: []
  },
  [ROLES.EMPLOYEE]: {
    [MODULES.EMPLOYEES]: [PERMISSIONS.VIEW],
    [MODULES.ATTENDANCE]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE],
    [MODULES.TIME_OFF]: [PERMISSIONS.VIEW, PERMISSIONS.CREATE],
    [MODULES.PAYROLL]: [PERMISSIONS.VIEW],
    [MODULES.REPORTS]: [],
    [MODULES.SETTINGS]: []
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      employees: [],
      timeOffRequests: [],
      payrolls: [],
      payslips: [],
      
      login: (loginId, password) => {
        const employees = get().employees
        const employee = employees.find(emp => emp.loginId === loginId)
        
        if (employee && employee.password === password) {
          set({ isAuthenticated: true, user: employee })
          return { success: true }
        }
        return { success: false, message: 'Invalid credentials' }
      },
      
      logout: () => {
        set({ isAuthenticated: false, user: null })
      },
      
      hasPermission: (module, permission) => {
        const { user } = get()
        if (!user) return false
        const userPermissions = rolePermissions[user.role] || rolePermissions[ROLES.EMPLOYEE]
        return userPermissions[module]?.includes(permission) || false
      },
      
      addEmployee: (employeeData) => {
        const employees = get().employees
        const year = new Date().getFullYear()
        const yearEmployees = employees.filter(emp => emp.joiningYear === year)
        const serialNumber = String(yearEmployees.length + 1).padStart(4, '0')
        
        const companyCode = 'IO'
        const nameCode = (employeeData.firstName.slice(0, 2) + employeeData.lastName.slice(0, 2)).toUpperCase()
        const loginId = `${companyCode}${nameCode}${year}${serialNumber}`
        
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
        
        const newEmployee = {
          id: Date.now(),
          loginId,
          password: tempPassword,
          tempPassword: tempPassword,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          joiningYear: year,
          joiningDate: new Date().toISOString().split('T')[0],
          companyName: employeeData.companyName,
          role: employeeData.role || ROLES.EMPLOYEE,
          department: employeeData.department || 'General',
          location: employeeData.location || 'Head Office',
          uan: employeeData.uan || '',
          status: 'present',
          salary: employeeData.salary || 50000,
          bankDetails: employeeData.bankDetails || null,
          manager: employeeData.manager || null,
          profilePicture: null,
          attendance: [],
          timeOffUsed: {
            [TIME_OFF_TYPES.PAID]: 0,
            [TIME_OFF_TYPES.SICK]: 0,
            [TIME_OFF_TYPES.CASUAL]: 0,
            [TIME_OFF_TYPES.VACATION]: 0,
            [TIME_OFF_TYPES.HOLIDAY]: 0,
            [TIME_OFF_TYPES.UNPAID]: 0
          },
          salaryComponents: {
            basic: { type: 'percentage', value: 50 },
            hra: { type: 'percentage_of_basic', value: 50 },
            standardAllowance: { type: 'fixed', value: 4167 },
            performanceBonus: { type: 'percentage', value: 8.33 },
            leaveTravel: { type: 'percentage', value: 5.333 },
            pf: { type: 'percentage', value: 12 },
            professionalTax: { type: 'fixed', value: 200 }
          }
        }
        
        set({ employees: [...employees, newEmployee] })
        console.log(`Email sent to ${newEmployee.email}: Login ID: ${loginId}, Password: ${tempPassword}`)
        
        return newEmployee
      },
      
      updateEmployee: (id, updates) => {
        const employees = get().employees
        const updatedEmployees = employees.map(emp => 
          emp.id === id ? { ...emp, ...updates } : emp
        )
        set({ employees: updatedEmployees })
        
        if (get().user?.id === id) {
          set({ user: { ...get().user, ...updates } })
        }
      },
      
      markAttendance: (employeeId, date, checkInTime, checkOutTime, breakTime = 0) => {
        const employees = get().employees
        const existingAttendance = get().getAttendanceForDate(employeeId, date)
        
        let attendanceRecord = existingAttendance || {
          id: Date.now(),
          employeeId,
          date,
          checkIn: null,
          checkOut: null,
          breakTime: 0,
          workHours: 0,
          overtime: 0,
          status: 'absent'
        }
        
        if (checkInTime) {
          attendanceRecord.checkIn = checkInTime
          attendanceRecord.status = 'present'
        }
        if (checkOutTime) {
          attendanceRecord.checkOut = checkOutTime
          const checkIn = new Date(`${date}T${attendanceRecord.checkIn}`)
          const checkOut = new Date(`${date}T${checkOutTime}`)
          const totalHours = (checkOut - checkIn) / (1000 * 60 * 60)
          attendanceRecord.workHours = Math.max(0, totalHours - (attendanceRecord.breakTime / 60))
          attendanceRecord.overtime = Math.max(0, attendanceRecord.workHours - 9)
        }
        if (breakTime !== undefined && breakTime !== null) {
          attendanceRecord.breakTime = breakTime
          if (attendanceRecord.checkIn && attendanceRecord.checkOut) {
            const checkIn = new Date(`${date}T${attendanceRecord.checkIn}`)
            const checkOut = new Date(`${date}T${attendanceRecord.checkOut}`)
            const totalHours = (checkOut - checkIn) / (1000 * 60 * 60)
            attendanceRecord.workHours = Math.max(0, totalHours - (breakTime / 60))
          }
        }
        
        const updatedEmployees = employees.map(emp => {
          if (emp.id === employeeId) {
            const attendanceList = emp.attendance || []
            const index = attendanceList.findIndex(a => a.date === date)
            if (index >= 0) {
              attendanceList[index] = attendanceRecord
            } else {
              attendanceList.push(attendanceRecord)
            }
            const today = new Date().toISOString().split('T')[0]
            if (date === today && attendanceRecord.checkIn) {
              emp.status = 'present'
            }
            return { ...emp, attendance: attendanceList }
          }
          return emp
        })
        
        set({ employees: updatedEmployees })
        if (get().user?.id === employeeId) {
          const updatedUser = updatedEmployees.find(emp => emp.id === employeeId)
          set({ user: updatedUser })
        }
        
        return attendanceRecord
      },
      
      getAttendanceForDate: (employeeId, date) => {
        const { employees } = get()
        const employee = employees.find(emp => emp.id === employeeId)
        return employee?.attendance?.find(a => a.date === date)
      },
      
      getMonthlyAttendance: (employeeId, year, month) => {
        const { employees } = get()
        const employee = employees.find(emp => emp.id === employeeId)
        if (!employee) return []
        
        return (employee.attendance || []).filter(att => {
          const [attYear, attMonth] = att.date.split('-')
          return parseInt(attYear) === year && parseInt(attMonth) === month
        }).sort((a, b) => new Date(a.date) - new Date(b.date))
      },
      
      submitTimeOff: (employeeId, startDate, endDate, reason, type, attachment = null) => {
        const timeOffRequests = get().timeOffRequests
        const employee = get().employees.find(e => e.id === employeeId)
        const daysRequested = get().calculateDaysBetween(startDate, endDate)
        const currentUsed = employee?.timeOffUsed?.[type] || 0
        const limit = TIME_OFF_LIMITS[type]
        
        if (currentUsed + daysRequested > limit && limit !== Infinity) {
          return { success: false, message: `Insufficient ${type} leave balance. Available: ${limit - currentUsed} days` }
        }
        
        const newRequest = {
          id: Date.now(),
          employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : '',
          startDate,
          endDate,
          days: daysRequested,
          reason,
          type,
          attachment,
          status: 'pending',
          submittedAt: new Date().toISOString()
        }
        
        set({ timeOffRequests: [...timeOffRequests, newRequest] })
        return { success: true, request: newRequest }
      },
      
      approveTimeOff: (requestId, approved, comments = '') => {
        const timeOffRequests = get().timeOffRequests
        const request = timeOffRequests.find(req => req.id === requestId)
        
        if (approved && request) {
          const employees = get().employees
          const updatedEmployees = employees.map(emp => {
            if (emp.id === request.employeeId) {
              const currentUsed = emp.timeOffUsed || {}
              return {
                ...emp,
                timeOffUsed: {
                  ...currentUsed,
                  [request.type]: (currentUsed[request.type] || 0) + request.days
                }
              }
            }
            return emp
          })
          set({ employees: updatedEmployees })
        }
        
        const updatedRequests = timeOffRequests.map(req =>
          req.id === requestId 
            ? { ...req, status: approved ? 'approved' : 'rejected', approvedAt: new Date().toISOString(), comments }
            : req
        )
        set({ timeOffRequests: updatedRequests })
        
        return { success: true }
      },
      
      calculateDaysBetween: (startDate, endDate) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      },
      
      getRemainingTimeOff: (employeeId, type) => {
        const employee = get().employees.find(e => e.id === employeeId)
        if (!employee) return 0
        const used = employee.timeOffUsed?.[type] || 0
        const limit = TIME_OFF_LIMITS[type]
        return limit === Infinity ? Infinity : Math.max(0, limit - used)
      },
      
      lockTimeOff: (employeeId, year, month, lock) => {
        const timeOffRequests = get().timeOffRequests
        const updatedRequests = timeOffRequests.map(req => {
          const reqDate = new Date(req.startDate)
          if (req.employeeId === employeeId && reqDate.getFullYear() === year && reqDate.getMonth() + 1 === month) {
            return { ...req, locked: lock }
          }
          return req
        })
        set({ timeOffRequests: updatedRequests })
      },
      
      generatePayroll: (employeeId, year, month) => {
        const employee = get().employees.find(e => e.id === employeeId)
        if (!employee) return null
        
        const attendance = get().getMonthlyAttendance(employeeId, year, month)
        const timeOff = get().timeOffRequests.filter(req => 
          req.employeeId === employeeId && 
          req.status === 'approved' &&
          new Date(req.startDate).getFullYear() === year &&
          new Date(req.startDate).getMonth() + 1 === month
        )
        
        const totalDaysInMonth = new Date(year, month, 0).getDate()
        const workingDays = totalDaysInMonth - 8 // Approx weekends
        const presentDays = attendance.filter(a => a.status === 'present' && a.checkIn).length
        const paidTimeOffDays = timeOff.filter(t => t.type === TIME_OFF_TYPES.PAID).reduce((sum, t) => sum + t.days, 0)
        const sickDays = timeOff.filter(t => t.type === TIME_OFF_TYPES.SICK).reduce((sum, t) => sum + t.days, 0)
        const vacationDays = timeOff.filter(t => t.type === TIME_OFF_TYPES.VACATION).reduce((sum, t) => sum + t.days, 0)
        const holidayDays = timeOff.filter(t => t.type === TIME_OFF_TYPES.HOLIDAY).reduce((sum, t) => sum + t.days, 0)
        const unpaidDays = timeOff.filter(t => t.type === TIME_OFF_TYPES.UNPAID).reduce((sum, t) => sum + t.days, 0)
        
        const payableDays = presentDays + paidTimeOffDays + sickDays + vacationDays + holidayDays
        const dailyRate = employee.salary / workingDays
        const baseWage = dailyRate * payableDays
        
        // Calculate salary components
        const basic = baseWage * 0.5
        const hra = basic * 0.5
        const standardAllowance = 4167
        const performanceBonus = baseWage * 0.0833
        const leaveTravel = baseWage * 0.05333
        
        const grossWage = basic + hra + standardAllowance + performanceBonus + leaveTravel
        
        const pfEmployee = baseWage * 0.12
        const pfEmployer = baseWage * 0.12
        const professionalTax = 200
        const tds = baseWage > 50000 ? baseWage * 0.1 : 0
        
        const totalDeductions = pfEmployee + professionalTax + tds
        const netPay = grossWage - totalDeductions
        
        const payroll = {
          id: Date.now(),
          employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.loginId,
          uan: employee.uan,
          department: employee.department,
          location: employee.location,
          year,
          month,
          period: `${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} ${year}`,
          workedDays: payableDays,
          totalDays: workingDays,
          attendance: presentDays,
          paidTimeOff: paidTimeOffDays,
          sickLeave: sickDays,
          vacation: vacationDays,
          holiday: holidayDays,
          unpaidLeave: unpaidDays,
          basicSalary: basic,
          houseRentAllowance: hra,
          standardAllowance,
          performanceBonus,
          leaveTravelAllowance: leaveTravel,
          grossWage,
          pfEmployee,
          pfEmployer,
          professionalTax,
          tds,
          totalDeductions,
          netPay,
          baseWage,
          status: 'draft',
          generatedAt: new Date().toISOString()
        }
        
        const payrolls = get().payrolls
        set({ payrolls: [...payrolls, payroll] })
        
        return payroll
      },
      
      getPayrollsForEmployee: (employeeId) => {
        const { payrolls } = get()
        return payrolls.filter(p => p.employeeId === employeeId).sort((a, b) => b.year - a.year || b.month - a.month)
      },
      
      getAllPayrolls: () => {
        const { payrolls, employees } = get()
        return payrolls.map(p => ({
          ...p,
          employee: employees.find(e => e.id === p.employeeId)
        })).sort((a, b) => b.year - a.year || b.month - a.month)
      },
      
      updatePayrollStatus: (payrollId, status) => {
        const payrolls = get().payrolls
        const updatedPayrolls = payrolls.map(p =>
          p.id === payrollId ? { ...p, status } : p
        )
        set({ payrolls: updatedPayrolls })
      },
      
      generatePayslip: (payrollId) => {
        const payroll = get().payrolls.find(p => p.id === payrollId)
        if (!payroll) return null
        
        const payslip = {
          id: Date.now(),
          payrollId,
          ...payroll,
          generatedAt: new Date().toISOString()
        }
        
        const payslips = get().payslips
        set({ payslips: [...payslips, payslip] })
        
        return payslip
      },
      
      getPayslip: (payslipId) => {
        const { payslips } = get()
        return payslips.find(p => p.id === payslipId)
      },
      
      getEmployerCosts: () => {
        const { employees, payrolls } = get()
        const currentYear = new Date().getFullYear()
        const monthlyCosts = {}
        
        for (let month = 1; month <= 12; month++) {
          const monthPayrolls = payrolls.filter(p => p.year === currentYear && p.month === month)
          monthlyCosts[month] = monthPayrolls.reduce((sum, p) => sum + p.grossWage + p.pfEmployer, 0)
        }
        
        return {
          monthly: monthlyCosts,
          annual: Object.values(monthlyCosts).reduce((a, b) => a + b, 0)
        }
      },
      
      getWarnings: () => {
        const { employees } = get()
        return {
          withoutBank: employees.filter(e => !e.bankDetails).length,
          withoutManager: employees.filter(e => !e.manager).length
        }
      },
      
      updatePassword: (loginId, oldPassword, newPassword) => {
        const employees = get().employees
        const employee = employees.find(emp => emp.loginId === loginId)
        
        if (!employee || employee.password !== oldPassword) {
          return { success: false, message: 'Invalid current password' }
        }
        
        const updatedEmployees = employees.map(emp =>
          emp.loginId === loginId ? { ...emp, password: newPassword, tempPassword: null } : emp
        )
        set({ employees: updatedEmployees })
        
        if (get().user?.loginId === loginId) {
          set({ user: { ...get().user, password: newPassword, tempPassword: null } })
        }
        
        return { success: true, message: 'Password updated successfully' }
      },
      
      resetPassword: (loginId) => {
        const employees = get().employees
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
        
        const updatedEmployees = employees.map(emp =>
          emp.loginId === loginId ? { ...emp, password: newPassword, tempPassword: newPassword } : emp
        )
        set({ employees: updatedEmployees })
        
        console.log(`Password reset email sent to ${updatedEmployees.find(emp => emp.loginId === loginId)?.email}: New Password: ${newPassword}`)
        
        return { success: true, message: 'Password reset email sent' }
      },
      
      updateUserRole: (employeeId, newRole) => {
        const employees = get().employees
        const updatedEmployees = employees.map(emp =>
          emp.id === employeeId ? { ...emp, role: newRole } : emp
        )
        set({ employees: updatedEmployees })
        return { success: true }
      },
      
      getTodayAttendance: () => {
        const { employees } = get()
        const today = new Date().toISOString().split('T')[0]
        return employees.map(emp => {
          const todayAttendance = emp.attendance?.find(a => a.date === today)
          return {
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            loginId: emp.loginId,
            checkIn: todayAttendance?.checkIn || '-',
            checkOut: todayAttendance?.checkOut || '-',
            workHours: todayAttendance?.workHours || 0,
            status: todayAttendance?.status || emp.status
          }
        })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)