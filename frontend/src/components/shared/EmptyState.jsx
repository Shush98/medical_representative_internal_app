import { FileX } from 'lucide-react'

export default function EmptyState({ message = 'No records found', icon: Icon = FileX }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Icon size={40} strokeWidth={1.5} />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  )
}
