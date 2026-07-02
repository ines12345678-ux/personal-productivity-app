// app/planner/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasksContext, Task } from '../context/tasks-context'
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

export default function PlannerPage() {
  const { tasks, setSelectedTaskId } = useTasksContext()
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.dueDate) return acc
      acc[task.dueDate] = [...(acc[task.dueDate] ?? []), task]
      return acc
    }, {})
  }, [tasks])

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

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

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="min-h-[110px]" />

          const dateKey = toISODate(year, month, day)
          const dayTasks = tasksByDate[dateKey] ?? []
          const isToday = dateKey === toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(dateKey)}
              className={`min-h-[110px] border rounded-lg p-2 bg-card flex flex-col gap-1 text-left hover:border-primary/50 transition
                ${isToday ? 'border-primary' : 'border-border'}`}
            >
              <span className={`text-xs ${isToday ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {day}
              </span>

              <div className="flex flex-col gap-1 overflow-y-auto">
                {dayTasks.map((task) => (
                  <span
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTaskId(task.id)
                    }}
                    className="flex items-center gap-1.5 text-left text-[11px] bg-muted/60 hover:bg-muted rounded px-1.5 py-1 truncate cursor-pointer"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                    <span className="truncate">{task.title}</span>
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <DayViewPanel date={selectedDay} onClose={() => setSelectedDay(null)} />
      <TaskDetailPanel />
    </div>
  )
}