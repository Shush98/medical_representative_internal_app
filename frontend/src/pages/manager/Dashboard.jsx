import { useQuery } from '@tanstack/react-query'
import { listDoctors } from '../../api/doctors'
import { listVisitReports } from '../../api/visitReports'
import { listExpenseReports } from '../../api/expenseReports'
import { Stethoscope, FileText, Receipt, TrendingUp } from 'lucide-react'
import Spinner from '../../components/shared/Spinner'
import { useNavigate } from 'react-router-dom'

function PendingCard({ icon: Icon, label, count, to, color }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{count}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </button>
  )
}

export default function ManagerDashboard() {
  const { data: doctors = [], isLoading: dl } = useQuery({ queryKey: ['pending-doctors'], queryFn: () => listDoctors({ status: 'pending' }) })
  const { data: visits = [], isLoading: vl } = useQuery({ queryKey: ['pending-visits'], queryFn: () => listVisitReports({ status: 'submitted' }) })
  const { data: expenses = [], isLoading: el } = useQuery({ queryKey: ['pending-expenses'], queryFn: () => listExpenseReports({ status: 'submitted' }) })

  if (dl || vl || el) return <Spinner className="py-20" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Manager Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pending approvals requiring your attention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <PendingCard icon={Stethoscope} label="Doctor Requests" count={doctors.length} to="/manager/approvals/doctors" color="bg-violet-500" />
        <PendingCard icon={FileText} label="Visit Reports" count={visits.length} to="/manager/approvals/visits" color="bg-primary-800" />
        <PendingCard icon={Receipt} label="Expense Reports" count={expenses.length} to="/manager/approvals/expenses" color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Recent Visit Submissions</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {visits.slice(0, 5).map((r) => (
              <div key={r.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.representative_name}</p>
                  <p className="text-xs text-slate-400">{r.area_name} · {r.report_date}</p>
                </div>
                <span className="badge-submitted">Submitted</span>
              </div>
            ))}
            {visits.length === 0 && <p className="px-5 py-6 text-sm text-slate-400 text-center">No pending visit reports</p>}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Recent Expense Submissions</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {expenses.slice(0, 5).map((r) => (
              <div key={r.id} className="px-5 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.representative_name}</p>
                  <p className="text-xs text-slate-400">{r.area_name} · {r.report_date}</p>
                </div>
                <span className="text-sm font-medium text-slate-700">₹{r.total_amount}</span>
              </div>
            ))}
            {expenses.length === 0 && <p className="px-5 py-6 text-sm text-slate-400 text-center">No pending expense reports</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
