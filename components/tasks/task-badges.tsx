import {
  type Task,
  type TaskPriority,
  type TaskStatus,
  getArea,
  getProject,
  priorityConfig,
  statusConfig,
  taskProgress,
} from '@/lib/tasks-data'
import { cn } from '@/lib/utils'

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}

export function PriorityBadge({
  priority,
  showNone = false,
  className,
}: {
  priority: TaskPriority
  showNone?: boolean
  className?: string
}) {
  const config = priorityConfig[priority]
  if (priority === 'none' && !showNone) {
    return <span className="text-xs text-muted-foreground/60">—</span>
  }
  const Icon = config.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  )
}

export function AreaLabel({
  areaId,
  projectId,
}: {
  areaId: string
  projectId: string | null
}) {
  const area = getArea(areaId)
  const project = getProject(projectId)
  if (!area) return null
  return (
    <div className="flex min-w-0 flex-col leading-tight">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span aria-hidden="true">{area.emoji}</span>
        <span className="truncate">{area.name}</span>
      </span>
      {project ? (
        <span className="truncate text-xs text-muted-foreground">
          {project.name}
        </span>
      ) : null}
    </div>
  )
}

export function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      #{label}
    </span>
  )
}

export function TaskProgressBar({
  task,
  className,
  showLabel = true,
}: {
  task: Task
  className?: string
  showLabel?: boolean
}) {
  const progress = taskProgress(task)
  const total = task.subtasks.length
  const completed = task.subtasks.filter((s) => s.done).length
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            progress === 100 ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {total > 0 ? `${completed}/${total}` : `${progress}%`}
        </span>
      ) : null}
    </div>
  )
}
