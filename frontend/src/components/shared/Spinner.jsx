import { cn } from '../../utils/cn'

export default function Spinner({ className }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-800 rounded-full animate-spin" />
    </div>
  )
}
