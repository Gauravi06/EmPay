import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  Stack, 
  Chip,
  Tooltip,
  Divider
} from '@mui/material'
import { 
  EmailRounded as MailIcon, 
  PhoneRounded as PhoneIcon, 
  CalendarTodayRounded as CalendarIcon,
  AirplanemodeActiveRounded as LeaveIcon,
  FiberManualRecordRounded as StatusIcon,
  DeleteOutlineRounded as DeleteIcon
} from '@mui/icons-material'

const StatusIndicator = ({ status }) => {
  if (status === 'present') {
    return (
      <Tooltip title="Present">
        <StatusIcon sx={{ color: '#10b981', fontSize: 16 }} />
      </Tooltip>
    )
  }
  if (status === 'leave') {
    return (
      <Tooltip title="On Leave">
        <LeaveIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
      </Tooltip>
    )
  }
  return (
    <Tooltip title="Absent">
      <StatusIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
    </Tooltip>
  )
}

const EmployeeCard = ({ employee, isAdmin, onDelete }) => {
  const navigate = useNavigate()

  const firstName = employee.first_name || employee.firstName || ''
  const lastName = employee.last_name || employee.lastName || ''
  const loginId = employee.login_id || employee.loginId || ''
  const joiningDate = employee.joining_date || employee.joiningDate || ''
  const profilePicture = employee.profile_picture || employee.profilePicture || null
  const status = employee.status || 'absent'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/employee/${employee.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <Card sx={{ 
        borderRadius: 4, 
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 24px rgba(124, 58, 237, 0.12)',
          borderColor: 'primary.light'
        },
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Top Row: Avatar and Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Avatar 
              src={profilePicture} 
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: 'primary.main',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
              }}
            >
              {!profilePicture && `${firstName[0]}${lastName[0]}`}
            </Avatar>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusIndicator status={status} />
              {isAdmin && (
                <Tooltip title="Delete Employee">
                  <Box 
                    component="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete ${firstName}?`)) {
                        onDelete(employee.id);
                      }
                    }}
                    sx={{ 
                      p: 0.5, 
                      borderRadius: 1, 
                      border: 'none', 
                      bgcolor: 'transparent',
                      color: 'error.light',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 20 }} />
                  </Box>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Name and ID */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {firstName} {lastName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {loginId}
              </Typography>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'divider' }} />
              <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                {(employee.role || '').replace('_', ' ')}
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

          {/* Contact Details */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {employee.email}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {employee.phone || 'N/A'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Joined: {joiningDate}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default EmployeeCard
