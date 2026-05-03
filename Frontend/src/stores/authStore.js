
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
  paid: 24, sick: 12, casual: 6,
  vacation: 20, holiday: 10, unpaid: Infinity
}

/**
 * Role permissions matrix — aligned with spec:
 *
 * ADMIN          : Full access. No limitations. Can manage roles in settings.
 * EMPLOYEE       : Time off (apply/view own), own attendance, own performance,
 *                  employee directory (view only). No payroll / reports / settings.
 * HR_OFFICER     : Monitor all attendance, manage & allocate leaves.
 *                  No payroll data, no settings.
 * PAYROLL_OFFICER: Approve/reject time-off, generate payslips & leave reports,
 *                  manage payroll, access attendance (view).
 *                  Cannot create/modify employee data or access settings
 *                  (except salary-related info — handled inside Payroll page).
 */
/**
 * RBAC Matrix (matches spec exactly):
 *
 * ADMIN          : Full CRUD on all modules. Only role that can delete employees,
 *                  change user roles, and access Settings.
 * HR_OFFICER     : Create & update employee profiles (no salary/role fields).
 *                  Monitor ALL attendance. Manage & allocate leaves.
 *                  NO payroll, NO reports, NO settings.
 * PAYROLL_OFFICER: View employee directory (read-only, no salary strip on own).
 *                  View attendance (read-only).
 *                  Approve/reject time-off. Generate payslips & reports.
 *                  Manage payroll (salary-related info on employee profiles).
 *                  NO settings, NO create/delete employees.
 * EMPLOYEE       : View employee directory (own salary only visible on own profile).
 *                  View & record own attendance (check-in/out).
 *                  Apply for time off & view own status.
 *                  NO payroll, NO reports, NO settings.
 */
const rolePermissions = {
  admin: {
    employees:  ['view', 'create', 'edit', 'delete'],
    attendance: ['view', 'create', 'edit', 'approve'],
    time_off:   ['view', 'create', 'edit', 'approve'],
    payroll:    ['view', 'create', 'edit'],
    reports:    ['view', 'create'],
    settings:   ['view', 'edit'],
  },
  hr_officer: {
    employees:  ['view', 'create', 'edit'],  // create & update profiles, NO delete, NO salary
    attendance: ['view', 'edit'],             // monitor ALL employees' attendance
    time_off:   ['view', 'create', 'edit', 'approve'], // manage & allocate leaves
    payroll:    [],                           // NO payroll access
    reports:    [],                           // NO reports
    settings:   [],                           // NO settings
  },
  payroll_officer: {
    employees:  ['view'],                     // read-only directory, can edit salary fields via payroll
    attendance: ['view'],                     // read-only attendance
    time_off:   ['view', 'approve'],          // approve/reject only
    payroll:    ['view', 'create', 'edit'],   // full payroll management + payslips
    reports:    ['view', 'create'],           // payslip & leave reports
    settings:   [],                           // NO settings
  },
  employee: {
    employees:  ['view'],                     // view directory, read-only
    attendance: ['view', 'create'],           // own attendance only
    time_off:   ['view', 'create'],           // apply & view own requests
    payroll:    [],                           // NO payroll / salary info
    reports:    [],                           // NO reports
    settings:   [],                           // NO settings
  },
}

const API_BASE = 'http://127.0.0.1:5000/api'

