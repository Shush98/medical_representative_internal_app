import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { _setToken, _getToken } from './api/client'
import axios from 'axios'

import AppShell from './components/layout/AppShell'
import RoleGuard from './components/layout/RoleGuard'
import Spinner from './components/shared/Spinner'

import LoginPage from './pages/auth/LoginPage'
import RepDashboard from './pages/rep/Dashboard'
import DoctorsPage from './pages/rep/DoctorsPage'
import VisitReportPage from './pages/rep/VisitReportPage'
import ExpensePage from './pages/rep/ExpensePage'
import DownloadPage from './pages/rep/DownloadPage'
import ManagerDashboard from './pages/manager/Dashboard'
import DoctorApprovalsPage from './pages/manager/DoctorApprovalsPage'
import VisitApprovalsPage from './pages/manager/VisitApprovalsPage'
import ExpenseApprovalsPage from './pages/manager/ExpenseApprovalsPage'
import ExpenseLimitsPage from './pages/manager/ExpenseLimitsPage'
import AdminDashboard from './pages/admin/Dashboard'
import UsersPage from './pages/admin/UsersPage'
import AreasPage from './pages/admin/AreasPage'
import LogsPage from './pages/admin/LogsPage'

function RoleRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'representative') return <Navigate to="/rep" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/admin" replace />
}

export default function App() {
  const { setAuth } = useAuthStore()
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        _setToken(data.access_token)
        return axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
          withCredentials: true,
        })
      })
      .then(({ data }) => setAuth(data, _getToken()))
      .catch(() => {})
      .finally(() => setBooting(false))
  }, [])

  if (booting) return <Spinner className="h-screen" />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center h-screen text-slate-500 text-sm">
            Access denied — you do not have permission to view this page.
          </div>
        } />

        <Route element={<AppShell />}>
          <Route index element={<RoleRedirect />} />

          <Route path="rep" element={<RoleGuard roles={['representative']}><RepDashboard /></RoleGuard>} />
          <Route path="rep/doctors" element={<RoleGuard roles={['representative']}><DoctorsPage /></RoleGuard>} />
          <Route path="rep/visit-report" element={<RoleGuard roles={['representative']}><VisitReportPage /></RoleGuard>} />
          <Route path="rep/expenses" element={<RoleGuard roles={['representative']}><ExpensePage /></RoleGuard>} />
          <Route path="rep/download" element={<RoleGuard roles={['representative']}><DownloadPage /></RoleGuard>} />

          <Route path="manager" element={<RoleGuard roles={['manager', 'administrator']}><ManagerDashboard /></RoleGuard>} />
          <Route path="manager/approvals/doctors" element={<RoleGuard roles={['manager', 'administrator']}><DoctorApprovalsPage /></RoleGuard>} />
          <Route path="manager/approvals/visits" element={<RoleGuard roles={['manager', 'administrator']}><VisitApprovalsPage /></RoleGuard>} />
          <Route path="manager/approvals/expenses" element={<RoleGuard roles={['manager', 'administrator']}><ExpenseApprovalsPage /></RoleGuard>} />
          <Route path="manager/expense-limits" element={<RoleGuard roles={['manager', 'administrator']}><ExpenseLimitsPage /></RoleGuard>} />

          <Route path="admin" element={<RoleGuard roles={['administrator']}><AdminDashboard /></RoleGuard>} />
          <Route path="admin/users" element={<RoleGuard roles={['administrator']}><UsersPage /></RoleGuard>} />
          <Route path="admin/areas" element={<RoleGuard roles={['administrator']}><AreasPage /></RoleGuard>} />
          <Route path="admin/logs" element={<RoleGuard roles={['administrator']}><LogsPage /></RoleGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
