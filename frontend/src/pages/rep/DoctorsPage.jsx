import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listDoctors, addDoctor } from '../../api/doctors'
import { listAreas } from '../../api/areas'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { Plus, Stethoscope } from 'lucide-react'
import { fmtDate } from '../../utils/format'

export default function DoctorsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', speciality: '', phone: '', address: '', area_id: '' })
  const [err, setErr] = useState('')

  const { data: doctors = [], isLoading } = useQuery({ queryKey: ['my-doctors'], queryFn: () => listDoctors() })
  const { data: areas = [] } = useQuery({ queryKey: ['areas'], queryFn: listAreas })

  const myAreas = user?.areas ? areas.filter((a) => user.areas.map((ua) => ua.id).includes(a.id)) : []

  const add = useMutation({
    mutationFn: addDoctor,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-doctors'] }); setOpen(false); setForm({ name: '', speciality: '', phone: '', address: '', area_id: '' }) },
    onError: (e) => setErr(e.response?.data?.detail || 'Failed to add doctor'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr('')
    add.mutate({ ...form, area_id: Number(form.area_id) })
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader
        title="My Doctors"
        description="Doctors you have added, pending or approved by your manager"
        action={
          <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Doctor
          </button>
        }
      />

      {doctors.length === 0 ? (
        <EmptyState message="No doctors added yet. Click 'Add Doctor' to get started." icon={Stethoscope} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Name', 'Speciality', 'Area', 'Phone', 'Status', 'Added'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {doctors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-500">{d.speciality || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{d.area_name}</td>
                  <td className="px-4 py-3 text-slate-500">{d.phone || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Doctor">
        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Doctor Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Arjun Mehta" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Speciality</label>
              <input className="input" value={form.speciality} onChange={(e) => setForm({ ...form, speciality: e.target.value })} placeholder="Cardiologist" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="label">Area *</label>
            <select className="input" required value={form.area_id} onChange={(e) => setForm({ ...form, area_id: e.target.value })}>
              <option value="">Select area</option>
              {myAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Clinic / Hospital address" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={add.isPending} className="btn-primary flex-1">{add.isPending ? 'Submitting…' : 'Submit for Approval'}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
