import { capitalize } from '../../utils/format'

export default function StatusBadge({ status }) {
  const classes = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    draft: 'badge-draft',
    submitted: 'badge-submitted',
  }
  return <span className={classes[status] || 'badge-draft'}>{capitalize(status)}</span>
}
