// app/page.tsx
'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Plus,
} from 'lucide-react'
import { useTasksContext, Task } from './context/tasks-context'
import { useCategoriesContext } from './context/categories-context'
import { usePlannerContext } from './context/planner-context'
import { TaskDetailPanel } from './task-detail-panel'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const offset = (d.getDay() + 6) % 7 // lunes = 0
  d.setDate(d.getDate() - offset)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg className="w-32 h-32 -rotate-90">
        <circle cx="64" cy="64" r={radius} strokeWidth="10" className="stroke-muted fill-none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-primary fill-none transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-foreground">{percent}%</span>
        <span className="text-[11px] text-muted-foreground">completado</span>
      </div>
    </div>
  )
}

const priorityBar: Record<Task['priority'], string> = {
  low: 'bg-muted-foreground/40',
  medium: 'bg-chart-4',
  high: 'bg-destructive',
}

type Reminder = {
  id: string
  text: string
  done: boolean
}

export default function OverviewPage() {
  const { tasks, setSelectedTaskId } = useTasksContext()
  const { getAreaName, getProjectName, getAreaColorDot } = useCategoriesContext()
  const { getEventsForDate } = usePlannerContext()

  const today = todayISO()

  // =========================
  // RECORDATORIOS
  // =========================
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminder, setNewReminder] = useState('')

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault()
    const value = newReminder.trim()
    if (!value) return

    setReminders((prev) => [
      {
        id: crypto.randomUUID(),
        text: value,
        done: false,
      },
      ...prev,
    ])
    setNewReminder('')
  }

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    )
  }

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  // =========================
  // TASKS STATS
  // =========================
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const pending = total - done
  const completion = total === 0 ? 0 : Math.round((done / total) * 100)

  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  )

  const dueToday = tasks.filter((t) => t.dueDate === today && t.status !== 'done')

  const upcoming = tasks
    .filter((t) => t.dueDate && t.dueDate >= today && t.status !== 'done')
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 5)

  const byPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  }
  const maxPriority = Math.max(1, ...Object.values(byPriority))

  const byArea = tasks.reduce<Record<string, number>>((acc, t) => {
    const key = t.areaId ?? ''
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const maxArea = Math.max(1, ...Object.values(byArea))

  // =========================
  // ESTA SEMANA
  // =========================
  const weekStart = startOfWeek(new Date())
  const weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const iso = toISO(d)

      const dayTasks = tasks
        .filter((t) => t.dueDate === iso)
        .sort((a, b) => {
          const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2
          const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2
          return pa - pb
        })

      const dayEvents = getEventsForDate(iso)

      return {
        iso,
        label: weekDayLabels[i],
        isToday: iso === today,
        count: dayTasks.length + dayEvents.length,
        tasks: dayTasks,
        events: dayEvents,
      }
    })
  }, [tasks, getEventsForDate, today, weekStart])

  const maxWeekCount = Math.max(1, ...weekDays.map((d) => d.count))

  const weekRangeTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate >= weekDays[0].iso && t.dueDate <= weekDays[6].iso
  )
  const weekCompleted = weekRangeTasks.filter((t) => t.status === 'done').length
  const weekPending = weekRangeTasks.length - weekCompleted

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* OVERVIEW */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 bg-card border border-border rounded-2xl p-6">
        <ProgressRing percent={completion} />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-1">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tienes <span className="text-foreground font-medium">{pending}</span> tareas pendientes
            {overdue.length > 0 && (
              <> · <span className="text-destructive font-medium">{overdue.length} vencidas</span></>
            )}
            {dueToday.length > 0 && (
              <> · <span className="text-chart-4 font-medium">{dueToday.length} para hoy</span></>
            )}
          </p>
        </div>
      </div>

      {/* RECORDATORIOS - justo debajo de Overview */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Recordatorios</h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <form onSubmit={addReminder} className="flex gap-2">
            <input
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
              placeholder="Añadir recordatorio..."
              className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Añadir
            </button>
          </form>

          {reminders.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">
              No tienes recordatorios todavía
            </p>
          ) : (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <input
                    type="checkbox"
                    checked={reminder.done}
                    onChange={() => toggleReminder(reminder.id)}
                    className="shrink-0"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      reminder.done
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {reminder.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ESTA SEMANA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Esta semana</h2>
        </div>

        {/* BLOQUES POR DÍA - primero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weekDays.map((day) => {
            const hasTasks = day.tasks.length > 0
            const hasEvents = day.events.length > 0

            return (
              <div
                key={day.iso}
                className={`bg-card border rounded-xl p-4 space-y-3 ${
                  day.isToday ? 'border-primary/40' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {formatDateLabel(day.iso)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.tasks.length} tareas · {day.events.length} eventos
                    </p>
                  </div>

                  {day.isToday && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Hoy
                    </span>
                  )}
                </div>

                {!hasTasks && !hasEvents && (
                  <p className="text-xs text-muted-foreground/60">Nada programado</p>
                )}

                {hasEvents && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Agenda</p>
                    {day.events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-2 bg-accent/40"
                      >
                        <span className="text-xs text-muted-foreground w-14 shrink-0">
                          {event.time}
                        </span>
                        <span className="text-sm text-accent-foreground truncate">
                          {event.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {hasTasks && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Tareas</p>
                    {day.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="w-full flex items-start gap-2 rounded-lg border border-border p-2 hover:bg-muted/50 text-left"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${priorityBar[task.priority]}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* RESUMEN SEMANAL - debajo de los días, dentro de la misma sección */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Resumen semanal
          </p>

          <div className="flex items-end justify-between gap-2 h-24">
            {weekDays.map((d) => (
              <div key={d.iso} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-sm ${d.isToday ? 'bg-primary' : 'bg-chart-1'}`}
                    style={{
                      height: `${(d.count / maxWeekCount) * 100}%`,
                      minHeight: d.count > 0 ? '6px' : '2px',
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    d.isToday ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
            <span>{weekCompleted} completadas</span>
            <span>{weekPending} pendientes</span>
          </div>
        </div>
      </section>

      {/* TAREAS - al final, manteniendo stats dentro */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Tareas</h2>
        </div>

        {/* HOY */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <ListTodo className="w-4 h-4" /> Hoy
          </p>

          {dueToday.length === 0 && (
            <p className="text-xs text-muted-foreground/60">No tienes tareas para hoy</p>
          )}

          {dueToday.length > 0 && (
            <div className="space-y-1.5">
              {dueToday.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="w-full flex items-center gap-2 rounded-lg border border-border p-2 hover:bg-muted/50 text-left"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityBar[task.priority]}`} />
                  <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-semibold text-foreground mt-1">{total}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completadas
            </p>
            <p className="text-xl font-semibold text-foreground mt-1">{done}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" /> Pendientes
            </p>
            <p className="text-xl font-semibold text-foreground mt-1">{pending}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Vencidas
            </p>
            <p className={`text-xl font-semibold mt-1 ${overdue.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {overdue.length}
            </p>
          </div>
        </div>

        {/* PRIORIDAD + ÁREA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Por prioridad</p>
            {(['high', 'medium', 'low'] as const).map((p) => (
              <div key={p} className="flex items-center gap-3">
                <span className="text-xs w-16 capitalize text-muted-foreground">{p}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${priorityBar[p]}`}
                    style={{ width: `${(byPriority[p] / maxPriority) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4 text-right">{byPriority[p]}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Por área</p>
            {Object.entries(byArea).map(([areaId, count]) => (
              <div key={areaId} className="flex items-center gap-3">
                <span className="text-xs w-20 truncate text-muted-foreground">
                  {getAreaName(areaId)}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getAreaColorDot(areaId || null)}`}
                    style={{ width: `${(count / maxArea) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
              </div>
            ))}
            {Object.keys(byArea).length === 0 && (
              <p className="text-xs text-muted-foreground/60">Sin datos todavía</p>
            )}
          </div>
        </div>

        {/* VENCIDAS */}
        {overdue.length > 0 && (
          <div className="border border-destructive/30 bg-destructive/5 rounded-xl divide-y divide-destructive/10">
            <div className="px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">Necesitan atención</p>
            </div>
            {overdue.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/5 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                  </p>
                </div>
                <span className="text-xs text-destructive font-medium">
                  {formatShortDate(task.dueDate!)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* PRÓXIMAS TAREAS */}
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="px-4 py-3">
            <p className="text-sm font-medium text-foreground">Próximas tareas</p>
          </div>
          {upcoming.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-6">
              No hay tareas próximas
            </p>
          )}
          {upcoming.map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityBar[task.priority]}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getAreaName(task.areaId)} · {getProjectName(task.projectId)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatShortDate(task.dueDate!)}
              </span>
            </button>
          ))}
        </div>
      </section>

      <TaskDetailPanel />
    </div>
  )
}