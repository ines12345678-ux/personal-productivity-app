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
import { useRemindersContext } from './context/reminders-context'
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

export default function OverviewPage() {
  const { tasks, setSelectedTaskId } = useTasksContext()
  const { getAreaName, getProjectName, getAreaColorDot } = useCategoriesContext()
  const { getEventsForDate } = usePlannerContext()
  const { reminders, addReminder, toggleReminder, deleteReminder, loading: remindersLoading } =
    useRemindersContext()

  const [newReminder, setNewReminder] = useState('')

  const today = todayISO()

  const addReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = newReminder.trim()
    if (!value) return
    await addReminder(value)
    setNewReminder('')
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
  // PLANNER / SEMANA
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
          const order = { high: 0, medium: 1, low: 2 }
          return order[a.priority] - order[b.priority]
        })

      const dayEvents = getEventsForDate(iso).sort((a, b) => a.time.localeCompare(b.time))

      return {
        iso,
        label: weekDayLabels[i],
        isToday: iso === today,
        count: dayTasks.length + dayEvents.length,
        tasks: dayTasks,
        events: dayEvents,
      }
    })
  }, [tasks, getEventsForDate, today])

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

      {/* RECORDATORIOS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Recordatorios</h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <form onSubmit={addReminderSubmit} className="flex gap-2">
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

          {remindersLoading ? (
            <p className="text-xs text-muted-foreground/60">Cargando recordatorios...</p>
          ) : reminders.length === 0 ? (
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

      {/* RESUMEN SEMANAL + ESTA SEMANA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Planner</h2>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Resumen semanal
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

          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-sm font-medium text-foreground">Esta semana</p>

            {weekDays.every((day) => day.tasks.length === 0 && day.events.length === 0) ? (
              <p className="text-xs text-muted-foreground/60">
                No hay nada planificado esta semana
              </p>
            ) : (
              <div className="space-y-3">
                {weekDays.map((day) => {
                  if (day.tasks.length === 0 && day.events.length === 0) return null

                  return (
                    <div key={day.iso} className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground capitalize">
                          {formatDateLabel(day.iso)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {day.tasks.length + day.events.length} items
                        </span>
                      </div>

                      {day.events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 rounded-lg bg-accent/40 border border-border px-3 py-2"
                        >
                          <CalendarClock className="w-3.5 h-3.5 shrink-0 text-accent-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs text-accent-foreground font-medium">
                              {event.time}
                            </p>
                            <p className="text-sm text-foreground truncate">{event.title}</p>
                          </div>
                        </div>
                      ))}

                      {day.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="w-full text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${priorityBar[task.priority]}`}
                            />
                            <p className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getAreaName(task.areaId)}
                            {task.projectId ? ` · ${getProjectName(task.projectId)}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ESTADÍSTICA */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Estadística</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Resumen general</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold text-foreground mt-1">{total}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Completadas</p>
                <p className="text-xl font-semibold text-foreground mt-1">{done}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="text-xl font-semibold text-foreground mt-1">{pending}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Vencidas</p>
                <p className="text-xl font-semibold text-destructive mt-1">{overdue.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Por prioridad</p>
            <div className="space-y-3">
              {(['high', 'medium', 'low'] as const).map((level) => (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-foreground">{level}</span>
                    <span className="text-muted-foreground">{byPriority[level]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        level === 'high'
                          ? 'bg-destructive'
                          : level === 'medium'
                            ? 'bg-chart-4'
                            : 'bg-muted-foreground/40'
                      }`}
                      style={{
                        width: `${(byPriority[level] / maxPriority) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-4 lg:col-span-2">
            <p className="text-sm font-medium text-foreground">Por área</p>
            <div className="space-y-3">
              {Object.entries(byArea).length === 0 ? (
                <p className="text-xs text-muted-foreground/60">No hay tareas todavía</p>
              ) : (
                Object.entries(byArea).map(([areaId, count]) => (
                  <div key={areaId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getAreaColorDot(areaId)}`} />
                        <span className="text-foreground">{getAreaName(areaId)}</span>
                      </div>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / maxArea) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TAREAS */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Tareas</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* HOY */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <ListTodo className="w-4 h-4" />
              Hoy
            </p>

            {dueToday.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">No tienes tareas para hoy</p>
            ) : (
              <div className="space-y-2">
                {dueToday.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityBar[task.priority]}`} />
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getAreaName(task.areaId)}
                      {task.projectId ? ` · ${getProjectName(task.projectId)}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRÓXIMAS */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" />
              Próximas
            </p>

            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">No hay próximas tareas</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full text-left rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityBar[task.priority]}`} />
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.dueDate ? formatShortDate(task.dueDate) : 'Sin fecha'} ·{' '}
                      {getAreaName(task.areaId)}
                      {task.projectId ? ` · ${getProjectName(task.projectId)}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <TaskDetailPanel />
    </div>
  )
}