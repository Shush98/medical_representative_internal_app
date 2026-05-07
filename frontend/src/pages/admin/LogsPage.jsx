import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listLogs } from '../../api/logs'
import PageHeader from '../../components/shared/PageHeader'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { ScrollText, RefreshCw } from 'lucide-react'

export default function LogsPage() {
  const [filters, setFilters] = useState({ action: '', entity_type: '', limit: 100 })
  const [applied, setApplied] = useState({ limit: 100 })

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['logs', applied],
    queryFn: () => listLogs(applied),
  })

  const apply = () => setApplied({ ...filters, limit: 100 })

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="System activity trail for debugging and compliance"
        action={
          <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="label">Action Filter</label>
            <input className="input w-48" placeholder="e.g. login, approve" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
          </div>
          <div>
            <label className="label">Entity Type</label>
            <select className="input w-40" value={filters.entity_type} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}>
              <option value="">All</option>
              {['user', 'area', 'doctor', 'visit_report', 'expense_report', 'expense_limit'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button onClick={apply} className="btn-primary">Apply</button>
        </div>
      </div>

      {isLoading ? <Spinner className="py-20" /> : logs.length === 0 ? (
        <EmptyState message="No logs match the current filters" icon={ScrollText} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['#', 'Time', 'User', 'Action', 'Entity', 'ID', 'IP'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-400">{log.id}</td>
                  <td className="px-4 py-2.5 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{log.user_name || '—'}</td>
                  <td className="px-4 py-2.5 text-primary-700">{log.action}</td>
                  <td className="px-4 py-2.5 text-slate-500">{log.entity_type || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400">{log.entity_id || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-400">{log.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
