import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ProtectedRoute = ({ children, module, permission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (module && permission && !hasPermission(module, permission)) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8F8FC', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            Access Restricted
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15, marginBottom: 24 }}>
            You don't have permission to access this page. Contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: '#7C3AED', color: '#fff', fontWeight: 700,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute