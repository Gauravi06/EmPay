import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import EmployeeList from './pages/EmployeeList'
import EmployeeProfile from './pages/EmployeeProfile'
import MyProfile from './pages/MyProfile'
import ChangePassword from './pages/ChangePassword'
import Attendance from './pages/Attendance'
import TimeOff from './pages/TimeOff'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AdminSettings from './pages/AdminSettings'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore, MODULES, PERMISSIONS } from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute module={MODULES.EMPLOYEES} permission={PERMISSIONS.VIEW}>
            <EmployeeList />
          </ProtectedRoute>
        } />
        <Route path="/employee/:id" element={
          <ProtectedRoute module={MODULES.EMPLOYEES} permission={PERMISSIONS.VIEW}>
            <EmployeeProfile />
          </ProtectedRoute>
        } />
        <Route path="/my-profile" element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        } />
        <Route path="/change-password" element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute module={MODULES.ATTENDANCE} permission={PERMISSIONS.VIEW}>
            <Attendance />
          </ProtectedRoute>
        } />
        <Route path="/time-off" element={
          <ProtectedRoute module={MODULES.TIME_OFF} permission={PERMISSIONS.VIEW}>
            <TimeOff />
          </ProtectedRoute>
        } />
        <Route path="/payroll" element={
          <ProtectedRoute module={MODULES.PAYROLL} permission={PERMISSIONS.VIEW}>
            <Payroll />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute module={MODULES.REPORTS} permission={PERMISSIONS.VIEW}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute module={MODULES.SETTINGS} permission={PERMISSIONS.VIEW}>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/admin-settings" element={
          <ProtectedRoute module={MODULES.SETTINGS} permission={PERMISSIONS.EDIT}>
            <AdminSettings />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App