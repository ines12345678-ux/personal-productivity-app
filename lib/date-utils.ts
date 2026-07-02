export type DueMeta = {
  label: string
  tone: 'overdue' | 'today' | 'soon' | 'normal' | 'none'
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function formatDue(dueDate: string | null): DueMeta {
  if (!dueDate) return { label: 'No date', tone: 'none' }

  const due = startOfDay(new Date(`${dueDate}T00:00:00`))
  const today = startOfDay(new Date())
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays < 0) {
    const label =
      diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)}d overdue`
    return { label, tone: 'overdue' }
  }
  if (diffDays === 0) return { label: 'Today', tone: 'today' }
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (diffDays <= 6) {
    return {
      label: due.toLocaleDateString(undefined, { weekday: 'short' }),
      tone: 'soon',
    }
  }

  const sameYear = due.getFullYear() === today.getFullYear()
  return {
    label: due.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    }),
    tone: 'normal',
  }
}
