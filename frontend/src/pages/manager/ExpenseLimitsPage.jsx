import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listLimits, upsertLimit, deleteLimit } from '../../api/expenseLimits'
import { listReps } from '../../api/users'
import { listAreas } from '../../api/areas'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import { fmtMoney } from '../../utils/format'

export default function ExpenseLimitsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ area_id: '', representative_id: '', max_amount: '' })
  const [err, setErr] = useState('')

  const { data: limits = [], isLoading } = useQuery({ queryKey: ['expense-limits'], queryFn: listLimits })
  const { data: reps = [] } = useQuery({ queryKey: ['reps'], queryFn: listReps })
  const { data: areas = [] } = useQuery({ queryKey: ['areas'], queryFn: listAreas })

  const upsert = useMutation({
    mutationFn: upsertLimit,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expense-limits'] }); setModal(null) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to save'),
  })

  const remove = useMutation({
    mutationFn: deleteLimit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expense-limits'] }),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr('')
    upsert.mutate({ area_id: Number(form.area_id), representative_id: Number(form.representative_id), max_amount: parseFloat(form.max_amount) })
  }

  const openEdit = (limit) => {
    setForm({ area_id: String(limit.area_id), representative_id: String(limit.representative_id), max_amount: String(limit.max_amount) })
    setModal({ mode: 'edit', id: limit.id })
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader
        title="Expense Limits"
        description="Set maximum daily expense allowance per representative per area"
        action={
          <button onClick={() => { setForm({ area_id: '', representative_id: '', max_amount: '' }); setModal({ mode: 'add' }) }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Set Limit
          </button>
        }
      />

      {limits.length === 0 ? (
        <EmptyState message="No expense limits set. Click 'Set Limit' to add one." icon={DollarSign} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Representative', 'Area', 'Max Limit', 'Last Updated', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {limits.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.representative_name}</td>
                  <td className="px-4 py-3 text-slate-500">{l.area_name}</td>
                  <td className="px-4 py-3 font-semibold text-primary-800">{fmtMoney(l.max_amount)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(l.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(l)} className="text-slate-400 hover:text-primary-800 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove.mutate(l.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit Expense Limit' : 'Set Expense Limit'} size="sm">
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Representative *</label>
            <select className="input" required value={form.representative_id} onChange={(e) => setForm({ ...form, representative_id: e.target.value })}>
              <option value="">Select representative</option>
              {reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Area *</label>
            <select className="input" required value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
              <option value="">Select area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max Daily Amount (₹) *</label>
            <input type="number" min="0" step="0.01" className="input" required value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} placeholder="e.g. 2500" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={upsert.isPending} className="btn-primary flex-1">{upsert.isPending ? 'Saving…' : 'Save Limit'}</button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
