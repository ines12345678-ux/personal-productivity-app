// app/day-view-panel.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useTasksContext } from './context/tasks-context'
import { useCategoriesContext } from './context/categories-context'
import { usePlannerContext } from './context/planner-context'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 → 22:00

function formatDateLabel(dateISO: string) {
  return new Date(dateISO + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function DayViewPanel({
  date,
  onClose,
}: {
  date: string | null
  onClose: () => void
}) {
  const { tasks, setSelectedTaskId, updateTask } = useTasksContext()
  const { getAreaName, getProjectName } = useCategoriesContext()
  const { getTimeBlocksForDate, setHourText, getDayNote, setDayNote } = usePlannerContext()

  const [noteDraft, setNoteDraft] = useState('')

  // Al cambiar de día (sin cerrar el panel), recarga la nota libre de ese día
  useEffect(() => {
    if (date) setNoteDraft(getDayNote(date))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!date) return null

  const dayTasks = tasks.filter((t) => t.dueDate === date)
  const blocks = getTimeBlocksForDate(date)
  const blockByHour = new Map(blocks.map((b) => [b.hour, b.text]))

  return (
    <div className="fixed left-6 top-6 bottom-6 w-[420px] bg-card border-r-4 border-primary shadow-xl rounded-xl overflow-y-auto z-40">
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Día</p>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {formatDateLabel(date)}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {dayTasks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Tareas de hoy</p>
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2.5 hover:bg-muted/50"
              >
                <button
                  onClick={() =>
                    updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })
                  }
                  className="text-muted-foreground hover:text-primary shrink-0"
                  aria-label="Marcar completada"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-chart-3" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <button onClick={() => setSelectedTaskId(task.id)} className="flex-1 text-left">
                  <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Agenda</p>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {HOURS.map((hour) => (
              <div key={hour} className="flex items-stretch">
                <span className="w-14 shrink-0 text-xs text-muted-foreground px-2 py-2 border-r border-border">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <input
                  key={`${date}-${hour}`}
                  defaultValue={blockByHour.get(hour) ?? ''}
                  onBlur={(e) => setHourText(date, hour, e.target.value)}
                  placeholder=""
                  className="flex-1 px-2 py-2 text-sm bg-transparent outline-none text-foreground focus:bg-muted/30"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Notas del día</p>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => setDayNote(date, noteDraft)}
            placeholder="Escribe cualquier cosa sobre este día..."
            rows={4}
            className="w-full border border-border rounded-lg p-2.5 text-sm bg-background text-foreground resize-none outline-none"
          />
        </div>
      </div>
    </div>
  )
}