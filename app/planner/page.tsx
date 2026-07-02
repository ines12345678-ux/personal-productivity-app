// app/planner/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useTasksContext, Task } from '../context/tasks-context'
import { useCategoriesContext } from '../context/categories-context'
import { usePlannerContext } from '../context/planner-context'
import { TaskDetailPanel } from '../task-detail-panel'
import { DayViewPanel } from '../day-view-panel'

const priorityDot: Record<Task['priority'], string> = {
  low: 'bg-muted-foreground/40',
  medium: 'bg-chart-4',
  high: 'bg-destructive',
}

function toISODate(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// Chip de tarea arrastrable dentro de una celda del mes
function DraggableTaskChip({
  task,
  onOpenTask,
}: {
  task: Task
  onOpenTask: (id: string) => void
}) {
  const { getAreaColorDot } = useCategoriesContext()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onOpenTask(task.id)
      }}
      className={`flex items-center gap-1.5 text-left text-[11px] bg-muted/60 hover:bg-muted rounded px-1.5 py-1 truncate cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-30' : ''}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAreaColorDot(task.areaId)}`} />
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
      <span className="truncate">{task.title}</span>
    </span>
  )
}

// Celda del día — zona droppable para las tareas
function DayCell({
  dateKey,
  day,
  isToday,
  dayTasks,
  dayEvents,
  onOpenDay,
  onOpenTask,
}: {
  dateKey: string
  day: number
  isToday: boolean
  dayTasks: Task[]
  dayEvents: { id: string; time: string; title: string }[]
  onOpenDay: (date: string) => void
  onOpenTask: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })

  return (
    <div
      ref={setNodeRef}
      onClick={() => onOpenDay(dateKey)}
      className={`min-h-[120px] border rounded-lg p-2 bg-card flex flex-col gap-1 text-left hover:border-primary/50 transition cursor-pointer
        ${isToday ? 'border-primary' : 'border-border'}
        ${isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
    >
      <span className={`text-xs ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
        {day}
      </span>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {dayEvents.map((event) => (
          <span
            key={event.id}
            onClick={(e) => {
              e.stopPropagation()
              onOpenDay(dateKey)
            }}
            className="flex items-center gap-1.5 text-left text-[11px] bg-accent/60 hover:bg-accent rounded px-1.5 py-1 truncate cursor-pointer"
          >
            <Clock3 className="w-2.5 h-2.5 shrink-0 text-accent-foreground" />
            <span className="truncate text-accent-foreground">{event.time} {event.title}</span>
          </span>
        ))}

        {dayTasks.map((task) => (
          <DraggableTaskChip key={task.id} task={task} onOpenTask={onOpenTask} />
        ))}
      </div>
    </div>
  )
}

export default function PlannerPage() {
  const { tasks, setSelectedTaskId, updateTask } = useTasksContext()
  const { events } = usePlannerContext()
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.dueDate) return acc
      acc[task.dueDate] = [...(acc[task.dueDate] ?? []), task]
      return acc
    }, {})
  }, [tasks])

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, typeof events>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event]
      return acc
    }, {})
  }, [events])

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const dragged = tasks.find((t) => t.id === active.id)
    if (!dragged) return

    const newDate = String(over.id)
    if (dragged.dueDate === newDate) return

    updateTask(dragged.id, { dueDate: newDate })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <CalendarDays className="w-6 h-6" />
            Planner
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-2 rounded-md border border-border hover:bg-muted/50"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-3 py-2 rounded-md border border-border hover:bg-muted/50 text-sm"
          >
            Hoy
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-2 rounded-md border border-border hover:bg-muted/50"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground px-1">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[120px]" />

            const dateKey = toISODate(year, month, day)
            const isToday = dateKey === toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

            return (
              <DayCell
                key={dateKey}
                dateKey={dateKey}
                day={day}
                isToday={isToday}
                dayTasks={tasksByDate[dateKey] ?? []}
                dayEvents={eventsByDate[dateKey] ?? []}
                onOpenDay={setSelectedDay}
                onOpenTask={setSelectedTaskId}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-card rounded-md px-2 py-1 shadow-lg border border-border text-xs w-[160px] truncate">
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DayViewPanel date={selectedDay} onClose={() => setSelectedDay(null)} />
      <TaskDetailPanel />
    </div>
  )
}