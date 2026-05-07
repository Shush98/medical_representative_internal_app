import { useState } from 'react'
import { downloadReport } from '../../api/reports'
import PageHeader from '../../components/shared/PageHeader'
import { format, subMonths } from 'date-fns'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

export default function DownloadPage() {
  const [type, setType] = useState('visit')
  const [fmt, setFmt] = useState('xlsx')
  const [from, setFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleDownload = async () => {
    setErr('')
    setLoading(true)
    try {
      const blob = await downloadReport(type, fmt, from, to)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_report_${from}_${to}.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr(e.response?.data?.detail || 'Download failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Download Reports" description="Export your visit or expense reports as Excel or PDF" />

      <div className="card p-6 max-w-lg">
        <div className="space-y-5">
          <div>
            <label className="label">Report Type</label>
            <div className="flex gap-3">
              {[['visit', 'Doctor Visit Report'], ['expense', 'Travel Expense Report']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setType(val)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${type === val ? 'border-primary-800 bg-primary-50 text-primary-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFmt('xlsx')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${fmt === 'xlsx' ? 'border-primary-800 bg-primary-50 text-primary-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <FileSpreadsheet size={16} /> Excel (.xlsx)
              </button>
              <button
                onClick={() => setFmt('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${fmt === 'pdf' ? 'border-primary-800 bg-primary-50 text-primary-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From Date</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
            </div>
            <div>
              <label className="label">To Date</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={format(new Date(), 'yyyy-MM-dd')} />
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button onClick={handleDownload} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <Download size={16} />
            {loading ? 'Generating…' : `Download ${type === 'visit' ? 'Visit' : 'Expense'} Report`}
          </button>
        </div>
      </div>
    </div>
  )
}
