'use client'

import { Check, Circle } from 'lucide-react'
import {
  AreaLabel,
  PriorityBadge,
  StatusBadge,
  TaskProgressBar,
} from '@/components/tasks/task-badges'
import { useTasks } from '@/components/tasks/tasks-provider'
import { formatDue } from '@/lib/date-utils'
import type { Task } from '@/lib/tasks-data'
import { cn } from '@/lib/utils'

const dueToneClasses: Record<string, string> = {
  overdue: 'text-red-600 dark:text-red-500',
  today: 'text-amber-600 dark:text-amber-500',
  soon: 'text-foreground',
  normal: 'text-muted-foreground',
  none: 'text-muted-foreground/60',
}

export function TaskRow({
  task,
  onOpen,
}: {
  task: Task
  onOpen: (id: string) => void
}) {
  const { toggleTaskDone } = useTasks()
  const done = task.status === 'done'
  const due = formatDue(task.dueDate)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(task.id)
        }
      }}
      className="group grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 md:grid-cols-[auto_minmax(0,2.4fr)_minmax(0,1.3fr)_auto_auto_auto_auto] md:gap-4"
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleTaskDone(task.id)
        }}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-muted-foreground/30 text-transparent hover:border-primary hover:text-primary/40',
        )}
      >
        {done ? (
          <Check className="size-3" aria-hidden="true" />
        ) : (
          <Circle className="size-3" aria-hidden="true" />
        )}
      </button>

      {/* Title + tags */}
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-sm font-medium',
            done ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 md:hidden">
          <AreaLabelInline task={task} />
        </div>
      </div>

      {/* Area / Project (desktop) */}
      <div className="hidden min-w-0 md:block">
        <AreaLabel areaId={task.areaId} projectId={task.projectId} />
      </div>

      {/* Status (desktop) */}
      <div className="hidden w-28 md:block">
        <StatusBadge status={task.status} />
      </div>

      {/* Priority (desktop) */}
      <div className="hidden w-24 md:block">
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Due date (desktop) */}
      <div className="hidden w-24 md:block">
        <span className={cn('text-xs font-medium', dueToneClasses[due.tone])}>
          {due.label}
        </span>
      </div>

      {/* Progress (desktop) */}
      <div className="hidden w-28 md:block">
        <TaskProgressBar task={task} />
      </div>
    </div>
  )
}

function AreaLabelInline({ task }: { task: Task }) {
  const due = formatDue(task.dueDate)
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <StatusBadge status={task.status} />
      <span aria-hidden="true">·</span>
      <span className={dueToneClasses[due.tone]}>{due.label}</span>
    </div>
  )
}
