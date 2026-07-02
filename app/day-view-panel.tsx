// app/day-view-panel.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { X, CheckCircle2, Circle, Plus, Trash2, CalendarClock } from 'lucide-react'
import { useTasksContext } from './context/tasks-context'
import { useCategoriesContext } from './context/categories-context'
import { usePlannerContext } from './context/planner-context'

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
  const { getEventsForDate, addEvent, updateEvent, deleteEvent, getDayNote, setDayNote } =
    usePlannerContext()

  const [noteDraft, setNoteDraft] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [newTitle, setNewTitle] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)

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

  // Cierra al clicar fuera del panel, igual que TaskDetailPanel.
  useEffect(() => {
    if (!date) return
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [date, onClose])

  if (!date) return null

  const dayTasks = tasks.filter((t) => t.dueDate === date)
  const dayEvents = getEventsForDate(date)

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    addEvent(date, newTime, newTitle.trim())
    setNewTitle('')
  }

  return (
    <div
      ref={panelRef}
      className="fixed left-6 top-6 bottom-6 w-[420px] bg-card border border-border shadow-xl rounded-xl overflow-y-auto z-40"
    >
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

        {/* AGENDA — citas / reuniones, entidades propias, no tareas */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            Agenda
          </p>

          {dayEvents.length === 0 && (
            <p className="text-xs text-muted-foreground/60"></p>
          )}

          <ul className="space-y-1.5">
            {dayEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2 bg-accent/40"
              >
                <input
                  type="time"
                  value={event.time}
                  onChange={(e) => updateEvent(event.id, { time: e.target.value })}
                  className="w-[92px] text-xs bg-transparent outline-none text-foreground shrink-0"
                />
                <input
                  value={event.title}
                  onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                  className="flex-1 text-sm bg-transparent outline-none text-foreground"
                />
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Eliminar evento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddEvent} className="flex gap-2 pt-1">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-[92px] border border-border rounded-md px-2 py-1.5 text-xs bg-background text-foreground"
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder=""
              className="flex-1 border border-border rounded-md px-2 py-1.5 text-sm bg-background text-foreground"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground shrink-0"
              aria-label="Añadir evento"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
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