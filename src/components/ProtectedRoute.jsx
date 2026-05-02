import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ProtectedRoute = ({ children, module, permission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore()
  
  if (!isAuthenticated) return <Navigate to="/login" />
  
  if (module && permission && !hasPermission(module, permission)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }
  
  return children
}

export default ProtectedRoute