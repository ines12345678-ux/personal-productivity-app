'use client'

import { TaskRow } from '@/components/tasks/task-row'
import type { Task } from '@/lib/tasks-data'

export function TaskList({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Column header (desktop) */}
      <div className="hidden grid-cols-[auto_minmax(0,2.4fr)_minmax(0,1.3fr)_auto_auto_auto_auto] items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
        <span className="w-5" aria-hidden="true" />
        <span>Task</span>
        <span>Area</span>
        <span className="w-28">Status</span>
        <span className="w-24">Priority</span>
        <span className="w-24">Due</span>
        <span className="w-28">Progress</span>
      </div>

      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow task={task} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  )
}
