import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize sample admin user and data
const initializeSampleData = () => {
  const stored = localStorage.getItem('auth-storage')
  
  // Sample admin user
  const sampleAdmin = {
    id: 1,
    loginId: 'IOADAD20260001',
    password: 'Admin@123',
    tempPassword: null,
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@ems.com',
    phone: '9999999999',
    joiningYear: 2026,
    joiningDate: '2026-01-01',
    companyName: 'EMS Corporation',
    role: 'admin',
    department: 'Administration',
    location: 'Head Office',
    uan: '123456789012',
    status: 'present',
    salary: 100000,
    bankDetails: 'Sample Bank Account - 1234567890',
    manager: null,
    profilePicture: null,
    attendance: [],
    timeOffUsed: {
      paid: 0,
      sick: 0,
      casual: 0,
      vacation: 0,
      holiday: 0,
      unpaid: 0
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
  
  // Sample employee user
  const sampleEmployee = {
    id: 2,
    loginId: 'IOJODO20260002',
    password: 'Employee@123',
    tempPassword: null,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@ems.com',
    phone: '8888888888',
    joiningYear: 2026,
    joiningDate: '2026-01-15',
    companyName: 'EMS Corporation',
    role: 'employee',
    department: 'Engineering',
    location: 'Head Office',
    uan: '987654321098',
    status: 'present',
    salary: 50000,
    bankDetails: null,
    manager: 'System Admin',
    profilePicture: null,
    attendance: [],
    timeOffUsed: {
      paid: 0,
      sick: 0,
      casual: 0,
      vacation: 0,
      holiday: 0,
      unpaid: 0
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
  
  // Sample HR Officer
  const sampleHROfficer = {
    id: 3,
    loginId: 'IOHRHR20260003',
    password: 'HR@123',
    tempPassword: null,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@ems.com',
    phone: '7777777777',
    joiningYear: 2026,
    joiningDate: '2026-02-01',
    companyName: 'EMS Corporation',
    role: 'hr_officer',
    department: 'Human Resources',
    location: 'Head Office',
    uan: '555555555555',
    status: 'present',
    salary: 70000,
    bankDetails: 'HR Bank Account - 5555555555',
    manager: 'System Admin',
    profilePicture: null,
    attendance: [],
    timeOffUsed: {
      paid: 0,
      sick: 0,
      casual: 0,
      vacation: 0,
      holiday: 0,
      unpaid: 0
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
  
  // Sample Payroll Officer
  const samplePayrollOfficer = {
    id: 4,
    loginId: 'IOPOPO20260004',
    password: 'Payroll@123',
    tempPassword: null,
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@ems.com',
    phone: '6666666666',
    joiningYear: 2026,
    joiningDate: '2026-02-15',
    companyName: 'EMS Corporation',
    role: 'payroll_officer',
    department: 'Finance',
    location: 'Head Office',
    uan: '444444444444',
    status: 'present',
    salary: 75000,
    bankDetails: 'Payroll Bank Account - 4444444444',
    manager: 'System Admin',
    profilePicture: null,
    attendance: [],
    timeOffUsed: {
      paid: 0,
      sick: 0,
      casual: 0,
      vacation: 0,
      holiday: 0,
      unpaid: 0
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
  
  // Generate sample attendance for current month
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  
  const sampleAttendance = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isWeekend = day % 7 === 0 || day % 7 === 6
    if (!isWeekend && day <= 25) {
      sampleAttendance.push({
        id: Date.now() + day,
        employeeId: 2,
        date,
        checkIn: '09:00',
        checkOut: '18:00',
        breakTime: 60,
        workHours: 8,
        overtime: 0,
        status: 'present'
      })
    }
  }
  
  sampleEmployee.attendance = sampleAttendance
  
  // Sample time off requests
  const sampleTimeOffRequests = [
    {
      id: 1001,
      employeeId: 2,
      employeeName: 'John Doe',
      startDate: '2026-05-15',
      endDate: '2026-05-17',
      days: 3,
      reason: 'Family vacation',
      type: 'paid',
      status: 'approved',
      submittedAt: '2026-05-10T10:00:00Z',
      approvedAt: '2026-05-11T09:00:00Z'
    },
    {
      id: 1002,
      employeeId: 2,
      employeeName: 'John Doe',
      startDate: '2026-05-20',
      endDate: '2026-05-20',
      days: 1,
      reason: 'Not feeling well',
      type: 'sick',
      status: 'pending',
      submittedAt: '2026-05-19T14:30:00Z'
    }
  ]
  
  // Sample payrolls
  const samplePayrolls = [
    {
      id: 2001,
      employeeId: 2,
      employeeName: 'John Doe',
      employeeCode: 'IOJODO20260002',
      uan: '987654321098',
      department: 'Engineering',
      location: 'Head Office',
      year: 2026,
      month: 4,
      period: 'April 2026',
      workedDays: 22,
      totalDays: 22,
      attendance: 20,
      paidTimeOff: 2,
      sickLeave: 0,
      vacation: 0,
      holiday: 0,
      unpaidLeave: 0,
      basicSalary: 25000,
      houseRentAllowance: 12500,
      standardAllowance: 4167,
      performanceBonus: 4165,
      leaveTravelAllowance: 2665,
      grossWage: 50000,
      pfEmployee: 6000,
      pfEmployer: 6000,
      professionalTax: 200,
      tds: 0,
      totalDeductions: 6200,
      netPay: 43800,
      baseWage: 50000,
      status: 'approved',
      generatedAt: '2026-04-30T10:00:00Z'
    }
  ]
  
  if (!stored) {
    // Create new storage
    const initialData = {
      state: {
        isAuthenticated: false,
        user: null,
        employees: [sampleAdmin, sampleEmployee, sampleHROfficer, samplePayrollOfficer],
        timeOffRequests: sampleTimeOffRequests,
        payrolls: samplePayrolls,
        payslips: []
      },
      version: 0
    }
    localStorage.setItem('auth-storage', JSON.stringify(initialData))
    console.log('✅ Sample data initialized successfully!')
    console.log('========================================')
    console.log('🔐 LOGIN CREDENTIALS:')
    console.log('========================================')
    console.log('👑 ADMIN:')
    console.log('   Login ID: IOADAD20260001')
    console.log('   Password: Admin@123')
    console.log('')
    console.log('👤 EMPLOYEE:')
    console.log('   Login ID: IOJODO20260002')
    console.log('   Password: Employee@123')
    console.log('')
    console.log('👥 HR OFFICER:')
    console.log('   Login ID: IOHRHR20260003')
    console.log('   Password: HR@123')
    console.log('')
    console.log('💰 PAYROLL OFFICER:')
    console.log('   Login ID: IOPOPO20260004')
    console.log('   Password: Payroll@123')
    console.log('========================================')
  } else {
    // Check if admin exists, if not add it
    const data = JSON.parse(stored)
    const hasAdmin = data.state.employees?.some(emp => emp.role === 'admin')
    
    if (!hasAdmin) {
      data.state.employees = [sampleAdmin, sampleEmployee, sampleHROfficer, samplePayrollOfficer, ...(data.state.employees || [])]
      localStorage.setItem('auth-storage', JSON.stringify(data))
      console.log('✅ Admin user added to existing data!')
      console.log('🔐 Admin Login ID: IOADAD20260001')
      console.log('🔐 Admin Password: Admin@123')
    }
  }
}

// Clear old data and reinitialize (uncomment to reset)
// localStorage.removeItem('auth-storage')
initializeSampleData()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)