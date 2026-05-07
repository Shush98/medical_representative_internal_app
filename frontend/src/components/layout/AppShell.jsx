import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
