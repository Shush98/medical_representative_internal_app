import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { listVisitReports } from '../../api/visitReports'
import { listExpenseReports } from '../../api/expenseReports'
import { listDoctors } from '../../api/doctors'
import { FileText, Receipt, Stethoscope, Clock } from 'lucide-react'
import Spinner from '../../components/shared/Spinner'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function RepDashboard() {
  const { user } = useAuthStore()
  const { data: visits = [], isLoading: vl } = useQuery({ queryKey: ['visits'], queryFn: () => listVisitReports() })
  const { data: expenses = [], isLoading: el } = useQuery({ queryKey: ['expenses'], queryFn: () => listExpenseReports() })
  const { data: doctors = [], isLoading: dl } = useQuery({ queryKey: ['my-doctors'], queryFn: () => listDoctors() })

  if (vl || el || dl) return <Spinner className="py-20" />

  const pending = visits.filter((r) => r.status === 'draft').length
  const approved = visits.filter((r) => r.status === 'approved').length
  const expPending = expenses.filter((r) => r.status === 'draft').length
  const approvedDoctors = doctors.filter((d) => d.status === 'approved').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's a summary of your activity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Stethoscope} label="Approved Doctors" value={approvedDoctors} color="bg-primary-800" />
        <StatCard icon={FileText} label="Draft Visit Reports" value={pending} color="bg-amber-500" />
        <StatCard icon={FileText} label="Approved Visits" value={approved} color="bg-emerald-500" />
        <StatCard icon={Receipt} label="Pending Expenses" value={expPending} color="bg-violet-500" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Clock size={15} className="text-slate-400" /> Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {visits.slice(0, 5).map((r) => (
            <div key={r.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Visit Report — {r.area_name}</p>
                <p className="text-xs text-slate-400">{r.report_date}</p>
              </div>
              <span className={`badge-${r.status}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
            </div>
          ))}
          {visits.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No reports yet. Start by filing your first visit report.</p>
          )}
        </div>
      </div>
    </div>
  )
}
