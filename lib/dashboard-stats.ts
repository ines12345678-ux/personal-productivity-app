// lib/dashboard-stats.ts
'use client'
import { useTasksContext, Task } from '../app/context/tasks-context'

export function useDashboardStats() {
  const { tasks } = useTasksContext()

  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const pending = total - done

  const upcoming = tasks
    .filter((t) => t.dueDate && t.status !== 'done')
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 5)

  const byPriority = {
    low: tasks.filter((t) => t.priority === 'low').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    high: tasks.filter((t) => t.priority === 'high').length,
  }

  const byArea = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.area] = (acc[t.area] ?? 0) + 1
    return acc
  }, {})

  return { total, done, pending, upcoming, byPriority, byArea }
}
