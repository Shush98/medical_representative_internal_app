import { useQuery } from '@tanstack/react-query'
import { listUsers } from '../../api/users'
import { listAreas } from '../../api/areas'
import { listDoctors } from '../../api/doctors'
import { listLogs } from '../../api/logs'
import { Users, Map, Stethoscope, ScrollText } from 'lucide-react'
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

export default function AdminDashboard() {
  const { data: users = [], isLoading: ul } = useQuery({ queryKey: ['all-users'], queryFn: listUsers })
  const { data: areas = [], isLoading: al } = useQuery({ queryKey: ['areas'], queryFn: listAreas })
  const { data: doctors = [], isLoading: dl } = useQuery({ queryKey: ['all-doctors'], queryFn: () => listDoctors() })
  const { data: logs = [], isLoading: ll } = useQuery({ queryKey: ['recent-logs'], queryFn: () => listLogs({ limit: 10 }) })

  if (ul || al || dl || ll) return <Spinner className="py-20" />

  const activeUsers = users.filter((u) => u.is_active).length
  const reps = users.filter((u) => u.role === 'representative').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Administrator Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">System overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Active Users" value={activeUsers} color="bg-primary-800" />
        <StatCard icon={Users} label="Representatives" value={reps} color="bg-violet-500" />
        <StatCard icon={Map} label="Areas" value={areas.length} color="bg-sky-500" />
        <StatCard icon={Stethoscope} label="Total Doctors" value={doctors.length} color="bg-emerald-500" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <ScrollText size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-800 text-sm">Recent System Activity</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{log.user_name || 'System'}</span>
                  {' '}<span className="text-slate-500">{log.action.replace(/_/g, ' ')}</span>
                  {log.entity_type && <span className="text-slate-400"> [{log.entity_type}#{log.entity_id}]</span>}
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {logs.length === 0 && <p className="px-5 py-8 text-sm text-slate-400 text-center">No activity yet</p>}
        </div>
      </div>
    </div>
  )
}
