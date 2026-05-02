import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize sample admin user if no employees exist
const initializeSampleData = () => {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    const data = JSON.parse(stored)
    if (!data.state.employees || data.state.employees.length === 0) {
      const sampleAdmin = {
        id: 1,
        loginId: 'IOADAD20260001',
        password: 'Admin@123',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@ems.com',
        phone: '9999999999',
        joiningYear: 2026,
        joiningDate: new Date().toISOString().split('T')[0],
        companyName: 'EMS Corporation',
        role: 'admin',
        status: 'present',
        salary: 100000,
        bankDetails: 'Sample Bank Account',
        manager: null,
        profilePicture: null,
        attendance: [],
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
      
      const sampleEmployee = {
        id: 2,
        loginId: 'IOJODO20260002',
        password: 'Employee@123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@ems.com',
        phone: '8888888888',
        joiningYear: 2026,
        joiningDate: new Date().toISOString().split('T')[0],
        companyName: 'EMS Corporation',
        role: 'employee',
        status: 'present',
        salary: 50000,
        bankDetails: null,
        manager: 'System Admin',
        profilePicture: null,
        attendance: [],
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
      
      data.state.employees = [sampleAdmin, sampleEmployee]
      data.state.timeOffRequests = []
      localStorage.setItem('auth-storage', JSON.stringify(data))
      console.log('Sample data initialized!')
      console.log('Admin Login: IOADAD20260001 / Admin@123')
      console.log('Employee Login: IOJODO20260002 / Employee@123')
    }
  }
}

initializeSampleData()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)