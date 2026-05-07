import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Stethoscope, Receipt, Download,
  ClipboardCheck, DollarSign, Users, Map, ScrollText,
  LogOut, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { logout as apiLogout } from '../../api/auth'
import { cn } from '../../utils/cn'

const NAV = {
  representative: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/rep' },
    {
      label: 'Doctor Reporting', icon: Stethoscope,
      children: [
        { label: 'My Doctors', to: '/rep/doctors' },
        { label: 'Daily Visit Report', to: '/rep/visit-report' },
      ],
    },
    { label: 'Travel Expenses', icon: Receipt, to: '/rep/expenses' },
    { label: 'Download Reports', icon: Download, to: '/rep/download' },
  ],
  manager: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/manager' },
    {
      label: 'Approvals', icon: ClipboardCheck,
      children: [
        { label: 'Doctor Requests', to: '/manager/approvals/doctors' },
        { label: 'Visit Reports', to: '/manager/approvals/visits' },
        { label: 'Expense Reports', to: '/manager/approvals/expenses' },
      ],
    },
    { label: 'Expense Limits', icon: DollarSign, to: '/manager/expense-limits' },
  ],
  administrator: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
    {
      label: 'Approvals', icon: ClipboardCheck,
      children: [
        { label: 'Doctor Requests', to: '/manager/approvals/doctors' },
        { label: 'Visit Reports', to: '/manager/approvals/visits' },
        { label: 'Expense Reports', to: '/manager/approvals/expenses' },
      ],
    },
    { label: 'Expense Limits', icon: DollarSign, to: '/manager/expense-limits' },
    { label: 'User Management', icon: Users, to: '/admin/users' },
    { label: 'Area Management', icon: Map, to: '/admin/areas' },
    { label: 'Audit Logs', icon: ScrollText, to: '/admin/logs' },
  ],
}

function NavItem({ item }) {
  const [open, setOpen] = useState(false)
  const Icon = item.icon

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Icon size={18} className="flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-7 mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end
                className={({ isActive }) =>
                  cn('block px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-medium'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-800 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        )
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      {item.label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const nav = NAV[user?.role] || []

  const handleLogout = async () => {
    await apiLogout().catch(() => {})
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center">
            <span className="text-white text-xs font-bold">OR</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Orexis</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pharma CRM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => <NavItem key={item.label} item={item} />)}
      </nav>

      <div className="px-3 py-4 border-t border-slate-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