async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (res.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/'
    throw new Error('Session expired. Please log in again.')
  }
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (loginId, password, role) => {
        try {
          const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ loginId, password, role })
          })
          set({ isAuthenticated: true, user: data.user, token: data.token })
          return { success: true }
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      signup: async (signupData) => {
        try {
          const data = await apiFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(signupData)
          })
          return { success: true, loginId: data.user.loginId, role: data.user.role }
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      logout: () => set({ isAuthenticated: false, user: null, token: null }),

      refreshUser: async () => {
        const { token } = get()
        try {
          const data = await apiFetch('/auth/me', {}, token)
          set({ user: data.user })
        } catch {
          set({ isAuthenticated: false, user: null, token: null })
        }
      },

      hasPermission: (module, permission) => {
        const { user } = get()
        if (!user) return false
        const perms = rolePermissions[user.role] || rolePermissions.employee
        return (perms[module] || []).includes(permission)
      },

      fetchEmployees: async () => {
        const { token } = get()
        const data = await apiFetch('/employees', {}, token)
        return data.employees
      },

      addEmployee: async (employeeData) => {
        const { token } = get()
        const data = await apiFetch('/employees', {
          method: 'POST', body: JSON.stringify(employeeData)
        }, token)
        return data.employee
      },

      updateEmployee: async (id, updates) => {
        const { token, user } = get()
        const data = await apiFetch(`/employees/${id}`, {
          method: 'PUT', body: JSON.stringify(updates)
        }, token)
        // Backend returns the updated user object directly (not nested)
        const updated = data.id ? data : data.employee || data
        if (user?.id === id) set({ user: updated })
        return updated
      },

      deleteEmployee: async (id) => {
        const { token } = get()
        await apiFetch(`/employees/${id}`, { method: 'DELETE' }, token)
        return { success: true }
      },

      resetPassword: async (loginId, empId, password = null) => {
        const { token } = get()
        return await apiFetch(`/employees/${empId}/reset-password`, { 
          method: 'POST',
          body: JSON.stringify({ password })
        }, token)
      },

      updateUserRole: async (employeeId, newRole) => {
        const { token } = get()
        await apiFetch(`/employees/${employeeId}/role`, {
          method: 'PUT', body: JSON.stringify({ role: newRole })
        }, token)
        return { success: true }
      },

      updatePassword: async (loginId, oldPassword, newPassword) => {
        const { token } = get()
        try {
          return await apiFetch('/auth/change-password', {
            method: 'POST', body: JSON.stringify({ oldPassword, newPassword })
          }, token)
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      forgotPassword: async (loginId, email) => {
        try {
          return await apiFetch('/auth/forgot-password', {
            method: 'POST', body: JSON.stringify({ loginId, email })
          })
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      markAttendance: async (employeeId, date, checkIn, checkOut, breakTime = 0) => {
        const { token } = get()
        const data = await apiFetch('/attendance', {
          method: 'POST',
          body: JSON.stringify({ employeeId, date, checkIn, checkOut, breakTime })
        }, token)
        return data.attendance
      },

      checkIn: async (date, time) => {
        const { token } = get()
        const data = await apiFetch('/attendance/check-in', {
          method: 'POST',
          body: JSON.stringify({ date, time })
        }, token)
        return data
      },

      checkOut: async (date, time) => {
        const { token } = get()
        const data = await apiFetch('/attendance/check-out', {
          method: 'POST',
          body: JSON.stringify({ date, time })
        }, token)
        return data
      },

      autoCheckOut: async () => {
        const { token } = get()
        const data = await apiFetch('/attendance/auto-checkout', {
          method: 'POST'
        }, token)
        return data
      },

      getAttendance: async (employeeId, year, month) => {
        const { token } = get()
        let url = `/attendance?employee_id=${employeeId}`
        if (year && month) url += `&year=${year}&month=${month}`
        const data = await apiFetch(url, {}, token)
        return data.attendance
      },

      getMonthlyAttendance: async (employeeId, year, month) => {
        const { token } = get()
        const data = await apiFetch(
          `/attendance?employee_id=${employeeId}&year=${year}&month=${month}`, {}, token
        )
        return data.attendance
      },

      getTodayAttendance: async () => {
        const { token } = get()
        const data = await apiFetch('/attendance/today', {}, token)
        return data.attendance
      },

      getAttendanceForDate: async (employeeId, date) => {
        const { token } = get()
        const data = await apiFetch(`/attendance?employee_id=${employeeId}`, {}, token)
        return data.attendance?.find(a => a.date === date)
      },

      fetchTimeOffRequests: async () => {
        const { token } = get()
        const data = await apiFetch('/time-off', {}, token)
        return data.requests
      },

      submitTimeOff: async (type, startDate, endDate, days, reason) => {
        const { token } = get()
        try {
          const data = await apiFetch('/time-off', {
            method: 'POST',
            body: JSON.stringify({ type, startDate, endDate, days, reason })
          }, token)
          return { success: true, request: data.request }
        } catch (e) {
          return { success: false, message: e.message }
        }
      },

      approveTimeOff: async (requestId, approved, comments = '') => {
        const { token } = get()
        await apiFetch(`/time-off/${requestId}/approve`, {
          method: 'POST', body: JSON.stringify({ approved, comments })
        }, token)
        return { success: true }
      },

      lockTimeOff: async (requestId, lock) => {
        const { token } = get()
        await apiFetch(`/time-off/${requestId}/lock`, {
          method: 'POST', body: JSON.stringify({ lock })
        }, token)
      },

      getRemainingTimeOff: (employeeId, type) => {
        const { user } = get()
        const used = user?.time_off_used?.[type] || 0
        const limit = TIME_OFF_LIMITS[type]
        return limit === Infinity ? Infinity : Math.max(0, limit - used)
      },

      calculateDaysBetween: (startDate, endDate) => {
        const s = new Date(startDate), e = new Date(endDate)
        return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
      },

      fetchPayrolls: async () => {
        const { token } = get()
        const data = await apiFetch('/payroll', {}, token)
        return data.payrolls
      },

      fetchAllPayrolls: async () => {
        const { token } = get()
        const data = await apiFetch('/payroll/all', {}, token)
        return data.payrolls
      },

      generatePayroll: async (employeeId, year, month, extraData = {}) => {
        const { token } = get()
        const data = await apiFetch('/payroll/generate', {
          method: 'POST', body: JSON.stringify({ employeeId, year, month, ...extraData })
        }, token)
        return data.payroll
      },

      updatePayrollStatus: async (payrollId, status) => {
        const { token } = get()
        await apiFetch(`/payroll/${payrollId}/status`, {
          method: 'PUT', body: JSON.stringify({ status })
        }, token)
      },

      generatePayslip: async (payrollId) => {
        const { token } = get()
        const data = await apiFetch(`/payroll/${payrollId}/payslip`, { method: 'POST' }, token)
        return data.payslip
      },

      getAllPayrolls: async () => {
        const { token } = get()
        const data = await apiFetch('/payroll', {}, token)
        return data.payrolls
      },

      getPayrollsForEmployee: async (employeeId) => {
        const { token } = get()
        const data = await apiFetch('/payroll', {}, token)
        return (data.payrolls || []).filter(p => p.user_id === employeeId)
      },

      fetchReportsSummary: async () => {
        const { token } = get()
        return await apiFetch('/reports/summary', {}, token)
      },

      fetchSettingsUsers: async () => {
        const { token } = get()
        const data = await apiFetch('/settings/users', {}, token)
        return data.users
      },

      getWarnings: () => ({ withoutBank: 0, withoutManager: 0 }),
      getEmployerCosts: () => ({ monthly: {}, annual: 0 }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token
      })
    }
  )
)
