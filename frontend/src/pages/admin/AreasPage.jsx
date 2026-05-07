import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listAreas, createArea, updateArea, deleteArea } from '../../api/areas'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { Plus, Pencil, Trash2, Map } from 'lucide-react'
import { fmtDate } from '../../utils/format'

export default function AreasPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: areas = [], isLoading } = useQuery({ queryKey: ['areas'], queryFn: listAreas })

  const create = useMutation({
    mutationFn: createArea,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['areas'] }); setModal(null) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to create area'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateArea(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['areas'] }); setModal(null) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to update area'),
  })

  const del = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['areas'] }); setConfirmDelete(null) },
    onError: (e) => alert(e.response?.data?.detail || 'Cannot delete area'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr('')
    if (modal.mode === 'add') create.mutate(form)
    else update.mutate({ id: modal.area.id, data: form })
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader
        title="Area Management"
        description="Create and manage geographic areas for field representatives"
        action={
          <button onClick={() => { setForm({ name: '', description: '' }); setModal({ mode: 'add' }); setErr('') }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Area
          </button>
        }
      />

      {areas.length === 0 ? (
        <EmptyState message="No areas defined. Add the first area." icon={Map} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Area Name', 'Description', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {areas.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-3 text-slate-500">{a.description || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setForm({ name: a.name, description: a.description || '' }); setModal({ mode: 'edit', area: a }); setErr('') }} className="text-slate-400 hover:text-primary-800"><Pencil size={15} /></button>
                      <button onClick={() => setConfirmDelete(a)} className="text-slate-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Add Area' : 'Edit Area'} size="sm">
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Area Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Mumbai Zone" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary flex-1">
              {create.isPending || update.isPending ? 'Saving…' : modal?.mode === 'add' ? 'Create Area' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Area" size="sm">
        <p className="text-sm text-slate-700 mb-4">
          Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This cannot be undone and may affect assigned users and doctors.
        </p>
        <div className="flex gap-2">
          <button onClick={() => del.mutate(confirmDelete.id)} disabled={del.isPending} className="btn-danger flex-1">{del.isPending ? 'Deleting…' : 'Delete Area'}</button>
          <button onClick={() => setConfirmDelete(null)} className="btn-secondary">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
