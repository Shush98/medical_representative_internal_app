import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createExpenseReport, updateExpenseReport, submitExpenseReport } from '../../api/expenseReports'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/shared/PageHeader'
import StatusBadge from '../../components/shared/StatusBadge'
import Spinner from '../../components/shared/Spinner'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { fmtMoney } from '../../utils/format'

export default function ExpensePage() {
  const [areaId, setAreaId] = useState('')
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [report, setReport] = useState(null)
  const [items, setItems] = useState([{ description: '', amount: '' }])
  const [loading, setLoading] = useState(false)
  const [submitErr, setSubmitErr] = useState('')

  const { user } = useAuthStore()
  const areas = user?.areas || []

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const limit = report?.limit ? parseFloat(report.limit) : null
  const overLimit = limit !== null && total > limit

  const fetchReport = async () => {
    if (!areaId || !reportDate) return
    setLoading(true)
    try {
      const r = await createExpenseReport({ area_id: Number(areaId), report_date: reportDate })
      setReport(r)
      setItems(r.items.length ? r.items.map((i) => ({ description: i.description, amount: String(i.amount) })) : [{ description: '', amount: '' }])
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => setItems([...items, { description: '', amount: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (idx, field, val) => setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item))

  const saveMutation = useMutation({
    mutationFn: () => updateExpenseReport(report.id, { items: items.filter((i) => i.description && i.amount).map((i) => ({ description: i.description, amount: parseFloat(i.amount) })) }),
    onSuccess: (r) => setReport(r),
  })

  const submitMutation = useMutation({
    mutationFn: () => submitExpenseReport(report.id),
    onSuccess: (r) => { setReport(r); setSubmitErr('') },
    onError: (e) => setSubmitErr(e.response?.data?.detail || 'Submission failed'),
  })

  const handleSaveAndSubmit = async () => {
    const saved = await saveMutation.mutateAsync()
    submitMutation.mutate()
  }

  const isDraft = report?.status === 'draft'

  return (
    <div>
      <PageHeader title="Travel Expenses" description="File your daily travel and field expenses" />

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
          <button onClick={fetchReport} disabled={!areaId || !reportDate || loading} className="btn-primary">
            {loading ? 'Loading…' : 'Open Report'}
          </button>
        </div>
      </div>

      {report && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-800">Expenses — {report.area_name} / {report.report_date}</h2>
              {limit !== null && (
                <p className="text-xs text-slate-400 mt-0.5">Daily limit: {fmtMoney(limit)}</p>
              )}
            </div>
            <StatusBadge status={report.status} />
          </div>

          <div className="p-5 space-y-3">
            {overLimit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                <AlertTriangle size={16} />
                Total {fmtMoney(total)} exceeds the limit of {fmtMoney(limit)}. Please reduce your expenses.
              </div>
            )}

            {isDraft ? (
              <>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      placeholder="Description (e.g., Fuel, Lodging)"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    />
                    <input
                      className="input w-32"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₹ Amount"
                      value={item.amount}
                      onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                    />
                    <button onClick={() => removeItem(idx)} disabled={items.length === 1} className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-900">
                  <Plus size={15} /> Add item
                </button>
              </>
            ) : (
              <div className="space-y-2">
                {report.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700">{item.description}</span>
                    <span className="font-medium text-slate-900">{fmtMoney(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <span className="font-semibold text-slate-800">Total</span>
              <span className={`font-bold text-lg ${overLimit ? 'text-red-600' : 'text-slate-900'}`}>{fmtMoney(total)}</span>
            </div>
          </div>

          {isDraft && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-red-600">{submitErr}</p>
              <div className="flex gap-2">
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-secondary text-sm">
                  {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={handleSaveAndSubmit} disabled={overLimit || submitMutation.isPending} className="btn-primary text-sm">
                  {submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
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
