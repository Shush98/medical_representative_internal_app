import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, createUser, updateUser, deactivateUser } from '../../api/users'
import { listAreas } from '../../api/areas'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react'
import { fmtDate } from '../../utils/format'

const ROLES = [
  { id: 1, name: 'representative' },
  { id: 2, name: 'manager' },
  { id: 3, name: 'administrator' },
]

const blankForm = { email: '', password: '', full_name: '', phone: '', role_id: '', area_ids: [] }

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [err, setErr] = useState('')

  const { data: users = [], isLoading } = useQuery({ queryKey: ['all-users'], queryFn: listUsers })
  const { data: areas = [] } = useQuery({ queryKey: ['areas'], queryFn: listAreas })

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-users'] }); setModal(null) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to create user'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['all-users'] }); setModal(null) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to update user'),
  })

  const deactivate = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-users'] }),
  })

  const reactivate = useMutation({
    mutationFn: (id) => updateUser(id, { is_active: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-users'] }),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr('')
    if (modal.mode === 'add') {
      create.mutate({ ...form, role_id: Number(form.role_id) })
    } else {
      const { email, password, ...rest } = form
      update.mutate({ id: modal.user.id, data: { ...rest, role_id: Number(rest.role_id) } })
    }
  }

  const openEdit = (user) => {
    setForm({ email: user.email, password: '', full_name: user.full_name, phone: user.phone || '', role_id: String(user.role === 'representative' ? 1 : user.role === 'manager' ? 2 : 3), area_ids: user.areas.map((a) => a.id) })
    setModal({ mode: 'edit', user })
    setErr('')
  }

  const toggleArea = (id) => {
    setForm((f) => ({ ...f, area_ids: f.area_ids.includes(id) ? f.area_ids.filter((a) => a !== id) : [...f.area_ids, id] }))
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and area assignments"
        action={
          <button onClick={() => { setForm(blankForm); setModal({ mode: 'add' }); setErr('') }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add User
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Name', 'Email', 'Role', 'Areas', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{u.role}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{u.areas.map((a) => a.name).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-slate-400 hover:text-primary-800"><Pencil size={15} /></button>
                    {u.is_active
                      ? <button onClick={() => deactivate.mutate(u.id)} className="text-slate-400 hover:text-red-600"><UserX size={15} /></button>
                      : <button onClick={() => reactivate.mutate(u.id)} className="text-slate-400 hover:text-emerald-600"><UserCheck size={15} /></button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'add' ? 'Add New User' : 'Edit User'}>
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Rahul Sharma" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>
          {modal?.mode === 'add' && (
            <>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@orexis.com" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" />
              </div>
            </>
          )}
          <div>
            <label className="label">Role *</label>
            <select className="input" required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              <option value="">Select role</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign Areas</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {areas.map((a) => (
                <button key={a.id} type="button" onClick={() => toggleArea(a.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.area_ids.includes(a.id) ? 'border-primary-800 bg-primary-50 text-primary-800' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >{a.name}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary flex-1">
              {create.isPending || update.isPending ? 'Saving…' : modal?.mode === 'add' ? 'Create User' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
