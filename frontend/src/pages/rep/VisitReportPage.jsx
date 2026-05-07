import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createVisitReport, updateVisitReport, submitVisitReport } from '../../api/visitReports'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/shared/PageHeader'
import Spinner from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'
import { format } from 'date-fns'
import { CheckCircle, XCircle, ChevronDown } from 'lucide-react'

export default function VisitReportPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [areaId, setAreaId] = useState('')
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [report, setReport] = useState(null)
  const [items, setItems] = useState([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const areas = user.areas || []

  const fetchReport = async () => {
    if (!areaId || !reportDate) return
    setLoadingReport(true)
    try {
      const r = await createVisitReport({ area_id: Number(areaId), report_date: reportDate })
      setReport(r)
      setItems(r.items.map((i) => ({ ...i })))
    } finally {
      setLoadingReport(false)
    }
  }

  const updateItem = (doctorId, field, value) => {
    setItems((prev) => prev.map((i) => i.doctor_id === doctorId ? { ...i, [field]: value } : i))
  }

  const saveMutation = useMutation({
    mutationFn: () => updateVisitReport(report.id, { items: items.map((i) => ({ doctor_id: i.doctor_id, visited: i.visited, note: i.note || null })) }),
    onSuccess: (r) => { setReport(r); setItems(r.items.map((i) => ({ ...i }))) },
    onError: (e) => setSubmitErr(e.response?.data?.detail || 'Failed to save draft'),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitVisitReport(report.id),
    onSuccess: (r) => { setReport(r); setItems(r.items.map((i) => ({ ...i }))); setSubmitErr('') },
    onError: (e) => setSubmitErr(e.response?.data?.detail || 'Submission failed'),
  })

  const handleSubmit = async () => {
    setSubmitErr('')
    try {
      await saveMutation.mutateAsync()
      submitMutation.mutate()
    } catch {
      // saveMutation.onError already sets submitErr
    }
  }

  const isDraft = report?.status === 'draft'

  return (
    <div>
      <PageHeader title="Daily Visit Report" description="Select area and date to open or create a report" />

      <div className="card p-5 mb-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Area</label>
            <select className="input" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Select area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={reportDate} onChange={(e) => setReportDate(e.target.value)} max={format(new Date(), 'yyyy-MM-dd')} />
          </div>
          <button onClick={fetchReport} disabled={!areaId || !reportDate || loadingReport} className="btn-primary">
            {loadingReport ? 'Loading…' : 'Open Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">Report — {report.area_name} / {report.report_date}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{items.length} doctors in this area</p>
            </div>
            <StatusBadge status={report.status} />
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 text-center">No approved doctors in this area yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {items.map((item) => (
                <div key={item.doctor_id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{item.doctor.name}</p>
                      {item.doctor.speciality && <p className="text-xs text-slate-400">{item.doctor.speciality}</p>}
                    </div>
                    {isDraft && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateItem(item.doctor_id, 'visited', true)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${item.visited ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        >
                          <CheckCircle size={14} /> Visited
                        </button>
                        <button
                          onClick={() => updateItem(item.doctor_id, 'visited', false)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!item.visited ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                        >
                          <XCircle size={14} /> Not Visited
                        </button>
                      </div>
                    )}
                    {!isDraft && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.visited ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.visited ? 'Visited' : 'Not Visited'}
                      </span>
                    )}
                  </div>
                  {(!item.visited || item.note) && (
                    <div className="mt-2">
                      {isDraft ? (
                        <textarea
                          className="input resize-none text-xs"
                          rows={2}
                          placeholder={!item.visited ? 'Reason for not visiting (required before submit)' : 'Optional note'}
                          value={item.note || ''}
                          onChange={(e) => updateItem(item.doctor_id, 'note', e.target.value)}
                        />
                      ) : (
                        item.note && <p className="text-xs text-slate-500 italic mt-1">Note: {item.note}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isDraft && items.length > 0 && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
              {submitErr && <p className="text-sm text-red-600 flex-1">{submitErr}</p>}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-secondary text-sm">
                  {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={handleSubmit} disabled={saveMutation.isPending || submitMutation.isPending} className="btn-primary text-sm">
                  {saveMutation.isPending || submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          )}

          {report.manager_note && (
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700"><span className="font-medium">Manager note:</span> {report.manager_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
