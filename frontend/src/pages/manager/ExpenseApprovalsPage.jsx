import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listExpenseReports, reviewExpenseReport } from '../../api/expenseReports'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Receipt } from 'lucide-react'
import { fmtMoney } from '../../utils/format'

function ReportRow({ r, onApprove, onReject, isPending }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-slate-900">{r.representative_name}</td>
        <td className="px-4 py-3 text-slate-500">{r.area_name}</td>
        <td className="px-4 py-3 text-slate-500">{r.report_date}</td>
        <td className="px-4 py-3 font-semibold text-slate-900">{fmtMoney(r.total_amount)}</td>
        <td className="px-4 py-3 text-slate-400 text-xs">{r.limit ? fmtMoney(r.limit) : '—'}</td>
        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
        <td className="px-4 py-3">
          {r.status === 'submitted' && (
            <div className="flex gap-2">
              <button onClick={() => onApprove(r)} disabled={isPending} aria-label="Approve" className="text-emerald-600 hover:text-emerald-800 disabled:opacity-40"><CheckCircle size={18} /></button>
              <button onClick={() => onReject(r)} disabled={isPending} aria-label="Reject" className="text-red-500 hover:text-red-700 disabled:opacity-40"><XCircle size={18} /></button>
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-slate-50 px-8 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 uppercase">
                  <th className="text-left py-1 pr-4">Description</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-1.5 pr-4 text-slate-700">{i.description}</td>
                    <td className="py-1.5 text-right font-medium text-slate-900">{fmtMoney(i.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td className="py-1.5 font-bold text-slate-800">Total</td>
                  <td className="py-1.5 text-right font-bold text-slate-900">{fmtMoney(r.total_amount)}</td>
                </tr>
              </tbody>
            </table>
            {r.manager_note && <p className="text-xs text-amber-700 mt-2 italic">Note: {r.manager_note}</p>}
          </td>
        </tr>
      )}
    </>
  )
}

export default function ExpenseApprovalsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['expense-approvals', statusFilter],
    queryFn: () => listExpenseReports({ status: statusFilter }),
  })

  const review = useMutation({
    mutationFn: ({ id, data }) => reviewExpenseReport(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expense-approvals'] }); setModal(null); setErr('') },
    onError: (e) => setErr(e.response?.data?.detail || 'Action failed'),
  })

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader title="Expense Report Approvals" description="Review and approve travel expense reports from representatives" />

      <div className="flex gap-2 mb-4">
        {['submitted', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >{s}</button>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState message={`No ${statusFilter} expense reports`} icon={Receipt} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-8" />
                {['Representative', 'Area', 'Date', 'Total', 'Limit', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((r) => (
                <ReportRow key={r.id} r={r}
                  onApprove={(r) => review.mutate({ id: r.id, data: { approved: true } })}
                  onReject={(r) => { setModal(r); setNote(''); setErr('') }}
                  isPending={review.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title="Reject Expense Report" size="sm">
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="label">Note for representative</label>
            <textarea className="input resize-none" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for rejection…" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => review.mutate({ id: modal.id, data: { approved: false, manager_note: note } })} disabled={review.isPending} className="btn-danger flex-1">Reject</button>
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
