'use client'

import {
  Activity,
  Check,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { TaskProgressBar } from '@/components/tasks/task-badges'
import { useTasks } from '@/components/tasks/tasks-provider'
import {
  areas,
  priorityConfig,
  priorityOrder,
  projectsForArea,
  statusConfig,
  statusOrder,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/tasks-data'
import { cn } from '@/lib/utils'

export function TaskDetailPanel({
  taskId,
  onClose,
}: {
  taskId: string | null
  onClose: () => void
}) {
  const { getTask } = useTasks()
  const open = taskId !== null
  const task = taskId ? getTask(taskId) : undefined

  // Keep the last task around while the panel animates closed
  const [rendered, setRendered] = useState<Task | undefined>(task)
  useEffect(() => {
    if (task) setRendered(task)
  }, [task])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const current = task ?? rendered

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className={cn(
          'absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {current ? (
          <PanelContent task={current} onClose={onClose} />
        ) : (
          <div className="flex h-16 items-center px-5" />
        )}
      </aside>
    </div>
  )
}

function PanelContent({ task, onClose }: { task: Task; onClose: () => void }) {
  const {
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks()
  const availableProjects = projectsForArea(task.areaId)
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Task details
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              deleteTask(task.id)
              onClose()
            }}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete task"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Title */}
        <textarea
          value={task.title}
          onChange={(e) => updateTask(task.id, { title: e.target.value })}
          rows={1}
          className="w-full resize-none bg-transparent text-lg font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Task title"
        />

        {/* Description */}
        <textarea
          value={task.description}
          onChange={(e) =>
            updateTask(task.id, { description: e.target.value })
          }
          rows={3}
          className="mt-2 w-full resize-none rounded-xl bg-transparent text-sm leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          placeholder="Add a description…"
        />

        {/* Properties */}
        <div className="mt-4 flex flex-col divide-y divide-border rounded-2xl border border-border">
          <PropertyRow label="Status">
            <SelectField
              value={task.status}
              onChange={(v) =>
                updateTask(task.id, { status: v as TaskStatus })
              }
              options={statusOrder.map((s) => ({
                value: s,
                label: statusConfig[s].label,
              }))}
            />
          </PropertyRow>

          <PropertyRow label="Priority">
            <SelectField
              value={task.priority}
              onChange={(v) =>
                updateTask(task.id, { priority: v as TaskPriority })
              }
              options={priorityOrder.map((p) => ({
                value: p,
                label: priorityConfig[p].label,
              }))}
            />
          </PropertyRow>

          <PropertyRow label="Due date">
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) =>
                updateTask(task.id, { dueDate: e.target.value || null })
              }
              className="w-full rounded-lg bg-transparent px-2 py-1.5 text-right text-sm text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </PropertyRow>

          <PropertyRow label="Area">
            <SelectField
              value={task.areaId}
              onChange={(v) =>
                updateTask(task.id, { areaId: v, projectId: null })
              }
              options={areas.map((a) => ({
                value: a.id,
                label: `${a.emoji}  ${a.name}`,
              }))}
            />
          </PropertyRow>

          <PropertyRow label="Project">
            <SelectField
              value={task.projectId ?? ''}
              onChange={(v) =>
                updateTask(task.id, { projectId: v || null })
              }
              options={[
                { value: '', label: 'No project' },
                ...availableProjects.map((p) => ({
                  value: p.id,
                  label: p.name,
                })),
              ]}
            />
          </PropertyRow>
        </div>

        {/* Tags */}
        <section className="mt-6">
          <SectionTitle icon={<Tag className="size-4" />}>Tags</SectionTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() =>
                    updateTask(task.id, {
                      tags: task.tags.filter((t) => t !== tag),
                    })
                  }
                  className="text-muted-foreground/60 transition-colors hover:text-destructive"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  const value = newTag.trim().replace(/^#/, '')
                  if (value && !task.tags.includes(value)) {
                    updateTask(task.id, { tags: [...task.tags, value] })
                  }
                  setNewTag('')
                }
              }}
              placeholder="Add tag…"
              className="min-w-24 flex-1 bg-transparent px-1 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </section>

        {/* Checklist */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Check className="size-4" />}>
              Checklist
            </SectionTitle>
            {task.subtasks.length > 0 ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {task.subtasks.filter((s) => s.done).length}/
                {task.subtasks.length}
              </span>
            ) : null}
          </div>

          {task.subtasks.length > 0 ? (
            <TaskProgressBar
              task={task}
              showLabel={false}
              className="mt-2.5"
            />
          ) : null}

          <ul className="mt-2 flex flex-col">
            {task.subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="group flex items-center gap-2.5 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => toggleSubtask(task.id, subtask.id)}
                  aria-label={
                    subtask.done ? 'Mark incomplete' : 'Mark complete'
                  }
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                    subtask.done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-muted-foreground/40 hover:border-primary',
                  )}
                >
                  {subtask.done ? (
                    <Check className="size-2.5" aria-hidden="true" />
                  ) : null}
                </button>
                <span
                  className={cn(
                    'flex-1 text-sm',
                    subtask.done
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground',
                  )}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSubtask(task.id, subtask.id)}
                  className="text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60 hover:!text-destructive"
                  aria-label="Delete subtask"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-1 flex items-center gap-2.5">
            <Plus
              className="size-4 shrink-0 text-muted-foreground/50"
              aria-hidden="true"
            />
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  addSubtask(task.id, newSubtask)
                  setNewSubtask('')
                }
              }}
              placeholder="Add a subtask…"
              className="flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        </section>

        {/* Notes */}
        <section className="mt-6">
          <SectionTitle>Notes</SectionTitle>
          <textarea
            value={task.notes}
            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
            rows={3}
            placeholder="Jot down anything relevant…"
            className="mt-2 w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ring/40"
          />
        </section>

        {/* Activity (placeholder) */}
        <section className="mt-6 pb-4">
          <SectionTitle icon={<Activity className="size-4" />}>
            Activity
          </SectionTitle>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3">
            <span className="size-1.5 rounded-full bg-primary" />
            <p className="text-xs text-muted-foreground">
              Task created on {task.createdAt}. A full activity timeline will
              appear here.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

function PropertyRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5">
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  )
}

function SectionTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h3>
  )
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const ref = useRef<HTMLSelectElement>(null)
  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer rounded-lg bg-transparent px-2 py-1.5 text-right text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus:bg-muted"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
