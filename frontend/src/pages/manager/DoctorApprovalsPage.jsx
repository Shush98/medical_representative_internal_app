import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listDoctors, reviewDoctor } from '../../api/doctors'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import Spinner from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { CheckCircle, XCircle, Stethoscope } from 'lucide-react'
import { fmtDate } from '../../utils/format'

export default function DoctorApprovalsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [modal, setModal] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [err, setErr] = useState('')

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors-approval', statusFilter],
    queryFn: () => listDoctors({ status: statusFilter }),
  })

  const review = useMutation({
    mutationFn: ({ id, data }) => reviewDoctor(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors-approval'] }); setModal(null); setRejectNote(''); setErr('') },
    onError: (e) => setErr(e.response?.data?.detail || 'Action failed'),
  })

  const handleApprove = (doctor) => review.mutate({ id: doctor.id, data: { approved: true } })
  const handleReject = () => {
    if (!rejectNote.trim()) { setErr('Rejection note is required'); return }
    review.mutate({ id: modal.id, data: { approved: false, rejection_note: rejectNote } })
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <PageHeader title="Doctor Addition Requests" description="Approve or reject doctor requests from representatives" />

      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-primary-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {doctors.length === 0 ? (
        <EmptyState message={`No ${statusFilter} doctor requests`} icon={Stethoscope} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Doctor', 'Speciality', 'Area', 'Added By', 'Date', 'Status', 'Actions'].map((h) => (
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
                  <td className="px-4 py-3 text-slate-500">{d.added_by_name}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDate(d.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    {d.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(d)} className="text-emerald-600 hover:text-emerald-800 transition-colors" title="Approve">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => { setModal(d); setErr(''); setRejectNote('') }} className="text-red-500 hover:text-red-700 transition-colors" title="Reject">
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {d.status === 'rejected' && d.rejection_note && (
                      <span className="text-xs text-slate-400 italic" title={d.rejection_note}>Note available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={`Reject Doctor: ${modal?.name}`} size="sm">
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="label">Rejection Note *</label>
            <textarea className="input resize-none" rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Explain why this doctor is being rejected…" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={review.isPending} className="btn-danger flex-1">{review.isPending ? 'Rejecting…' : 'Reject Doctor'}</button>
            <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
