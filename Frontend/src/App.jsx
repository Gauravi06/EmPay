import React, { useEffect } from 'react'
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
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const theme = createTheme({
  palette: {
    primary: {
      main: '#7C3AED',
      light: '#A78BFA',
      dark: '#6D28D9',
      contrastText: '#fff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '8px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
})

function App() {
  const { isAuthenticated, refreshUser } = useAuthStore()

  // Validate stored token on every app load
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser()
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* After login → always land on /dashboard */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

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
        {/* Employee profile — view only, opened from card click */}
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
    </ThemeProvider>
  )
}

export default App
